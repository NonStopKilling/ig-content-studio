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
const usersPath = path.join(dataDir, "users.json");

const port = Number(process.env.PORT || 4173);
let databasePool = null;
let storageMode = "file";
const sessionStore = new Map();
const sessionCookieName = "content_studio_session";
const defaultAdminUsername = process.env.CONTENT_STUDIO_ADMIN_USER || "admin";
const defaultAdminPassword = process.env.CONTENT_STUDIO_ADMIN_PASSWORD || "admin1234";

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
      storageMode = "mysql";
      const databaseState = await loadStateFromDatabase();

      if (databaseState) {
        await saveFileState(databaseState);
      } else {
        await saveStateToDatabase(fileState);
        await saveFileState(fileState);
      }

      await ensureAuthUsers();
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
  await ensureAuthUsers();
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

  await databasePool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(120) PRIMARY KEY,
      client_id VARCHAR(120) NULL,
      role VARCHAR(20) NOT NULL,
      username VARCHAR(120) NOT NULL UNIQUE,
      email VARCHAR(190) NULL,
      password_hash VARCHAR(255) NOT NULL,
      must_change_password TINYINT(1) NOT NULL DEFAULT 0,
      login_count INT NOT NULL DEFAULT 0,
      last_login_at VARCHAR(80) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at VARCHAR(80) NULL,
      updated_at VARCHAR(80) NULL,
      INDEX (client_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Backward-compatible migration for existing installations.
  try {
    await databasePool.query("ALTER TABLE users ADD COLUMN email VARCHAR(190) NULL");
  } catch {
    // Column likely already exists.
  }
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, existingHash] = storedHash.split(":");
  const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(existingHash, "hex"), Buffer.from(computedHash, "hex"));
}

function normalizeUser(user) {
  return {
    id: String(user.id || `user-${crypto.randomBytes(8).toString("hex")}`),
    clientId: user.clientId || null,
    role: user.role === "admin" ? "admin" : "cliente",
    username: String(user.username || "").trim().toLowerCase(),
    email: String(user.email || "").trim().toLowerCase() || null,
    passwordHash: String(user.passwordHash || ""),
    mustChangePassword: user.mustChangePassword === true,
    loginCount: Number(user.loginCount || 0),
    lastLoginAt: user.lastLoginAt || null,
    isActive: user.isActive !== false,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString()
  };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    clientId: user.clientId,
    role: user.role,
    username: user.username,
    email: user.email || null,
    mustChangePassword: Boolean(user.mustChangePassword),
    loginCount: Number(user.loginCount || 0),
    lastLoginAt: user.lastLoginAt || null,
    isActive: user.isActive !== false
  };
}

async function loadFileUsers() {
  try {
    const rawUsers = await fs.readFile(usersPath, "utf8");
    const parsed = JSON.parse(rawUsers);
    return Array.isArray(parsed) ? parsed.map(normalizeUser) : [];
  } catch {
    return [];
  }
}

async function saveFileUsers(users) {
  await fs.writeFile(usersPath, JSON.stringify(users.map(normalizeUser), null, 2), "utf8");
}

async function loadUsersFromDatabase() {
  const [rows] = await databasePool.query("SELECT * FROM users ORDER BY created_at ASC, username ASC");
  return rows.map((row) => normalizeUser({
    id: row.id,
    clientId: row.client_id || null,
    role: row.role,
    username: row.username,
    email: row.email || null,
    passwordHash: row.password_hash,
    mustChangePassword: Number(row.must_change_password) === 1,
    loginCount: Number(row.login_count || 0),
    lastLoginAt: row.last_login_at || null,
    isActive: Number(row.is_active) === 1,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  }));
}

