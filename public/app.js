const templates = [
  {
    id: "cover-tech",
    name: "Portada tech",
    description: "Aspiracional, venta y autoridad."
  },
  {
    id: "tip-editorial",
    name: "Tip editorial",
    description: "Consejo guardable y cercano."
  },
  {
    id: "checklist",
    name: "Checklist",
    description: "Lista educativa de alto valor."
  },
  {
    id: "cta",
    name: "Venta / CTA",
    description: "Llamado comercial directo."
  },
  {
    id: "free",
    name: "Libre",
    description: "Lámina flexible y limpia."
  }
];

let state;
let activeSlideIndex = 0;
let autosaveTimer = null;

const elements = {
  clientSelect: document.querySelector("#clientSelect"),
  clientNameInput: document.querySelector("#clientNameInput"),
  primaryColorInput: document.querySelector("#primaryColorInput"),
  secondaryColorInput: document.querySelector("#secondaryColorInput"),
  darkColorInput: document.querySelector("#darkColorInput"),
  accentColorInput: document.querySelector("#accentColorInput"),
  logoInput: document.querySelector("#logoInput"),
  newClientButton: document.querySelector("#newClientButton"),
  projectSelect: document.querySelector("#projectSelect"),
  projectNameInput: document.querySelector("#projectNameInput"),
  newProjectButton: document.querySelector("#newProjectButton"),
  saveButton: document.querySelector("#saveButton"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  exportAllButton: document.querySelector("#exportAllButton"),
  jsonInput: document.querySelector("#jsonInput"),
  addSlideButton: document.querySelector("#addSlideButton"),
  duplicateSlideButton: document.querySelector("#duplicateSlideButton"),
  exportCurrentButton: document.querySelector("#exportCurrentButton"),
  slideList: document.querySelector("#slideList"),
  postCanvas: document.querySelector("#postCanvas"),
  templateSelect: document.querySelector("#templateSelect"),
  textScaleSelect: document.querySelector("#textScaleSelect"),
  decorationsInput: document.querySelector("#decorationsInput"),
  eyebrowInput: document.querySelector("#eyebrowInput"),
  titleInput: document.querySelector("#titleInput"),
  bodyInput: document.querySelector("#bodyInput"),
  ctaInput: document.querySelector("#ctaInput"),
  backgroundSelect: document.querySelector("#backgroundSelect"),
  backgroundInput: document.querySelector("#backgroundInput"),
  clearBackgroundButton: document.querySelector("#clearBackgroundButton"),
  formatSelect: document.querySelector("#formatSelect"),
  qualityInput: document.querySelector("#qualityInput"),
  statusBox: document.querySelector("#statusBox")
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function getActiveClient() {
  return state.clients.find((client) => client.id === state.activeClientId) || state.clients[0];
}

function getActiveProject() {
  return state.projects.find((project) => project.id === state.activeProjectId) || state.projects[0];
}

function getActiveSlide() {
  const project = getActiveProject();
  if (!project.slides.length) {
    project.slides.push(createSlide("cover-tech"));
  }
  activeSlideIndex = Math.min(activeSlideIndex, project.slides.length - 1);
  return project.slides[activeSlideIndex];
}

function getSlideBackground(slide, client = getActiveClient()) {
  if (slide.backgroundDataUrl) return slide.backgroundDataUrl;
  const background = (client.backgrounds || []).find((item) => item.id === slide.backgroundId);
  return background ? background.dataUrl : "";
}

function createSlide(templateId = "tip-editorial") {
  return {
    id: uid("slide"),
    templateId,
    title: "Nuevo contenido para tu marca",
    eyebrow: "Idea de post",
    body: "Edita este texto y exporta una imagen lista para Instagram.",
    cta: "Guarda este post",
    textScale: "balanced",
    showDecorations: false,
    backgroundId: "",
    backgroundDataUrl: ""
  };
}

function normalizeImportedSlide(item, index) {
  const fallbackTemplates = ["cover-tech", "tip-editorial", "checklist", "cta", "tip-editorial", "free"];
  const templateIds = new Set(templates.map((template) => template.id));
  const templateId = templateIds.has(item.templateId) ? item.templateId : fallbackTemplates[index % fallbackTemplates.length];

  return {
    id: uid("slide"),
    templateId,
    title: item.title || item.titulo || item.headline || `Lámina ${index + 1}`,
    eyebrow: item.eyebrow || item.antetitulo || item.category || item.categoria || "Contenido",
    body: item.body || item.text || item.texto || item.description || item.descripcion || "",
    cta: item.cta || item.firma || item.callToAction || "Guarda este post",
    textScale: item.textScale || item.tamanoTexto || "balanced",
    showDecorations: item.showDecorations === true || item.decoraciones === true,
    backgroundId: item.backgroundId || "",
    backgroundDataUrl: item.backgroundDataUrl || ""
  };
}

function setStatus(message) {
  elements.statusBox.textContent = message;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emphasizeFirstWords(title) {
  const cleanTitle = escapeHtml(title);
  const words = cleanTitle.split(" ");
  if (words.length < 2) return `<span>${cleanTitle}</span>`;
  return `<span>${words.slice(0, 2).join(" ")}</span> ${words.slice(2).join(" ")}`;
}

function renderSelectors() {
  elements.clientSelect.innerHTML = state.clients
    .map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`)
    .join("");
  elements.clientSelect.value = state.activeClientId;

  const activeClient = getActiveClient();
  elements.projectSelect.innerHTML = state.projects
    .filter((project) => project.clientId === activeClient.id)
    .map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`)
    .join("");
  elements.projectSelect.value = state.activeProjectId;

  elements.templateSelect.innerHTML = templates
    .map((template) => `<option value="${template.id}">${template.name} · ${template.description}</option>`)
    .join("");
}

function renderClientForm() {
  const client = getActiveClient();
  elements.clientNameInput.value = client.name;
  elements.primaryColorInput.value = client.primaryColor;
  elements.secondaryColorInput.value = client.secondaryColor;
  elements.darkColorInput.value = client.darkColor;
  elements.accentColorInput.value = client.accentColor;
}

function renderProjectForm() {
  const project = getActiveProject();
  elements.projectNameInput.value = project.name;
}

function renderSlideList() {
  const project = getActiveProject();
  elements.slideList.innerHTML = project.slides
    .map((slide, index) => `
      <button class="slide-thumb ${index === activeSlideIndex ? "active" : ""}" type="button" data-index="${index}">
        <span>Lámina ${index + 1}</span>
        <strong>${escapeHtml(slide.title)}</strong>
      </button>
    `)
    .join("");
}

function renderInspector() {
  const slide = getActiveSlide();
  const client = getActiveClient();
  elements.templateSelect.value = slide.templateId;
  elements.textScaleSelect.value = slide.textScale || "balanced";
  elements.decorationsInput.checked = slide.showDecorations === true;
  elements.eyebrowInput.value = slide.eyebrow;
  elements.titleInput.value = slide.title;
  elements.bodyInput.value = slide.body;
  elements.ctaInput.value = slide.cta;
  elements.backgroundSelect.innerHTML = [
    `<option value="">Sin fondo de biblioteca</option>`,
    ...((client.backgrounds || []).map((background) => `<option value="${background.id}">${escapeHtml(background.name)}</option>`))
  ].join("");
  elements.backgroundSelect.value = slide.backgroundId || "";
}

function renderCanvas() {
  const client = getActiveClient();
  const slide = getActiveSlide();
  const templateClass = `template-${slide.templateId}`;
  const textScaleClass = `text-${slide.textScale || "balanced"}`;
  const decorationClass = slide.showDecorations === true ? "has-decorations" : "no-decorations";

  elements.postCanvas.className = `post-canvas ${templateClass} ${textScaleClass} ${decorationClass}`;
  elements.postCanvas.style.setProperty("--brand-primary", client.primaryColor);
  elements.postCanvas.style.setProperty("--brand-secondary", client.secondaryColor);
  elements.postCanvas.style.setProperty("--brand-dark", client.darkColor);
  elements.postCanvas.style.setProperty("--brand-accent", client.accentColor);

  const logoSource = client.logoDataUrl || client.logoPath || "";
  const logo = logoSource
    ? `<img src="${logoSource}" alt="${escapeHtml(client.name)}">`
    : `<span class="fallback-logo">${escapeHtml(client.name.toLowerCase())}</span>`;

  const selectedBackground = getSlideBackground(slide, client);
  const background = selectedBackground
    ? `<div class="post-bg" style="background-image:url('${selectedBackground}')"></div>`
    : `<div class="post-bg"></div>`;

  if (slide.templateId === "checklist") {
    elements.postCanvas.innerHTML = `
      ${background}
      <div class="post-logo">${logo}</div>
      <div class="check-card">
        <strong>${escapeHtml(slide.title)}</strong>
        ${escapeHtml(slide.body)
          .split(/\n|\. /)
          .filter(Boolean)
          .slice(0, 4)
          .map((item) => `<div class="check-item"><span class="check-dot"></span><span>${item.replace(/\.$/, "")}</span></div>`)
          .join("")}
      </div>
      <div class="post-layer">
        <p class="post-eyebrow">${escapeHtml(slide.eyebrow)}</p>
        <div class="post-copy">
          <h2 class="post-title">${emphasizeFirstWords(slide.cta || "Checklist para vender mejor")}</h2>
        </div>
        <p class="post-cta">${escapeHtml(client.name)} · contenido práctico</p>
      </div>
    `;
    return;
  }

  const title = slide.templateId === "tip-editorial"
    ? emphasizeFirstWords(slide.title)
    : escapeHtml(slide.title).replace(/(vende|confía|web|tienda|método|fondos|clientes)/gi, "<span>$1</span>");

  elements.postCanvas.innerHTML = `
    ${background}
    <div class="post-layer">
      <div class="post-logo">${logo}</div>
      <div class="post-copy">
        <p class="post-eyebrow">${escapeHtml(slide.eyebrow)}</p>
        <h2 class="post-title">${title}</h2>
        <p class="post-body">${escapeHtml(slide.body)}</p>
      </div>
      <p class="post-cta">${escapeHtml(slide.cta)}</p>
    </div>
  `;
}

function render() {
  renderSelectors();
  renderClientForm();
  renderProjectForm();
  renderSlideList();
  renderInspector();
  renderCanvas();
}

function updateSlide(patch) {
  Object.assign(getActiveSlide(), patch);
  getActiveProject().updatedAt = new Date().toISOString();
  renderSlideList();
  renderCanvas();
  scheduleAutosave();
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveState(options = {}) {
  await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state)
  });
  if (!options.silent) {
    setStatus("Proyecto guardado en base de datos/local.");
  }
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    try {
      await saveState({ silent: true });
      setStatus("Autoguardado.");
    } catch (error) {
      setStatus(`Error de autoguardado: ${error.message}`);
    }
  }, 650);
}

