const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

let mysql = null;
try {
  mysql = require("mysql2/promise");
} catch {
  mysql = null;
}

const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const resourcesDir = path.join(rootDir, "resources");
const dataDir = path.join(rootDir, "data");
const exportsDir = path.join(rootDir, "exports");
const statePath = path.join(dataDir, "state.json");

const port = Number(process.env.PORT || 4173);
let databasePool = null;
let storageMode = "file";

const databaseConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "content_studio",
  charset: "utf8mb4"
};

const defaultState = {
  clients: [
    {
      id: "area3",
      name: "Area3",
      logoDataUrl: "",
      logoPath: "/resources/img/area3.png",
      primaryColor: "#9bd80d",
      secondaryColor: "#f2f0e6",
      darkColor: "#071018",
      accentColor: "#40d8ff",
      logoWidth: 20,
      backgrounds: []
    }
  ],
  activeClientId: "area3",
  projects: [
    {
      id: "demo-area3",
      clientId: "area3",
      name: "Carrusel demo Area3",
      updatedAt: new Date().toISOString(),
      slides: [
        {
          id: "slide-cover",
          templateId: "cover-tech",
          title: "Tu web no vende si nadie confía",
          eyebrow: "Checklist ecommerce",
          body: "5 señales que puedes corregir esta semana.",
          cta: "Guarda este post",
          textScale: "balanced",
          showDecorations: false,
          backgroundDataUrl: ""
        },
        {
          id: "slide-tip",
          templateId: "tip-editorial",
          title: "Emprender también necesita método.",
          eyebrow: "Tip para fondos",
          body: "Antes de postular, define problema, solución, mercado y evidencia.",
          cta: "Area3 · Creamos tu web ideal",
          textScale: "balanced",
          showDecorations: false,
          backgroundDataUrl: ""
        },
        {
          id: "slide-checklist",
          templateId: "checklist",
          title: "Checklist para mejorar tu ecommerce",
          eyebrow: "Venta online",
          body: "Carga rápido. Muestra precios claros. Facilita el pago. Responde dudas frecuentes.",
          cta: "4 puntos que sí mueven la aguja",
          textScale: "balanced",
          showDecorations: true,
          backgroundDataUrl: ""
        },
        {
          id: "slide-cta",
          templateId: "cta",
          title: "¿Tu negocio necesita vender mejor online?",
          eyebrow: "Desarrollo web",
          body: "Creamos sitios, correos y tiendas ecommerce con foco comercial.",
          cta: "Conversemos",
          textScale: "balanced",
          showDecorations: false,
          backgroundDataUrl: ""
        },
        {
          id: "slide-funds",
          templateId: "tip-editorial",
          title: "Un fondo no financia ideas vagas.",
          eyebrow: "Sercotec / crowdfunding",
          body: "Financia una oportunidad clara, medible y bien explicada.",
          cta: "Prepara tu propuesta con método",
          textScale: "compact",
          showDecorations: false,
          backgroundDataUrl: ""
        },
        {
          id: "slide-free",
          templateId: "free",
          title: "Lámina libre",
          eyebrow: "Formato flexible",
          body: "Usa esta plantilla para contenido puntual, frases, avisos o ideas que no calzan en una estructura fija.",
          cta: "Area3",
          textScale: "balanced",
          showDecorations: false,
          backgroundDataUrl: ""
        }
      ]
    }
  ],
  activeProjectId: "demo-area3"
};

const starterSlides = defaultState.projects[0].slides;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(exportsDir, { recursive: true });

  const fileState = await loadFileState();

  if (mysql) {
    try {
      databasePool = await mysql.createPool({
        ...databaseConfig,
        waitForConnections: true,
        connectionLimit: 10
      });
      await ensureDatabaseSchema();
      const databaseState = await loadStateFromDatabase();

      if (databaseState) {
        await saveFileState(databaseState);
      } else {
        await saveStateToDatabase(fileState);
        await saveFileState(fileState);
      }

      storageMode = "mysql";
      console.log(`Storage: MySQL ${databaseConfig.database}`);
      return;
    } catch (error) {
      databasePool = null;
      storageMode = "file";
      console.warn(`MySQL unavailable, using file storage: ${error.message}`);
    }
  } else {
    console.warn("mysql2 dependency not installed, using file storage.");
  }

  await saveFileState(fileState);
}