async function saveUsersToDatabase(users) {
  const normalizedUsers = users.map(normalizeUser);
  const connection = await databasePool.getConnection();

  try {
    await connection.beginTransaction();
    const userIds = normalizedUsers.map((user) => user.id);
    if (userIds.length) {
      await connection.query("DELETE FROM users WHERE id NOT IN (?)", [userIds]);
    }

    for (const user of normalizedUsers) {
      await connection.query(
        `REPLACE INTO users
          (id, client_id, role, username, email, password_hash, must_change_password, login_count, last_login_at, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.clientId,
          user.role,
          user.username,
          user.email,
          user.passwordHash,
          user.mustChangePassword ? 1 : 0,
          Number(user.loginCount || 0),
          user.lastLoginAt,
          user.isActive === false ? 0 : 1,
          user.createdAt,
          new Date().toISOString()
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function loadUsers() {
  if (storageMode === "mysql" && databasePool) {
    const users = await loadUsersFromDatabase();
    await saveFileUsers(users);
    return users;
  }

  return loadFileUsers();
}

async function saveUsers(users) {
  const normalizedUsers = users.map(normalizeUser);
  if (storageMode === "mysql" && databasePool) {
    await saveUsersToDatabase(normalizedUsers);
  }
  await saveFileUsers(normalizedUsers);
}

function createDefaultAdminUser() {
  const timestamp = new Date().toISOString();
  return normalizeUser({
    id: "admin-local",
    clientId: null,
    role: "admin",
    username: defaultAdminUsername,
    email: "admin@local",
    passwordHash: createPasswordHash(defaultAdminPassword),
    mustChangePassword: false,
    loginCount: 0,
    lastLoginAt: null,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

async function ensureAuthUsers() {
  const users = await loadUsers();
  if (users.length) return;

  const adminUser = createDefaultAdminUser();
  await saveUsers([adminUser]);
  console.log(`Bootstrap admin user created: ${defaultAdminUsername}`);
}

function parseCookies(request) {
  const header = request.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const separatorIndex = chunk.indexOf("=");
        if (separatorIndex === -1) return [chunk, ""];
        return [chunk.slice(0, separatorIndex), decodeURIComponent(chunk.slice(separatorIndex + 1))];
      })
  );
}

function buildSessionCookie(token, maxAgeSeconds) {
  return `${sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function parseJsonBody(body) {
  try {
    return JSON.parse(body || "{}");
  } catch {
    return {};
  }
}

function isValidRole(role) {
  return role === "admin" || role === "cliente";
}

function sanitizeNullableString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

async function requireAdmin(response, authenticatedUser) {
  if (!authenticatedUser) {
    sendJson(response, 401, { ok: false, error: "No autorizado." });
    return false;
  }

  if (authenticatedUser.role !== "admin") {
    sendJson(response, 403, { ok: false, error: "Acceso solo para admin." });
    return false;
  }

  return true;
}

async function getAuthenticatedUser(request) {
  const cookies = parseCookies(request);
  const token = cookies[sessionCookieName];
  if (!token || !sessionStore.has(token)) return null;

  const session = sessionStore.get(token);
  const users = await loadUsers();
  const user = users.find((item) => item.id === session.userId && item.isActive !== false);
  if (!user) {
    sessionStore.delete(token);
    return null;
  }

  return user;
}

function filterStateForUser(state, user) {
  if (!user || user.role === "admin") return migrateState(state);

  const client = state.clients.find((item) => item.id === user.clientId);
  const projects = state.projects.filter((item) => item.clientId === user.clientId);

  return migrateState({
    ...state,
    clients: client ? [client] : [],
    activeClientId: user.clientId,
    projects,
    activeProjectId: projects.find((item) => item.id === state.activeProjectId)?.id || (projects[0] ? projects[0].id : "")
  });
}

function normalizeClientPayload(client, existingClientId) {
  return {
    id: existingClientId,
    name: client?.name || "Cliente",
    logoDataUrl: client?.logoDataUrl || "",
    logoPath: client?.logoPath || "",
    primaryColor: client?.primaryColor || "#9bd80d",
    secondaryColor: client?.secondaryColor || "#f0ecdc",
    darkColor: client?.darkColor || "#071018",
    accentColor: client?.accentColor || "#40d8ff",
    logoWidth: Number(client?.logoWidth || 20),
    backgrounds: Array.isArray(client?.backgrounds) ? client.backgrounds : []
  };
}

function mergeClientScopedState(globalState, incomingState, user) {
  if (user.role === "admin") {
    return migrateState(incomingState);
  }

  const nextState = migrateState(globalState);
  const incomingClient = Array.isArray(incomingState.clients)
    ? incomingState.clients.find((item) => item.id === user.clientId) || incomingState.clients[0]
    : null;

  nextState.clients = nextState.clients.map((client) => (
    client.id === user.clientId ? normalizeClientPayload(incomingClient || client, user.clientId) : client
  ));

  const incomingProjects = Array.isArray(incomingState.projects)
    ? incomingState.projects.map((project) => ({
        ...project,
        id: project.id || `project-${crypto.randomBytes(8).toString("hex")}`,
        clientId: user.clientId,
        updatedAt: project.updatedAt || new Date().toISOString(),
        slides: Array.isArray(project.slides) ? project.slides : []
      }))
    : [];

  nextState.projects = [
    ...nextState.projects.filter((project) => project.clientId !== user.clientId),
    ...incomingProjects
  ];
  nextState.activeClientId = user.clientId;
  nextState.activeProjectId = incomingProjects.find((project) => project.id === incomingState.activeProjectId)?.id || (incomingProjects[0] ? incomingProjects[0].id : "");

  return migrateState(nextState);
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

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
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
  if (request.method === "POST" && pathname === "/api/auth/login") {
    const body = await readBody(request);
    const payload = parseJsonBody(body);
    const loginIdentifier = String(payload.username || payload.email || payload.identifier || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const users = await loadUsers();
    const user = users.find((item) => (
      item.isActive !== false
      && (item.username === loginIdentifier || item.email === loginIdentifier)
    ));

    if (!user || !verifyPassword(password, user.passwordHash)) {
      sendJson(response, 401, { ok: false, error: "Credenciales invalidas." });
      return;
    }

    user.loginCount = Number(user.loginCount || 0) + 1;
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    await saveUsers(users);

    const token = crypto.randomBytes(24).toString("hex");
    sessionStore.set(token, { userId: user.id, createdAt: Date.now() });
    sendJson(response, 200, { ok: true, user: sanitizeUser(user) }, {
      "Set-Cookie": buildSessionCookie(token, 60 * 60 * 24 * 7)
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/logout") {
    const cookies = parseCookies(request);
    const token = cookies[sessionCookieName];
    if (token) sessionStore.delete(token);
    sendJson(response, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
    return;
  }

  if (request.method === "GET" && pathname === "/api/auth/me") {
    const user = await getAuthenticatedUser(request);
    sendJson(response, 200, {
      ok: true,
      authenticated: Boolean(user),
      user: user ? sanitizeUser(user) : null
    });
    return;
  }

  const authenticatedUser = await getAuthenticatedUser(request);

  const exportFileMatch = pathname.match(/^\/api\/export\/file\/([^/]+)$/);
  if (request.method === "GET" && exportFileMatch) {
    if (!authenticatedUser) {
      sendJson(response, 401, { ok: false, error: "No autorizado." });
      return;
    }

    const fileName = path.basename(decodeURIComponent(exportFileMatch[1] || ""));
    if (!fileName) {
      sendJson(response, 400, { ok: false, error: "Archivo invalido." });
      return;
    }

    const filePath = path.join(exportsDir, fileName);
    if (!filePath.startsWith(exportsDir)) {
      sendJson(response, 403, { ok: false, error: "Ruta invalida." });
      return;
    }

    try {
      const content = await fs.readFile(filePath);
      const contentType = mimeTypes[path.extname(fileName).toLowerCase()] || "application/octet-stream";
      response.writeHead(200, {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
        "Cache-Control": "no-store"
      });
      response.end(content);
    } catch {
      sendJson(response, 404, { ok: false, error: "Archivo no encontrado." });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/api/admin/users") {
    if (!(await requireAdmin(response, authenticatedUser))) return;
    const users = await loadUsers();
    const state = await loadState();
    sendJson(response, 200, {
      ok: true,
      users: users.map(sanitizeUser),
      clients: state.clients
    });
    return;
  }

  if (request.method === "POST" && pathname === "/api/admin/users") {
    if (!(await requireAdmin(response, authenticatedUser))) return;

    const body = await readBody(request);
    const payload = parseJsonBody(body);
    const username = String(payload.username || "").trim().toLowerCase();
    const email = sanitizeNullableString(payload.email)?.toLowerCase() || null;
    const role = payload.role === "admin" ? "admin" : "cliente";
    const password = String(payload.password || "");
    const clientId = sanitizeNullableString(payload.clientId);

    if (!username || !password) {
      sendJson(response, 400, { ok: false, error: "Usuario y contraseña son obligatorios." });
      return;
    }

    if (!isValidRole(role)) {
      sendJson(response, 400, { ok: false, error: "Rol invalido." });
      return;
    }

    if (role === "cliente" && !clientId) {
      sendJson(response, 400, { ok: false, error: "Debes asignar un cliente al usuario cliente." });
      return;
    }

    const users = await loadUsers();
    const usernameExists = users.some((item) => item.username === username);
    if (usernameExists) {
      sendJson(response, 409, { ok: false, error: "Ese usuario ya existe." });
      return;
    }

    if (email && users.some((item) => item.email && item.email === email)) {
      sendJson(response, 409, { ok: false, error: "Ese correo ya existe." });
      return;
    }

    const nextUser = normalizeUser({
      id: `user-${crypto.randomBytes(8).toString("hex")}`,
      clientId: role === "admin" ? null : clientId,
      role,
      username,
      email,
      passwordHash: createPasswordHash(password),
      mustChangePassword: payload.mustChangePassword === true,
      isActive: payload.isActive !== false
    });

    users.push(nextUser);
    await saveUsers(users);
    sendJson(response, 201, { ok: true, user: sanitizeUser(nextUser) });
    return;
  }

  const adminUserUpdateMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (request.method === "PUT" && adminUserUpdateMatch) {
    if (!(await requireAdmin(response, authenticatedUser))) return;

    const targetUserId = decodeURIComponent(adminUserUpdateMatch[1]);
    const body = await readBody(request);
    const payload = parseJsonBody(body);

    const users = await loadUsers();
    const user = users.find((item) => item.id === targetUserId);
    if (!user) {
      sendJson(response, 404, { ok: false, error: "Usuario no encontrado." });
      return;
    }

    const nextUsername = payload.username ? String(payload.username).trim().toLowerCase() : user.username;
    const nextEmail = payload.email === undefined ? (user.email || null) : (sanitizeNullableString(payload.email)?.toLowerCase() || null);
    const nextRole = payload.role === undefined ? user.role : (payload.role === "admin" ? "admin" : "cliente");
    const nextClientId = payload.clientId === undefined
      ? user.clientId
      : (sanitizeNullableString(payload.clientId));

    if (!nextUsername) {
      sendJson(response, 400, { ok: false, error: "Usuario invalido." });
      return;
    }

    if (nextRole === "cliente" && !nextClientId) {
      sendJson(response, 400, { ok: false, error: "Debes asignar un cliente al usuario cliente." });
      return;
    }

    const duplicateUsername = users.some((item) => item.id !== user.id && item.username === nextUsername);
    if (duplicateUsername) {
      sendJson(response, 409, { ok: false, error: "Ese usuario ya existe." });
      return;
    }

    if (nextEmail && users.some((item) => item.id !== user.id && item.email && item.email === nextEmail)) {
      sendJson(response, 409, { ok: false, error: "Ese correo ya existe." });
      return;
    }

    user.username = nextUsername;
    user.email = nextEmail;
    user.role = nextRole;
    user.clientId = nextRole === "admin" ? null : nextClientId;
    user.isActive = payload.isActive === undefined ? user.isActive : payload.isActive !== false;
    user.mustChangePassword = payload.mustChangePassword === undefined ? user.mustChangePassword : payload.mustChangePassword === true;
    user.updatedAt = new Date().toISOString();

    const nextPassword = String(payload.password || "").trim();
    if (nextPassword) {
      user.passwordHash = createPasswordHash(nextPassword);
      user.mustChangePassword = false;
    }

    await saveUsers(users);
    sendJson(response, 200, { ok: true, user: sanitizeUser(user) });
    return;
  }

  if (request.method === "GET" && pathname === "/api/state") {
    if (!authenticatedUser) {
      sendJson(response, 401, { ok: false, error: "No autorizado." });
      return;
    }

    const state = await loadState();
    sendJson(response, 200, filterStateForUser(state, authenticatedUser));
    return;
  }

  if (request.method === "POST" && pathname === "/api/state") {
    if (!authenticatedUser) {
      sendJson(response, 401, { ok: false, error: "No autorizado." });
      return;
    }

    const body = await readBody(request);
    const incomingState = JSON.parse(body);
    const currentState = await loadState();
    const nextState = mergeClientScopedState(currentState, incomingState, authenticatedUser);
    await saveState(nextState);
    sendJson(response, 200, { ok: true, storageMode });
    return;
  }

  if (request.method === "POST" && pathname === "/api/export") {
    if (!authenticatedUser) {
      sendJson(response, 401, { ok: false, error: "No autorizado." });
      return;
    }

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