function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadJson(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportCanvas(slideIndex = activeSlideIndex, shouldDownload = true) {
  const project = getActiveProject();
  const originalIndex = activeSlideIndex;
  activeSlideIndex = slideIndex;
  render();

  const format = elements.formatSelect.value;
  const quality = Number(elements.qualityInput.value);
  const dataUrl = await renderSlideToImage(getActiveSlide(), getActiveClient(), format, quality);
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataUrl,
      projectId: project.id,
      projectName: project.name,
      slideIndex
    })
  });
  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.error || "No se pudo guardar la exportación.");
  }

  if (shouldDownload) {
    downloadDataUrl(dataUrl, result.fileName);
  }

  activeSlideIndex = originalIndex;
  render();
  return result.filePath;
}

async function renderSlideToImage(slide, client, format, quality) {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  const palette = {
    primary: client.primaryColor || "#9bd80d",
    secondary: client.secondaryColor || "#f0ecdc",
    dark: client.darkColor || "#071018",
    accent: client.accentColor || "#40d8ff"
  };
  const scale = slide.textScale || "balanced";
  const sizes = {
    compact: { title: 62, body: 32, eyebrow: 24, cta: 25 },
    balanced: { title: 80, body: 36, eyebrow: 26, cta: 27 },
    hero: { title: 98, body: 40, eyebrow: 28, cta: 30 }
  }[scale] || { title: 80, body: 36, eyebrow: 26, cta: 27 };

  drawBaseBackground(context, slide, client, palette);
  await drawSelectedBackground(context, slide, client);

  if (slide.templateId === "tip-editorial") {
    drawEditorialSlide(context, slide, client, palette, sizes);
  } else if (slide.templateId === "checklist") {
    drawChecklistSlide(context, slide, client, palette, sizes);
  } else if (slide.templateId === "cta") {
    drawCtaSlide(context, slide, client, palette, sizes);
  } else if (slide.templateId === "free") {
    drawFreeSlide(context, slide, client, palette, sizes);
  } else {
    drawCoverSlide(context, slide, client, palette, sizes);
  }

  await drawLogo(context, client, 78, 78, 210, 95);
  return canvas.toDataURL(`image/${format}`, format === "jpeg" ? quality : undefined);
}