async function loadFileState() {
  try {
    await fs.access(statePath);
    const rawState = await fs.readFile(statePath, "utf8");
    return migrateState(JSON.parse(rawState));
  } catch {
    return migrateState(defaultState);
  }
}

async function saveFileState(state) {
  await fs.writeFile(statePath, JSON.stringify(migrateState(state), null, 2), "utf8");
}

async function ensureDatabaseSchema() {
  await databasePool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(120) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      logo_data_url LONGTEXT NULL,
      logo_path VARCHAR(500) NULL,
      primary_color VARCHAR(20) NOT NULL,
      secondary_color VARCHAR(20) NOT NULL,
      dark_color VARCHAR(20) NOT NULL,
      accent_color VARCHAR(20) NOT NULL,
      logo_width INT NULL,
      backgrounds LONGTEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Backward-compatible migration for existing installations.
  try {
    await databasePool.query("ALTER TABLE clients ADD COLUMN logo_width INT NULL");
  } catch {
    // Column likely already exists.
  }

  await databasePool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(120) PRIMARY KEY,
      client_id VARCHAR(120) NOT NULL,
      name VARCHAR(255) NOT NULL,
      slides LONGTEXT NOT NULL,
      updated_at VARCHAR(80) NULL,
      INDEX (client_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await databasePool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(120) PRIMARY KEY,
      setting_value LONGTEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await databasePool.query(`
    CREATE TABLE IF NOT EXISTS exports (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      project_id VARCHAR(120) NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(1000) NOT NULL,
      data_url LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function loadStateFromDatabase() {
  const [clientRows] = await databasePool.query("SELECT * FROM clients ORDER BY updated_at DESC, name ASC");
  if (!clientRows.length) return null;

  const [projectRows] = await databasePool.query("SELECT * FROM projects ORDER BY name ASC");
  const [settingRows] = await databasePool.query("SELECT setting_key, setting_value FROM app_settings");
  const settings = Object.fromEntries(settingRows.map((row) => [row.setting_key, row.setting_value]));

  return migrateState({
    clients: clientRows.map((row) => ({
      id: row.id,
      name: row.name,
      logoDataUrl: row.logo_data_url || "",
      logoPath: row.logo_path || "",
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      darkColor: row.dark_color,
      accentColor: row.accent_color,
      logoWidth: Number(row.logo_width || 20),
      backgrounds: safeJsonParse(row.backgrounds, [])
    })),
    activeClientId: settings.activeClientId || clientRows[0].id,
    projects: projectRows.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      updatedAt: row.updated_at || new Date().toISOString(),
      slides: safeJsonParse(row.slides, [])
    })),
    activeProjectId: settings.activeProjectId || (projectRows[0] ? projectRows[0].id : "")
  });
}

async function saveStateToDatabase(state) {
  const nextState = migrateState(state);
  const connection = await databasePool.getConnection();

  try {
    await connection.beginTransaction();

    const clientIds = nextState.clients.map((client) => client.id);
    const projectIds = nextState.projects.map((project) => project.id);

    if (clientIds.length) {
      await connection.query("DELETE FROM clients WHERE id NOT IN (?)", [clientIds]);
    }
    if (projectIds.length) {
      await connection.query("DELETE FROM projects WHERE id NOT IN (?)", [projectIds]);
    }

    for (const client of nextState.clients) {
      await connection.query(
        `REPLACE INTO clients
          (id, name, logo_data_url, logo_path, primary_color, secondary_color, dark_color, accent_color, logo_width, backgrounds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.id,
          client.name,
          client.logoDataUrl || "",
          client.logoPath || "",
          client.primaryColor || "#9bd80d",
          client.secondaryColor || "#f0ecdc",
          client.darkColor || "#071018",
          client.accentColor || "#40d8ff",
          Number(client.logoWidth || 20),
          JSON.stringify(client.backgrounds || [])
        ]
      );
    }

    for (const project of nextState.projects) {
      await connection.query(
        `REPLACE INTO projects (id, client_id, name, slides, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          project.id,
          project.clientId,
          project.name,
          JSON.stringify(project.slides || []),
          project.updatedAt || new Date().toISOString()
        ]
      );
    }

    await connection.query(
      "REPLACE INTO app_settings (setting_key, setting_value) VALUES (?, ?), (?, ?)",
      ["activeClientId", nextState.activeClientId, "activeProjectId", nextState.activeProjectId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function loadState() {
  if (storageMode === "mysql" && databasePool) {
    const state = await loadStateFromDatabase();
    if (state) return state;
  }
  return loadFileState();
}

async function saveState(state) {
  const nextState = migrateState(state);
  if (storageMode === "mysql" && databasePool) {
    await saveStateToDatabase(nextState);
  }
  await saveFileState(nextState);
}

function migrateState(state) {
  const nextState = {
    ...defaultState,
    ...state,
    clients: Array.isArray(state.clients) ? state.clients : defaultState.clients,
    projects: Array.isArray(state.projects) ? state.projects : defaultState.projects
  };

  nextState.clients = nextState.clients.map((client) => {
    const nextClient = { ...client };
    if (!Array.isArray(nextClient.backgrounds)) {
      nextClient.backgrounds = [];
    }
    if (nextClient.id === "area3" && !nextClient.logoDataUrl && !nextClient.logoPath) {
      nextClient.logoPath = "/resources/img/area3.png";
    }
    nextClient.logoWidth = Number(nextClient.logoWidth || 20);
    return nextClient;
  });

  nextState.projects = nextState.projects.map((project) => {
    const slides = Array.isArray(project.slides) ? project.slides : [];
    const normalizedSlides = slides.map((slide) => ({
      textScale: "balanced",
      showDecorations: false,
      backgroundId: "",
      backgroundDataUrl: "",
      ...slide
    }));

    if (project.id === "demo-area3" && normalizedSlides.length < starterSlides.length) {
      const existingIds = new Set(normalizedSlides.map((slide) => slide.id));
      starterSlides.forEach((starterSlide) => {
        if (!existingIds.has(starterSlide.id)) {
          normalizedSlides.push({ ...starterSlide });
        }
      });
    }

    return {
      ...project,
      slides: normalizedSlides
    };
  });

  return nextState;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 60 * 1024 * 1024) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function safeExportName(projectName, slideIndex, extension) {
  const slug = String(projectName || "instagram-post")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  const suffix = crypto.randomBytes(3).toString("hex");
  return `${slug || "instagram-post"}-${String(slideIndex + 1).padStart(2, "0")}-${suffix}.${extension}`;
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/state") {
    sendJson(response, 200, await loadState());
    return;
  }

  if (request.method === "POST" && pathname === "/api/state") {
    const body = await readBody(request);
    const state = JSON.parse(body);
    await saveState(state);
    sendJson(response, 200, { ok: true, storageMode });
    return;
  }

  if (request.method === "POST" && pathname === "/api/export") {
    const body = await readBody(request);
    const payload = JSON.parse(body);
    const match = String(payload.dataUrl || "").match(/^data:image\/(png|jpeg);base64,(.+)$/);

    if (!match) {
      sendJson(response, 400, { ok: false, error: "Invalid image data URL" });
      return;
    }

    const extension = match[1] === "jpeg" ? "jpg" : "png";
    const fileName = safeExportName(payload.projectName, Number(payload.slideIndex || 0), extension);
    const filePath = path.join(exportsDir, fileName);
    await fs.writeFile(filePath, Buffer.from(match[2], "base64"));

    if (storageMode === "mysql" && databasePool) {
      await databasePool.query(
        "INSERT INTO exports (project_id, file_name, file_path, data_url) VALUES (?, ?, ?, ?)",
        [payload.projectId || null, fileName, filePath, payload.dataUrl]
      );
    }

    sendJson(response, 200, {
      ok: true,
      fileName,
      filePath,
      storageMode
    });
    return;
  }

  sendJson(response, 404, { ok: false, error: "API route not found" });
}

async function serveStatic(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const baseDir = decodedPath.startsWith("/resources/") ? rootDir : publicDir;
  const relativePath = decodedPath.replace(/^[/\\]+/, "");
  const filePath = path.normalize(path.join(baseDir, relativePath));

  if (!filePath.startsWith(baseDir) || (decodedPath.startsWith("/resources/") && !filePath.startsWith(resourcesDir))) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

async function start() {
  await ensureStorage();

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url.pathname);
      } else {
        await serveStatic(response, url.pathname);
      }
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message });
    }
  });

  server.listen(port, () => {
    console.log(`Instagram Content Studio: http://localhost:${port}`);
  });
}

start();