function drawBaseBackground(context, slide, client, palette) {
  if (slide.templateId === "tip-editorial") {
    context.fillStyle = palette.secondary;
    context.fillRect(0, 0, 1080, 1080);
    drawNoise(context, 120, "rgba(0,0,0,0.045)");
    return;
  }

  const gradient = context.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, palette.dark);
  gradient.addColorStop(0.55, "#0f2133");
  gradient.addColorStop(1, "#070b12");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1080, 1080);

  drawGlow(context, 850, 260, 340, hexToRgba(palette.accent, 0.22));
  drawGlow(context, 910, 880, 300, hexToRgba(palette.primary, 0.28));
}

async function drawSelectedBackground(context, slide, client) {
  const source = getSlideBackground(slide, client);
  if (!source) return;

  const image = await loadImage(source);
  const cover = coverRect(image.width, image.height, 1080, 1080);
  context.save();
  context.globalAlpha = slide.templateId === "tip-editorial" ? 0.18 : 0.42;
  context.drawImage(image, cover.x, cover.y, cover.width, cover.height);
  context.restore();
}

function drawCoverSlide(context, slide, client, palette, sizes) {
  if (slide.showDecorations) {
    drawGrid(context);
    drawPhoneShape(context, palette);
  }
  drawTextBlock(context, {
    eyebrow: slide.eyebrow,
    title: slide.title,
    body: slide.body,
    cta: slide.cta,
    x: 78,
    y: 380,
    maxWidth: 690,
    titleSize: sizes.title,
    bodySize: sizes.body,
    eyebrowSize: sizes.eyebrow,
    ctaSize: sizes.cta,
    titleColor: "#ffffff",
    bodyColor: "#e8f0ee",
    accentColor: palette.primary
  });
}

function drawEditorialSlide(context, slide, client, palette, sizes) {
  context.fillStyle = hexToRgba(palette.primary, 0.72);
  context.fillRect(78, 338, 610, 76);
  drawTextBlock(context, {
    eyebrow: slide.eyebrow,
    title: slide.title,
    body: slide.body,
    cta: slide.cta,
    x: 78,
    y: 335,
    maxWidth: 810,
    titleSize: Math.round(sizes.title * 0.92),
    bodySize: sizes.body,
    eyebrowSize: sizes.eyebrow,
    ctaSize: sizes.cta,
    titleColor: "#15130f",
    bodyColor: "#2c2a22",
    accentColor: "#15130f",
    serif: true
  });
  context.fillStyle = palette.primary;
  context.fillRect(78, 932, 560, 7);
}

function drawChecklistSlide(context, slide, client, palette, sizes) {
  drawTextBlock(context, {
    eyebrow: slide.eyebrow,
    title: slide.cta || slide.title,
    body: "",
    cta: `${client.name} · contenido práctico`,
    x: 78,
    y: 365,
    maxWidth: slide.showDecorations ? 520 : 780,
    titleSize: sizes.title,
    bodySize: sizes.body,
    eyebrowSize: sizes.eyebrow,
    ctaSize: sizes.cta,
    titleColor: "#ffffff",
    bodyColor: "#e8f0ee",
    accentColor: palette.primary
  });

  if (!slide.showDecorations) return;

  roundRect(context, 595, 155, 400, 650, 44);
  context.fillStyle = palette.secondary;
  context.fill();
  context.fillStyle = "#15130f";
  context.font = `800 44px Georgia, serif`;
  wrapText(context, slide.title, 630, 225, 325, 48, 5);
  const items = String(slide.body || "").split(/\n|\. /).filter(Boolean).slice(0, 4);
  context.font = "800 26px Bahnschrift, Segoe UI, sans-serif";
  items.forEach((item, index) => {
    const y = 475 + index * 74;
    context.fillStyle = palette.primary;
    context.beginPath();
    context.arc(640, y - 10, 13, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#15130f";
    wrapText(context, item.replace(/\.$/, ""), 670, y, 270, 30, 2);
  });
}

function drawCtaSlide(context, slide, client, palette, sizes) {
  drawGlow(context, 170, 180, 290, hexToRgba(palette.primary, 0.28));
  drawTextBlock(context, {
    eyebrow: slide.eyebrow,
    title: slide.title,
    body: slide.body,
    cta: "",
    x: 78,
    y: 320,
    maxWidth: 850,
    titleSize: Math.round(sizes.title * 1.05),
    bodySize: Math.round(sizes.body * 1.08),
    eyebrowSize: sizes.eyebrow,
    ctaSize: sizes.cta,
    titleColor: "#ffffff",
    bodyColor: "#e8f0ee",
    accentColor: palette.primary
  });
  context.fillStyle = palette.primary;
  roundRect(context, 78, 850, 330, 78, 39);
  context.fill();
  context.fillStyle = "#071018";
  context.font = `900 ${sizes.cta}px Bahnschrift, Segoe UI, sans-serif`;
  context.fillText(slide.cta || "Conversemos", 112, 900);
}

function drawFreeSlide(context, slide, client, palette, sizes) {
  if (slide.showDecorations) {
    context.strokeStyle = hexToRgba(palette.primary, 0.52);
    context.lineWidth = 34;
    context.beginPath();
    context.arc(970, 950, 220, 0, Math.PI * 2);
    context.stroke();
  }
  drawTextBlock(context, {
    eyebrow: slide.eyebrow,
    title: slide.title,
    body: slide.body,
    cta: slide.cta,
    x: 78,
    y: 345,
    maxWidth: 820,
    titleSize: sizes.title,
    bodySize: sizes.body,
    eyebrowSize: sizes.eyebrow,
    ctaSize: sizes.cta,
    titleColor: "#ffffff",
    bodyColor: "#e8f0ee",
    accentColor: palette.primary
  });
}

function drawTextBlock(context, options) {
  context.fillStyle = options.accentColor;
  context.font = `900 ${options.eyebrowSize}px Bahnschrift, Segoe UI, sans-serif`;
  context.letterSpacing = "0px";
  context.fillText(String(options.eyebrow || "").toUpperCase(), options.x, options.y - 82);

  context.fillStyle = options.titleColor;
  context.font = `900 ${options.titleSize}px ${options.serif ? "Georgia, serif" : "Bahnschrift, Segoe UI, sans-serif"}`;
  const titleEndY = wrapText(context, options.title, options.x, options.y, options.maxWidth, Math.round(options.titleSize * 0.94), 5);

  if (options.body) {
    context.fillStyle = options.bodyColor;
    context.font = `700 ${options.bodySize}px Bahnschrift, Segoe UI, sans-serif`;
    wrapText(context, options.body, options.x, titleEndY + 34, Math.min(options.maxWidth, 730), Math.round(options.bodySize * 1.22), 4);
  }

  if (options.cta) {
    context.fillStyle = options.accentColor;
    context.font = `900 ${options.ctaSize}px Bahnschrift, Segoe UI, sans-serif`;
    context.fillText(String(options.cta || "").toUpperCase(), options.x, 940);
  }
}

async function drawLogo(context, client, x, y, maxWidth, maxHeight) {
  const source = client.logoDataUrl || client.logoPath || "";
  if (!source) {
    context.fillStyle = client.primaryColor || "#9bd80d";
    context.font = "900 56px Bahnschrift, Segoe UI, sans-serif";
    context.fillText(String(client.name || "marca").toLowerCase(), x, y + 58);
    return;
  }

  try {
    const image = await loadImage(source);
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(image, x, y, width, height);
  } catch {
    context.fillStyle = client.primaryColor || "#9bd80d";
    context.font = "900 56px Bahnschrift, Segoe UI, sans-serif";
    context.fillText(String(client.name || "marca").toLowerCase(), x, y + 58);
  }
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function coverRect(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return {
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
    width,
    height
  };
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 99) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  let line = "";
  let currentY = y;
  let lines = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
      lines += 1;
      if (lines >= maxLines) return currentY;
    } else {
      line = testLine;
    }
  }

  if (line && lines < maxLines) {
    context.fillText(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function drawGlow(context, x, y, radius, color) {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawGrid(context) {
  context.save();
  context.globalAlpha = 0.12;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 1;
  for (let pos = 0; pos <= 1080; pos += 54) {
    context.beginPath();
    context.moveTo(pos, 0);
    context.lineTo(pos, 1080);
    context.stroke();
    context.beginPath();
    context.moveTo(0, pos);
    context.lineTo(1080, pos);
    context.stroke();
  }
  context.restore();
}

function drawPhoneShape(context, palette) {
  context.save();
  context.translate(795, 230);
  context.rotate(0.12);
  roundRect(context, 0, 0, 230, 430, 42);
  context.fillStyle = "rgba(255,255,255,0.08)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.34)";
  context.lineWidth = 4;
  context.stroke();
  context.shadowColor = hexToRgba(palette.primary, 0.55);
  context.shadowBlur = 45;
  context.strokeStyle = hexToRgba(palette.primary, 0.75);
  context.stroke();
  context.restore();
}

function drawNoise(context, count, color) {
  context.fillStyle = color;
  for (let index = 0; index < count; index += 1) {
    context.fillRect(Math.random() * 1080, Math.random() * 1080, 2, 2);
  }
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || "#000000").replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function bindEvents() {
  elements.clientSelect.addEventListener("change", () => {
    state.activeClientId = elements.clientSelect.value;
    const project = state.projects.find((item) => item.clientId === state.activeClientId);
    if (project) state.activeProjectId = project.id;
    activeSlideIndex = 0;
    render();
    scheduleAutosave();
  });

  elements.clientNameInput.addEventListener("input", () => {
    getActiveClient().name = elements.clientNameInput.value;
    renderSelectors();
    renderCanvas();
    scheduleAutosave();
  });

  [elements.primaryColorInput, elements.secondaryColorInput, elements.darkColorInput, elements.accentColorInput].forEach((input) => {
    input.addEventListener("input", () => {
      const client = getActiveClient();
      client.primaryColor = elements.primaryColorInput.value;
      client.secondaryColor = elements.secondaryColorInput.value;
      client.darkColor = elements.darkColorInput.value;
      client.accentColor = elements.accentColorInput.value;
      renderCanvas();
      scheduleAutosave();
    });
  });

  elements.logoInput.addEventListener("change", async () => {
    const file = elements.logoInput.files[0];
    if (!file) return;
    const client = getActiveClient();
    client.logoDataUrl = await readFileAsDataUrl(file);
    client.logoPath = "";
    renderCanvas();
    await saveState();
  });

  elements.newClientButton.addEventListener("click", () => {
    const client = {
      id: uid("client"),
      name: "Nuevo cliente",
      logoDataUrl: "",
      primaryColor: "#9bd80d",
      secondaryColor: "#f0ecdc",
      darkColor: "#071018",
      accentColor: "#40d8ff",
      backgrounds: []
    };
    state.clients.push(client);
    state.activeClientId = client.id;
    const project = createProject(client.id);
    state.projects.push(project);
    state.activeProjectId = project.id;
    activeSlideIndex = 0;
    render();
    scheduleAutosave();
  });

  elements.projectSelect.addEventListener("change", () => {
    state.activeProjectId = elements.projectSelect.value;
    activeSlideIndex = 0;
    render();
    scheduleAutosave();
  });

  elements.projectNameInput.addEventListener("input", () => {
    getActiveProject().name = elements.projectNameInput.value;
    getActiveProject().updatedAt = new Date().toISOString();
    renderSelectors();
    scheduleAutosave();
  });

  elements.newProjectButton.addEventListener("click", () => {
    const project = createProject(getActiveClient().id);
    state.projects.push(project);
    state.activeProjectId = project.id;
    activeSlideIndex = 0;
    render();
    scheduleAutosave();
  });

  elements.slideList.addEventListener("click", (event) => {
    const button = event.target.closest(".slide-thumb");
    if (!button) return;
    activeSlideIndex = Number(button.dataset.index);
    render();
  });

  elements.templateSelect.addEventListener("change", () => updateSlide({ templateId: elements.templateSelect.value }));
  elements.textScaleSelect.addEventListener("change", () => updateSlide({ textScale: elements.textScaleSelect.value }));
  elements.decorationsInput.addEventListener("change", () => updateSlide({ showDecorations: elements.decorationsInput.checked }));
  elements.eyebrowInput.addEventListener("input", () => updateSlide({ eyebrow: elements.eyebrowInput.value }));
  elements.titleInput.addEventListener("input", () => updateSlide({ title: elements.titleInput.value }));
  elements.bodyInput.addEventListener("input", () => updateSlide({ body: elements.bodyInput.value }));
  elements.ctaInput.addEventListener("input", () => updateSlide({ cta: elements.ctaInput.value }));

  elements.backgroundInput.addEventListener("change", async () => {
    const file = elements.backgroundInput.files[0];
    if (!file) return;
    const client = getActiveClient();
    if (!Array.isArray(client.backgrounds)) client.backgrounds = [];
    const background = {
      id: uid("background"),
      name: file.name.replace(/\.[^.]+$/, ""),
      dataUrl: await readFileAsDataUrl(file)
    };
    client.backgrounds.push(background);
    elements.backgroundInput.value = "";
    updateSlide({ backgroundId: background.id, backgroundDataUrl: "" });
    await saveState();
  });

  elements.backgroundSelect.addEventListener("change", () => {
    updateSlide({ backgroundId: elements.backgroundSelect.value, backgroundDataUrl: "" });
  });

  elements.addSlideButton.addEventListener("click", () => {
    const project = getActiveProject();
    project.slides.push(createSlide("tip-editorial"));
    activeSlideIndex = project.slides.length - 1;
    render();
    scheduleAutosave();
  });

  elements.duplicateSlideButton.addEventListener("click", () => {
    const project = getActiveProject();
    const copy = structuredClone(getActiveSlide());
    copy.id = uid("slide");
    project.slides.splice(activeSlideIndex + 1, 0, copy);
    activeSlideIndex += 1;
    render();
    scheduleAutosave();
  });

  elements.saveButton.addEventListener("click", saveState);

  elements.exportJsonButton.addEventListener("click", () => {
    const project = getActiveProject();
    const client = getActiveClient();
    downloadJson(
      {
        name: project.name,
        client: {
          id: client.id,
          name: client.name,
          primaryColor: client.primaryColor,
          secondaryColor: client.secondaryColor,
          darkColor: client.darkColor,
          accentColor: client.accentColor
        },
        slides: project.slides
      },
      `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "content-studio"}.json`
    );
    setStatus("JSON exportado desde el proyecto actual.");
  });

  elements.jsonInput.addEventListener("change", async () => {
    try {
      const file = elements.jsonInput.files[0];
      if (!file) return;
      const payload = JSON.parse(await file.text());
      const importedItems = Array.isArray(payload) ? payload : payload.slides || payload.laminas || payload.posts;
      if (!Array.isArray(importedItems) || importedItems.length === 0) {
        throw new Error("El JSON debe incluir un arreglo en slides, laminas, posts o ser un arreglo directo.");
      }

      const project = {
        id: uid("project"),
        clientId: getActiveClient().id,
        name: payload.name || payload.nombre || `Contenido importado ${new Date().toLocaleDateString("es-CL")}`,
        updatedAt: new Date().toISOString(),
        slides: importedItems.map(normalizeImportedSlide)
      };

      state.projects.push(project);
      state.activeProjectId = project.id;
      activeSlideIndex = 0;
      elements.jsonInput.value = "";
      render();
      await saveState();
      setStatus(`JSON importado: ${project.slides.length} láminas creadas en "${project.name}".`);
    } catch (error) {
      setStatus(`Error importando JSON: ${error.message}`);
    }
  });

  elements.clearBackgroundButton.addEventListener("click", () => updateSlide({ backgroundId: "", backgroundDataUrl: "" }));

  elements.exportCurrentButton.addEventListener("click", async () => {
    try {
      setStatus("Exportando lámina actual...");
      const filePath = await exportCanvas(activeSlideIndex, true);
      setStatus(`Exportación guardada: ${filePath}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  });

  elements.exportAllButton.addEventListener("click", async () => {
    try {
      const project = getActiveProject();
      setStatus(`Exportando ${project.slides.length} láminas...`);
      const files = [];
      for (let index = 0; index < project.slides.length; index += 1) {
        files.push(await exportCanvas(index, true));
      }
      setStatus(`Carrusel exportado:\n${files.join("\n")}`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  });
}

function createProject(clientId) {
  return {
    id: uid("project"),
    clientId,
    name: "Nuevo carrusel",
    updatedAt: new Date().toISOString(),
    slides: [createSlide("cover-tech")]
  };
}

async function init() {
  const response = await fetch("/api/state");
  state = await response.json();
  bindEvents();
  render();
}

init().catch((error) => {
  setStatus(`Error inicializando la app: ${error.message}`);
});
