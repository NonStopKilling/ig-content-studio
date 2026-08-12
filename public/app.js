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
let currentUser = null;
let activeSlideIndex = 0;
let autosaveTimer = null;
let dashboardView = "editor";
let adminUsers = [];
let adminClients = [];

const elements = {
  authShell: document.querySelector("#authShell"),
  appShell: document.querySelector("#appShell"),
  editorTopbar: document.querySelector("#editorTopbar"),
  editorStage: document.querySelector("#editorStage"),
  adminWorkspace: document.querySelector("#adminWorkspace"),
  exportsWorkspace: document.querySelector("#exportsWorkspace"),
  loginForm: document.querySelector("#loginForm"),
  usernameInput: document.querySelector("#usernameInput"),
  passwordInput: document.querySelector("#passwordInput"),
  loginButton: document.querySelector("#loginButton"),
  authStatus: document.querySelector("#authStatus"),
  currentUserLabel: document.querySelector("#currentUserLabel"),
  currentUserMeta: document.querySelector("#currentUserMeta"),
  dashboardTabs: Array.from(document.querySelectorAll("[data-dashboard-tab]")),
  adminClientsTab: document.querySelector("#adminClientsTab"),
  logoutButton: document.querySelector("#logoutButton"),
  adminReloadUsersButton: document.querySelector("#adminReloadUsersButton"),
  adminUserForm: document.querySelector("#adminUserForm"),
  adminUserIdInput: document.querySelector("#adminUserIdInput"),
  adminUsernameInput: document.querySelector("#adminUsernameInput"),
  adminEmailInput: document.querySelector("#adminEmailInput"),
  adminUserRoleSelect: document.querySelector("#adminUserRoleSelect"),
  adminUserClientLabel: document.querySelector("#adminUserClientLabel"),
  adminUserPasswordInput: document.querySelector("#adminUserPasswordInput"),
  adminUserActiveInput: document.querySelector("#adminUserActiveInput"),
  adminUserResetButton: document.querySelector("#adminUserResetButton"),
  adminUsersList: document.querySelector("#adminUsersList"),
  adminClientsList: document.querySelector("#adminClientsList"),
  adminCreateClientButton: document.querySelector("#adminCreateClientButton"),
  adminDeleteClientButton: document.querySelector("#adminDeleteClientButton"),
  adminClientForm: document.querySelector("#adminClientForm"),
  adminEditingClientId: document.querySelector("#adminEditingClientId"),
  adminClientNameInput: document.querySelector("#adminClientNameInput"),
  adminPrimaryColorInput: document.querySelector("#adminPrimaryColorInput"),
  adminSecondaryColorInput: document.querySelector("#adminSecondaryColorInput"),
  adminDarkColorInput: document.querySelector("#adminDarkColorInput"),
  adminAccentColorInput: document.querySelector("#adminAccentColorInput"),
  adminLogoInput: document.querySelector("#adminLogoInput"),
  adminLogoPreview: document.querySelector("#adminLogoPreview"),
  adminLogoWidthInput: document.querySelector("#adminLogoWidthInput"),
  adminSaveClientButton: document.querySelector("#adminSaveClientButton"),
  clientPanel: document.querySelector("#clientPanel"),
  projectPanel: document.querySelector("#projectPanel"),
  projectLibraryPanel: document.querySelector("#projectLibraryPanel"),
  clientSelect: document.querySelector("#clientSelect"),
  clientNameInput: document.querySelector("#clientNameInput"),
  primaryColorInput: document.querySelector("#primaryColorInput"),
  secondaryColorInput: document.querySelector("#secondaryColorInput"),
  darkColorInput: document.querySelector("#darkColorInput"),
  accentColorInput: document.querySelector("#accentColorInput"),
  logoInput: document.querySelector("#logoInput"),
  logoWidthInput: document.querySelector("#logoWidthInput"),
  newClientButton: document.querySelector("#newClientButton"),
  deleteClientButton: document.querySelector("#deleteClientButton"),
  projectSelect: document.querySelector("#projectSelect"),
  projectNameInput: document.querySelector("#projectNameInput"),
  newProjectButton: document.querySelector("#newProjectButton"),
  projectSummary: document.querySelector("#projectSummary"),
  projectList: document.querySelector("#projectList"),
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
  backgroundList: document.querySelector("#backgroundList"),
  backgroundInput: document.querySelector("#backgroundInput"),
  clearBackgroundButton: document.querySelector("#clearBackgroundButton"),
  formatSelect: document.querySelector("#formatSelect"),
  qualityInput: document.querySelector("#qualityInput"),
  statusBox: document.querySelector("#statusBox"),
  exportsFormatSelect: document.querySelector("#exportsFormatSelect"),
  exportsQualityInput: document.querySelector("#exportsQualityInput"),
  exportsCurrentButton: document.querySelector("#exportsCurrentButton"),
  exportsAllButton: document.querySelector("#exportsAllButton"),
  exportsJsonButton: document.querySelector("#exportsJsonButton"),
  exportConfigCsvButton: document.querySelector("#exportConfigCsvButton"),
  configCsvInput: document.querySelector("#configCsvInput"),
  exportsOpsStatus: document.querySelector("#exportsOpsStatus"),
  adminOpsStatus: document.querySelector("#adminOpsStatus")
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function getActiveClient() {
  return state.clients.find((client) => client.id === state.activeClientId) || state.clients[0];
}

function inferStatusKind(message, fallback = "info") {
  const text = String(message || "").toLowerCase();
  if (text.includes("error") || text.includes("no se pudo") || text.includes("inval") || text.includes("fall") || text.includes("no autorizado")) {
    return "error";
  }
  if (text.includes("guardad") || text.includes("cread") || text.includes("actualiz") || text.includes("eliminad") || text.includes("exportad") || text.includes("importad") || text.includes("sesion iniciada") || text.includes("listo")) {
    return "success";
  }
  return fallback;
}

function applyStatusState(element, message, kind = "info") {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("status-success", "status-error", "status-info");
  element.classList.add(`status-${kind}`);
}

function setAuthStatus(message, kind = inferStatusKind(message, "info")) {
  applyStatusState(elements.authStatus, message, kind);
}

function showAuthShell() {
  elements.authShell.hidden = false;
  elements.appShell.hidden = true;
}

function showAppShell() {
  elements.authShell.hidden = true;
  elements.appShell.hidden = false;
}

function updateUserPanel() {
  if (!currentUser) return;
  elements.currentUserLabel.textContent = currentUser.username;
  const roleLabel = currentUser.role === "admin" ? "Admin" : "Cliente";
  elements.currentUserMeta.textContent = `${roleLabel}${currentUser.clientId ? ` · ${currentUser.clientId}` : ""}`;
  const isAdmin = currentUser.role === "admin";
  elements.newClientButton.hidden = !isAdmin;
  elements.clientSelect.disabled = !isAdmin;
  elements.adminClientsTab.hidden = !isAdmin;
  if (!isAdmin && dashboardView === "admin-clients") {
    dashboardView = "editor";
  }
}

function renderDashboardLayout() {
  const isAdmin = currentUser && currentUser.role === "admin";
  const showAdminClients = dashboardView === "admin-clients" && isAdmin;
  const showExportsWorkspace = dashboardView === "exports";
  const showEditorWorkspace = !showAdminClients && !showExportsWorkspace;

  if (elements.appShell) {
    elements.appShell.dataset.dashboardView = dashboardView;
  }

  if (elements.editorTopbar) {
    elements.editorTopbar.hidden = !showEditorWorkspace;
  }
  if (elements.editorStage) {
    elements.editorStage.hidden = !showEditorWorkspace;
  }
  if (elements.adminWorkspace) {
    elements.adminWorkspace.hidden = !showAdminClients;
  }
  if (elements.exportsWorkspace) {
    elements.exportsWorkspace.hidden = !showExportsWorkspace;
  }

  if (elements.clientPanel) {
    elements.clientPanel.hidden = showAdminClients || showExportsWorkspace;
  }
  if (elements.projectPanel) {
    elements.projectPanel.hidden = showAdminClients;
  }
  if (elements.projectLibraryPanel) {
    elements.projectLibraryPanel.hidden = showAdminClients || showExportsWorkspace;
  }

  elements.dashboardTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.dashboardTab === dashboardView);
  });
}

function getActiveProject() {
  return state.projects.find((project) => project.id === state.activeProjectId) || state.projects[0];
}

function getProjectsForActiveClient() {
  return state.projects.filter((project) => project.clientId === state.activeClientId);
}

function ensureActiveProjectForClient(clientId) {
  const clientProjects = state.projects.filter((project) => project.clientId === clientId);
  if (!clientProjects.length) {
    const project = createProject(clientId);
    state.projects.push(project);
    state.activeProjectId = project.id;
    return project;
  }

  const activeProject = state.projects.find((project) => project.id === state.activeProjectId);
  if (!activeProject || activeProject.clientId !== clientId) {
    state.activeProjectId = clientProjects[0].id;
    return clientProjects[0];
  }

  return activeProject;
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

function setStatus(message, kind = inferStatusKind(message, "info")) {
  applyStatusState(elements.statusBox, message, kind);
  applyStatusState(elements.adminOpsStatus, message, kind);
}

function setExportsStatus(message, kind = inferStatusKind(message, "info")) {
  applyStatusState(elements.exportsOpsStatus, message, kind);
}

function renderAdminUserClientOptions() {
  if (!elements.adminUserClientLabel || !state?.activeClientId) return;
  const activeClient = state.clients.find((client) => client.id === state.activeClientId);
  elements.adminUserClientLabel.value = activeClient ? `${activeClient.name} (${activeClient.id})` : "Sin cliente";
}

function toggleAdminClientSelectByRole() {
  if (!elements.adminUserRoleSelect || !elements.adminUserClientLabel) return;
  const role = elements.adminUserRoleSelect.value;
  if (role === "admin") {
    elements.adminUserClientLabel.value = "Global (sin cliente)";
    return;
  }

  renderAdminUserClientOptions();
}

function syncAdminUserClientWithActiveClient(options = {}) {
  if (!elements.adminUserClientLabel || !state?.activeClientId) return;
  const { force = false } = options;
  if (!force && elements.adminUserRoleSelect?.value === "admin") return;
  renderAdminUserClientOptions();
}

function renderAdminClientForm() {
  if (!state || !elements.adminClientForm) return;
  const client = getActiveClient();
  if (!client) return;

  if (elements.adminEditingClientId) {
    elements.adminEditingClientId.textContent = `ID: ${client.id}`;
  }

  elements.adminClientNameInput.value = client.name || "";
  elements.adminPrimaryColorInput.value = client.primaryColor || "#9bd80d";
  elements.adminSecondaryColorInput.value = client.secondaryColor || "#f0ecdc";
  elements.adminDarkColorInput.value = client.darkColor || "#071018";
  elements.adminAccentColorInput.value = client.accentColor || "#40d8ff";
  elements.adminLogoWidthInput.value = String(Math.round(Number(client.logoWidth || 20)));
  if (elements.adminLogoPreview) {
    const logoSource = client.logoDataUrl || client.logoPath || "";
    elements.adminLogoPreview.innerHTML = logoSource
      ? `<img src="${logoSource}" alt="Logo ${escapeHtml(client.name)}">`
      : "Sin logo";
  }
}

function resetAdminUserForm() {
  if (!elements.adminUserForm) return;

  elements.adminUserIdInput.value = "";
  elements.adminUsernameInput.value = "";
  elements.adminEmailInput.value = "";
  elements.adminUserRoleSelect.value = "cliente";
  elements.adminUserPasswordInput.value = "";
  elements.adminUserActiveInput.checked = true;
  renderAdminUserClientOptions();
  syncAdminUserClientWithActiveClient({ force: true });
  toggleAdminClientSelectByRole();
}

function fillAdminUserForm(user) {
  elements.adminUserIdInput.value = user.id;
  elements.adminUsernameInput.value = user.username;
  elements.adminEmailInput.value = user.email || "";
  elements.adminUserRoleSelect.value = user.role;
  if (elements.adminUserClientLabel && user.role === "admin") {
    elements.adminUserClientLabel.value = "Global (sin cliente)";
  } else if (elements.adminUserClientLabel && user.clientId) {
    const userClient = state.clients.find((client) => client.id === user.clientId);
    elements.adminUserClientLabel.value = userClient ? `${userClient.name} (${userClient.id})` : user.clientId;
  } else {
    syncAdminUserClientWithActiveClient({ force: true });
  }
  elements.adminUserPasswordInput.value = "";
  elements.adminUserActiveInput.checked = user.isActive !== false;
  toggleAdminClientSelectByRole();
}

function renderAdminUsersList() {
  if (!elements.adminUsersList) return;

  const visibleUsers = adminUsers.filter((user) => user.role === "admin" || user.clientId === state.activeClientId);

  if (!visibleUsers.length) {
    elements.adminUsersList.innerHTML = `
      <div class="project-empty">
        <strong>Sin usuarios</strong>
        <span>Crea el primer usuario para este cliente</span>
      </div>
    `;
    return;
  }

  elements.adminUsersList.innerHTML = visibleUsers
    .map((user) => {
      const clientName = user.clientId
        ? (adminClients.find((client) => client.id === user.clientId)?.name || user.clientId)
        : "Global";
      const roleLabel = user.role === "admin" ? "Admin" : "Cliente";
      const loginLabel = user.email ? `${user.username} / ${user.email}` : user.username;

      return `
        <article class="project-card ${user.isActive === false ? "user-disabled" : ""}">
          <div>
            <span class="project-name">${escapeHtml(loginLabel)}</span>
            <span class="project-meta">${roleLabel} · ${escapeHtml(clientName)} · ${user.isActive === false ? "Inactivo" : "Activo"}</span>
          </div>
          <div class="project-actions">
            <button type="button" data-user-action="edit" data-user-id="${user.id}">Editar</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAdminClientsList() {
  if (!elements.adminClientsList || !state || !Array.isArray(state.clients)) return;

  if (!state.clients.length) {
    elements.adminClientsList.innerHTML = `
      <div class="project-empty">
        <strong>Sin clientes</strong>
        <span>Crea el primer cliente para comenzar.</span>
      </div>
    `;
    return;
  }

  elements.adminClientsList.innerHTML = state.clients
    .map((client) => {
      const isActive = client.id === state.activeClientId;
      const projectsCount = state.projects.filter((project) => project.clientId === client.id).length;
      const usersCount = adminUsers.filter((user) => user.clientId === client.id).length;
      return `
        <article class="project-card ${isActive ? "active" : ""}">
          <div class="admin-client-item-head">
            ${client.logoDataUrl || client.logoPath ? `<img class="admin-client-mini-logo" src="${client.logoDataUrl || client.logoPath}" alt="${escapeHtml(client.name)}">` : `<span class="admin-client-mini-logo admin-client-mini-logo-empty">Sin logo</span>`}
          </div>
          <div>
            <span class="project-name">${escapeHtml(client.name)}</span>
            <span class="project-meta">ID: ${escapeHtml(client.id)} · ${projectsCount} proyectos · ${usersCount} usuarios</span>
          </div>
          <div class="project-actions">
            <button type="button" data-client-action="edit" data-client-id="${client.id}">Editar</button>
            <button type="button" data-client-action="delete" data-client-id="${client.id}">Eliminar</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function createClientEntity() {
  return {
    id: uid("client"),
    name: "Nuevo cliente",
    logoDataUrl: "",
    logoPath: "",
    primaryColor: "#9bd80d",
    secondaryColor: "#f0ecdc",
    darkColor: "#071018",
    accentColor: "#40d8ff",
    logoWidth: 20,
    backgrounds: []
  };
}

function createClientWithProject() {
  const client = createClientEntity();
  state.clients.push(client);
  state.activeClientId = client.id;
  const project = createProject(client.id);
  state.projects.push(project);
  state.activeProjectId = project.id;
  activeSlideIndex = 0;
  render();
  renderAdminClientsList();
  scheduleAutosave();
  setStatus(`Cliente creado: ${client.name}`);
}

function deleteClientById(clientId) {
  if (!state || !Array.isArray(state.clients)) return;
  if (state.clients.length <= 1) {
    setStatus("Debes mantener al menos un cliente activo.");
    return;
  }

  const client = state.clients.find((item) => item.id === clientId);
  if (!client) return;

  const linkedUsers = adminUsers.filter((user) => user.clientId === client.id).length;
  const warning = linkedUsers
    ? `Este cliente tiene ${linkedUsers} usuarios asociados. Eliminalo solo si ya reasignaste esos usuarios.`
    : "";
  const confirmed = window.confirm(`Eliminar "${client.name}" y todos sus proyectos? Esta accion no se puede deshacer. ${warning}`.trim());
  if (!confirmed) return;

  state.clients = state.clients.filter((item) => item.id !== client.id);
  state.projects = state.projects.filter((project) => project.clientId !== client.id);

  if (!state.clients.some((item) => item.id === state.activeClientId)) {
    state.activeClientId = state.clients[0].id;
  }
  ensureActiveProjectForClient(state.activeClientId);
  activeSlideIndex = 0;
  render();
  renderAdminClientsList();
  scheduleAutosave();
  setStatus(`Cliente eliminado: ${client.name}`);
}

async function loadAdminUsers() {
  const response = await fetch("/api/admin/users");
  const payload = await response.json().catch(() => ({ ok: false, error: "No se pudieron cargar usuarios." }));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "No se pudieron cargar usuarios.");
  }

  adminUsers = Array.isArray(payload.users) ? payload.users : [];
  adminClients = Array.isArray(payload.clients) ? payload.clients : [];
  renderAdminUserClientOptions();
  toggleAdminClientSelectByRole();
  renderAdminUsersList();
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
  ensureActiveProjectForClient(state.activeClientId);

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
  elements.logoWidthInput.value = String(Math.round(Number(client.logoWidth || 20)));
}

function renderProjectForm() {
  const project = getActiveProject();
  elements.projectNameInput.value = project.name;
}

function formatDateTime(value) {
  if (!value) return "Sin actividad";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin actividad";
  return parsed.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderProjectLibrary() {
  const projects = getProjectsForActiveClient();
  elements.projectSummary.textContent = `${projects.length} guardados`;

  if (!projects.length) {
    elements.projectList.innerHTML = `
      <div class="project-empty">
        <strong>Sin carruseles</strong>
        <span>Crea tu primer proyecto</span>
      </div>
    `;
    return;
  }

  elements.projectList.innerHTML = projects
    .slice()
    .sort((left, right) => new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime())
    .map((project) => {
      const isActive = project.id === state.activeProjectId;
      const slideCount = Array.isArray(project.slides) ? project.slides.length : 0;
      return `
        <article class="project-card ${isActive ? "active" : ""}" data-project-id="${project.id}">
          <button class="project-open" type="button" data-action="open" data-project-id="${project.id}">
            <span class="project-name">${escapeHtml(project.name)}</span>
            <span class="project-meta">${slideCount} láminas · ${escapeHtml(formatDateTime(project.updatedAt))}</span>
          </button>
          <div class="project-actions">
            <button type="button" data-action="duplicate" data-project-id="${project.id}">Duplicar</button>
            <button type="button" data-action="delete" data-project-id="${project.id}">Eliminar</button>
          </div>
        </article>
      `;
    })
    .join("");
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

function renderBackgroundLibrary() {
  const client = getActiveClient();
  const slide = getActiveSlide();
  const backgrounds = Array.isArray(client.backgrounds) ? client.backgrounds : [];

  if (!backgrounds.length) {
    elements.backgroundList.innerHTML = `
      <div class="background-empty">
        <strong>Sin fondos</strong>
        <span>Sube el primero</span>
      </div>
    `;
    return;
  }

  elements.backgroundList.innerHTML = backgrounds
    .map((background) => {
      const isActive = background.id === slide.backgroundId;
      return `
        <button class="background-thumb ${isActive ? "active" : ""}" type="button" data-background-id="${background.id}" title="${escapeHtml(background.name)}">
          <span class="background-image" style="background-image:url('${background.dataUrl}')"></span>
          <span class="background-name">${escapeHtml(background.name)}</span>
        </button>
      `;
    })
    .join("");
}

function syncBackgroundControls() {
  elements.clearBackgroundButton.disabled = !getSlideBackground(getActiveSlide(), getActiveClient());
}

function renderInspector() {
  const slide = getActiveSlide();
  elements.templateSelect.value = slide.templateId;
  elements.textScaleSelect.value = slide.textScale || "balanced";
  elements.decorationsInput.checked = slide.showDecorations === true;
  elements.eyebrowInput.value = slide.eyebrow;
  elements.titleInput.value = slide.title;
  elements.bodyInput.value = slide.body;
  elements.ctaInput.value = slide.cta;
  syncBackgroundControls();
}

function renderCanvas() {
  const client = getActiveClient();
  const slide = getActiveSlide();
  const templateClass = `template-${slide.templateId}`;
  const textScaleClass = `text-${slide.textScale || "balanced"}`;
  const decorationClass = slide.showDecorations === true ? "has-decorations" : "no-decorations";
  const backgroundClass = getSlideBackground(slide, client) ? "has-background-image" : "no-background-image";

  elements.postCanvas.className = `post-canvas ${templateClass} ${textScaleClass} ${decorationClass} ${backgroundClass}`;
  elements.postCanvas.style.setProperty("--brand-primary", client.primaryColor);
  elements.postCanvas.style.setProperty("--brand-secondary", client.secondaryColor);
  elements.postCanvas.style.setProperty("--brand-dark", client.darkColor);
  elements.postCanvas.style.setProperty("--brand-accent", client.accentColor);
  elements.postCanvas.style.setProperty("--logo-width", `${Number(client.logoWidth || 20)}%`);

  const logoSource = client.logoDataUrl || client.logoPath || "";
  const logo = logoSource
    ? `<img src="${logoSource}" alt="${escapeHtml(client.name)}">`
    : `<span class="fallback-logo">${escapeHtml(client.name.toLowerCase())}</span>`;

  const selectedBackground = getSlideBackground(slide, client);
  const background = selectedBackground
    ? `<div class="post-bg" style="background-image:url('${selectedBackground}')"></div><div class="post-overlay"></div><div class="post-frame"></div>`
    : `<div class="post-bg"></div><div class="post-overlay"></div><div class="post-frame"></div>`;

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
          <h2 class="post-title">${emphasizeFirstWords(slide.title || "Checklist para vender mejor")}</h2>
        </div>
        <p class="post-cta">${escapeHtml(slide.cta || `${client.name} · contenido práctico`)}</p>
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
  updateUserPanel();
  renderDashboardLayout();
  renderAdminClientForm();
  syncAdminUserClientWithActiveClient();
  renderAdminClientsList();
  renderProjectLibrary();
  renderSlideList();
  renderBackgroundLibrary();
  renderInspector();
  renderCanvas();
}

function updateSlide(patch) {
  Object.assign(getActiveSlide(), patch);
  getActiveProject().updatedAt = new Date().toISOString();
  renderSlideList();
  renderBackgroundLibrary();
  syncBackgroundControls();
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

async function uploadBackgroundFiles(fileList) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    setStatus("No se detectaron imagenes validas para subir.");
    return;
  }

  const client = getActiveClient();
  if (!Array.isArray(client.backgrounds)) client.backgrounds = [];

  const uploadedBackgrounds = [];
  for (const file of files) {
    const background = {
      id: uid("background"),
      name: file.name.replace(/\.[^.]+$/, ""),
      dataUrl: await readFileAsDataUrl(file)
    };
    client.backgrounds.push(background);
    uploadedBackgrounds.push(background);
  }

  const firstBackground = uploadedBackgrounds[0];
  if (firstBackground) {
    updateSlide({ backgroundId: firstBackground.id, backgroundDataUrl: "" });
  }

  await saveState();
  const plural = uploadedBackgrounds.length === 1 ? "fondo" : "fondos";
  setStatus(`${uploadedBackgrounds.length} ${plural} subidos y biblioteca actualizada.`);
}

async function saveState(options = {}) {
  const response = await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state)
  });

  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = payload.error ? `: ${payload.error}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`No se pudo guardar el estado${detail}`);
  }

  if (!options.silent) {
    setStatus("Proyecto guardado en base de datos/local.");
  }
}

function getSelectedExportFormat() {
  if (dashboardView === "exports" && elements.exportsFormatSelect) {
    return elements.exportsFormatSelect.value;
  }
  if (elements.formatSelect) {
    return elements.formatSelect.value;
  }
  return elements.exportsFormatSelect ? elements.exportsFormatSelect.value : "jpeg";
}

function getSelectedExportQuality() {
  if (dashboardView === "exports" && elements.exportsQualityInput) {
    return Number(elements.exportsQualityInput.value);
  }
  if (elements.qualityInput) {
    return Number(elements.qualityInput.value);
  }
  return elements.exportsQualityInput ? Number(elements.exportsQualityInput.value) : 0.92;
}

function exportActiveProjectAsJson() {
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
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function parseConfigCsv(text) {
  const rows = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);

  if (!rows.length) return [];
  const header = rows[0].map((item) => item.trim().toLowerCase());
  if (header.join(",") !== "scope,key,value") {
    throw new Error("El CSV debe tener cabecera: scope,key,value");
  }

  return rows.slice(1).map((row) => ({
    scope: String(row[0] || "").trim().toLowerCase(),
    key: String(row[1] || "").trim(),
    value: String(row[2] || "")
  }));
}

function exportConfigCsv() {
  const client = getActiveClient();
  const project = getActiveProject();

  const rows = [
    ["scope", "key", "value"],
    ["client", "id", client.id],
    ["client", "name", client.name],
    ["client", "primaryColor", client.primaryColor],
    ["client", "secondaryColor", client.secondaryColor],
    ["client", "darkColor", client.darkColor],
    ["client", "accentColor", client.accentColor],
    ["client", "logoWidth", String(client.logoWidth || 20)],
    ["project", "id", project.id],
    ["project", "name", project.name]
  ];

  const csv = `${rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "content-config"}-config.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importConfigCsv(file) {
  const rows = parseConfigCsv(await file.text());
  const client = getActiveClient();
  const project = getActiveProject();

  rows.forEach((row) => {
    if (row.scope === "client") {
      if (row.key === "name") client.name = row.value || client.name;
      if (row.key === "primaryColor") client.primaryColor = row.value || client.primaryColor;
      if (row.key === "secondaryColor") client.secondaryColor = row.value || client.secondaryColor;
      if (row.key === "darkColor") client.darkColor = row.value || client.darkColor;
      if (row.key === "accentColor") client.accentColor = row.value || client.accentColor;
      if (row.key === "logoWidth") {
        const numericWidth = Number(row.value);
        if (!Number.isNaN(numericWidth)) {
          client.logoWidth = Math.max(12, Math.min(44, numericWidth));
        }
      }
    }

    if (row.scope === "project") {
      if (row.key === "name") project.name = row.value || project.name;
    }
  });

  project.updatedAt = new Date().toISOString();
  render();
  await saveState();
}

async function importProjectFromJsonFile(file) {
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
  render();
  await saveState();
  return project;
}

async function fetchCurrentUser() {
  const response = await fetch("/api/auth/me");
  if (!response.ok) return null;
  const payload = await response.json();
  return payload.authenticated ? payload.user : null;
}

async function loadAppState() {
  const response = await fetch("/api/state");
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "No se pudo cargar el estado." }));
    throw new Error(payload.error || "No se pudo cargar el estado.");
  }
  state = await response.json();
  ensureActiveProjectForClient(state.activeClientId);
}

async function handleLogin(event) {
  event.preventDefault();
  setAuthStatus("Validando acceso...");

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: elements.usernameInput.value,
      password: elements.passwordInput.value
    })
  });

  const payload = await response.json().catch(() => ({ error: "No se pudo iniciar sesión." }));
  if (!response.ok) {
    throw new Error(payload.error || "No se pudo iniciar sesión.");
  }

  currentUser = payload.user;
  await loadAppState();
  showAppShell();
  render();
  elements.passwordInput.value = "";
  setStatus(`Sesión iniciada como ${currentUser.username}.`);
}

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  currentUser = null;
  state = null;
  showAuthShell();
  setAuthStatus("Sesión cerrada.");
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

async function downloadExportFile(fileName) {
  const response = await fetch(`/api/export/file/${encodeURIComponent(fileName)}`, {
    credentials: "same-origin"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `No se pudo descargar ${fileName}.`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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

  const format = getSelectedExportFormat();
  const quality = getSelectedExportQuality();
  const dataUrl = await renderExportImage(format, quality);
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
    await downloadExportFile(result.fileName);
  }

  activeSlideIndex = originalIndex;
  render();
  return result.filePath;
}

function waitNextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForImagesReady(root) {
  const images = Array.from(root.querySelectorAll("img"));
  if (!images.length) return;

  await Promise.all(images.map((image) => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        image.removeEventListener("load", done);
        image.removeEventListener("error", done);
        resolve();
      };
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    });
  }));
}

function createExportCaptureNode(source) {
  const rect = source.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-20000px";
  host.style.top = "0";
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.pointerEvents = "none";
  host.style.overflow = "hidden";
  host.setAttribute("aria-hidden", "true");

  const clone = source.cloneNode(true);
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.margin = "0";
  clone.style.transform = "none";

  host.appendChild(clone);
  document.body.appendChild(host);

  return {
    node: clone,
    width,
    height,
    cleanup: () => {
      host.remove();
    }
  };
}

function collectPageCssText() {
  const rules = [];
  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(styleSheet.cssRules || [])) {
        rules.push(rule.cssText);
      }
    } catch {
      // Ignore stylesheets that browser blocks from script access.
    }
  }
  return rules.join("\n");
}

async function renderExportImage(format, quality) {
  const errors = [];

  // Preferred path: html2canvas captures the rendered DOM with better fidelity.
  const html2canvasFn = globalThis.html2canvas;
  if (typeof html2canvasFn === "function") {
    try {
      return await renderPostCanvasWithHtml2Canvas(html2canvasFn, format, quality);
    } catch (error) {
      errors.push(`html2canvas: ${error.message}`);
      // Continue with fallbacks.
    }
  }

  try {
    return await renderPostCanvasToImage(format, quality);
  } catch (error) {
    errors.push(`svg-snapshot: ${error.message}`);
  }

  try {
    // Keeps export available when a third-party image prevents DOM capture.
    return await renderSlideToImage(getActiveSlide(), getActiveClient(), format, quality);
  } catch (error) {
    errors.push(`legacy-renderer: ${error.message}`);
    throw new Error(`No se pudo exportar la lamina. Detalle: ${errors.join(" | ")}`);
  }
}

async function renderPostCanvasWithHtml2Canvas(html2canvasFn, format, quality) {
  await document.fonts.ready;
  await waitNextFrame();

  const source = elements.postCanvas;
  if (!source) throw new Error("No se encontro el canvas visual para exportar.");

  await waitForImagesReady(source);
  const capture = createExportCaptureNode(source);

  try {
    const capturedCanvas = await html2canvasFn(capture.node, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      scale: Math.max(2, window.devicePixelRatio || 1),
      width: capture.width,
      height: capture.height,
      logging: false,
      imageTimeout: 15000,
      removeContainer: true
    });

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = 1080;
    outputCanvas.height = 1080;
    const outputContext = outputCanvas.getContext("2d");
    if (!outputContext) throw new Error("No se pudo crear el contexto de salida.");
    outputContext.drawImage(capturedCanvas, 0, 0, 1080, 1080);
    return outputCanvas.toDataURL(`image/${format}`, format === "jpeg" ? quality : undefined);
  } finally {
    capture.cleanup();
  }
}

async function renderPostCanvasToImage(format, quality) {
  await document.fonts.ready;
  await waitNextFrame();

  const source = elements.postCanvas;
  if (!source) throw new Error("No se encontro el canvas visual para exportar.");

  await waitForImagesReady(source);
  const capture = createExportCaptureNode(source);

  const wrapper = document.createElement("div");
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  wrapper.style.width = `${capture.width}px`;
  wrapper.style.height = `${capture.height}px`;
  wrapper.style.margin = "0";
  wrapper.style.padding = "0";
  wrapper.style.overflow = "hidden";
  wrapper.appendChild(capture.node);

  const cssText = collectPageCssText();
  const markup = new XMLSerializer().serializeToString(wrapper);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${capture.width}" height="${capture.height}" viewBox="0 0 ${capture.width} ${capture.height}">`,
    '<foreignObject width="100%" height="100%">',
    `<style>${cssText}</style>`,
    markup,
    "</foreignObject>",
    "</svg>"
  ].join("");

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = 1080;
    outputCanvas.height = 1080;
    const outputContext = outputCanvas.getContext("2d");
    if (!outputContext) throw new Error("No se pudo crear el contexto de salida.");
    outputContext.drawImage(image, 0, 0, 1080, 1080);
    return outputCanvas.toDataURL(`image/${format}`, format === "jpeg" ? quality : undefined);
  } finally {
    capture.cleanup();
    URL.revokeObjectURL(url);
  }
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
  const hasBackground = Boolean(getSlideBackground(slide, client));

  drawBaseBackground(context, slide, client, palette);
  await drawSelectedBackground(context, slide, client);
  drawTemplateOverlay(context, slide, palette, hasBackground);

  if (slide.templateId === "tip-editorial") {
    drawEditorialSlide(context, slide, client, palette, sizes, hasBackground);
  } else if (slide.templateId === "checklist") {
    drawChecklistSlide(context, slide, client, palette, sizes, hasBackground);
  } else if (slide.templateId === "cta") {
    drawCtaSlide(context, slide, client, palette, sizes, hasBackground);
  } else if (slide.templateId === "free") {
    drawFreeSlide(context, slide, client, palette, sizes, hasBackground);
  } else {
    drawCoverSlide(context, slide, client, palette, sizes, hasBackground);
  }

  const logoWidth = Number(client.logoWidth || 20);
  const logoScale = Math.max(0.5, Math.min(2.2, logoWidth / 20));
  await drawLogo(context, client, 78, 78, Math.round(210 * logoScale), Math.round(95 * logoScale));
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

  context.save();
  context.translate(815, -130);
  context.rotate(0.22);
  context.fillStyle = hexToRgba(palette.accent, 0.14);
  context.fillRect(0, 0, 250, 1320);
  context.fillStyle = hexToRgba(palette.primary, 0.16);
  context.fillRect(282, 0, 180, 1320);
  context.restore();
}

async function drawSelectedBackground(context, slide, client) {
  const source = getSlideBackground(slide, client);
  if (!source) return;

  const image = await loadImage(source);
  const cover = coverRect(image.width, image.height, 1080, 1080);
  context.save();
  const alphaByTemplate = {
    "tip-editorial": 0.82,
    checklist: 0.78,
    cta: 0.84,
    free: 0.9,
    "cover-tech": 0.88
  };
  context.globalAlpha = alphaByTemplate[slide.templateId] || 0.86;
  context.drawImage(image, cover.x, cover.y, cover.width, cover.height);
  context.restore();
}

function drawTemplateOverlay(context, slide, palette, hasBackground) {
  if (!hasBackground) return;

  if (slide.templateId === "tip-editorial") {
    const paper = context.createLinearGradient(0, 0, 1080, 0);
    paper.addColorStop(0, hexToRgba(palette.secondary, 0.96));
    paper.addColorStop(0.58, hexToRgba(palette.secondary, 0.84));
    paper.addColorStop(0.78, hexToRgba(palette.secondary, 0.2));
    paper.addColorStop(1, "rgba(242,240,230,0)");
    context.fillStyle = paper;
    context.fillRect(0, 0, 1080, 1080);
  } else {
    const side = context.createLinearGradient(0, 0, 1080, 0);
    side.addColorStop(0, "rgba(7,16,24,0.92)");
    side.addColorStop(0.58, "rgba(7,16,24,0.46)");
    side.addColorStop(1, "rgba(7,16,24,0.08)");
    context.fillStyle = side;
    context.fillRect(0, 0, 1080, 1080);
  }

  const bottom = context.createLinearGradient(0, 1080, 0, 430);
  bottom.addColorStop(0, "rgba(7,16,24,0.78)");
  bottom.addColorStop(1, "rgba(7,16,24,0)");
  context.fillStyle = bottom;
  context.fillRect(0, 0, 1080, 1080);

  context.save();
  context.strokeStyle = hexToRgba(palette.primary, 0.82);
  context.lineWidth = 8;
  context.strokeRect(58, 58, 964, 964);
  context.restore();
}

function drawCoverSlide(context, slide, client, palette, sizes, hasBackground) {
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
    accentColor: palette.primary,
    shadow: hasBackground
  });
}

function drawEditorialSlide(context, slide, client, palette, sizes, hasBackground) {
  if (hasBackground) {
    roundRect(context, 58, 260, 850, 540, 8);
    context.fillStyle = hexToRgba(palette.secondary, 0.88);
    context.fill();
    context.strokeStyle = "rgba(7,16,24,0.14)";
    context.lineWidth = 2;
    context.stroke();
  }

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

function drawChecklistSlide(context, slide, client, palette, sizes, hasBackground) {
  drawTextBlock(context, {
    eyebrow: slide.eyebrow,
    title: slide.title,
    body: "",
    cta: slide.cta || `${client.name} · contenido práctico`,
    x: 78,
    y: 365,
    maxWidth: slide.showDecorations ? 520 : 780,
    titleSize: sizes.title,
    bodySize: sizes.body,
    eyebrowSize: sizes.eyebrow,
    ctaSize: sizes.cta,
    titleColor: "#ffffff",
    bodyColor: "#e8f0ee",
    accentColor: palette.primary,
    shadow: hasBackground
  });

  if (!slide.showDecorations) return;

  roundRect(context, 595, 155, 400, 650, 8);
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

function drawCtaSlide(context, slide, client, palette, sizes, hasBackground) {
  context.save();
  context.translate(-80, 135);
  context.rotate(-0.14);
  context.fillStyle = hexToRgba(palette.primary, 0.18);
  context.fillRect(0, 0, 720, 170);
  context.restore();

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
    accentColor: palette.primary,
    shadow: hasBackground
  });
  context.fillStyle = palette.primary;
  roundRect(context, 78, 850, 330, 78, 8);
  context.fill();
  context.fillStyle = "#071018";
  context.font = `900 ${sizes.cta}px Bahnschrift, Segoe UI, sans-serif`;
  context.fillText(slide.cta || "Conversemos", 112, 900);
}

function drawFreeSlide(context, slide, client, palette, sizes, hasBackground) {
  if (slide.showDecorations) {
    context.save();
    context.translate(790, 820);
    context.rotate(0.24);
    context.strokeStyle = hexToRgba(palette.primary, 0.52);
    context.lineWidth = 34;
    context.strokeRect(0, 0, 270, 270);
    context.restore();
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
    accentColor: palette.primary,
    shadow: hasBackground
  });
}

function drawTextBlock(context, options) {
  context.save();
  if (options.shadow) {
    context.shadowColor = "rgba(0,0,0,0.42)";
    context.shadowBlur = 18;
    context.shadowOffsetY = 8;
  }

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

  context.restore();
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
  elements.loginForm.addEventListener("submit", async (event) => {
    try {
      await handleLogin(event);
    } catch (error) {
      setAuthStatus(error.message);
    }
  });

  elements.logoutButton.addEventListener("click", async () => {
    await handleLogout();
  });

  elements.dashboardTabs.forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedView = button.dataset.dashboardTab;
      if (!selectedView) return;

      if (selectedView === "admin-clients") {
        if (currentUser?.role !== "admin") return;
        dashboardView = "admin-clients";
        renderDashboardLayout();
        try {
          await loadAdminUsers();
          resetAdminUserForm();
          renderAdminClientsList();
          setStatus("Vista admin: clientes y usuarios listos para administrar.");
        } catch (error) {
          setStatus(`Error cargando panel admin: ${error.message}`);
        }
        return;
      }

      dashboardView = selectedView;
      renderDashboardLayout();
      if (selectedView !== "editor") {
        setStatus(`Vista \"${button.textContent.trim()}\" enfocada para trabajo en ultrawide.`);
      }
    });
  });

  if (elements.adminReloadUsersButton) {
    elements.adminReloadUsersButton.addEventListener("click", async () => {
      try {
        await loadAdminUsers();
        renderAdminClientsList();
        setStatus("Listado de usuarios actualizado.");
      } catch (error) {
        setStatus(`Error actualizando usuarios: ${error.message}`);
      }
    });
  }

  if (elements.adminCreateClientButton) {
    elements.adminCreateClientButton.addEventListener("click", () => {
      createClientWithProject();
      renderAdminClientForm();
    });
  }

  if (elements.adminDeleteClientButton) {
    elements.adminDeleteClientButton.addEventListener("click", () => {
      deleteClientById(state.activeClientId);
    });
  }

  if (elements.adminClientsList) {
    elements.adminClientsList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-client-action]");
      if (!button) return;

      const clientId = button.dataset.clientId;
      const action = button.dataset.clientAction;
      if (!clientId || !action) return;

      if (action === "edit") {
        state.activeClientId = clientId;
        ensureActiveProjectForClient(clientId);
        activeSlideIndex = 0;
        render();
        syncAdminUserClientWithActiveClient({ force: true });
        setStatus("Cliente seleccionado. Edita y guarda desde el formulario de cliente.");
        return;
      }

      if (action === "delete") {
        deleteClientById(clientId);
      }
    });
  }

  if (elements.adminUserRoleSelect) {
    elements.adminUserRoleSelect.addEventListener("change", () => {
      toggleAdminClientSelectByRole();
    });
  }

  if (elements.adminUserResetButton) {
    elements.adminUserResetButton.addEventListener("click", () => {
      resetAdminUserForm();
      setStatus("Formulario de usuario reiniciado.");
    });
  }

  if (elements.adminUsersList) {
    elements.adminUsersList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-user-action]");
      if (!button) return;
      const userId = button.dataset.userId;
      const user = adminUsers.find((item) => item.id === userId);
      if (!user) return;
      fillAdminUserForm(user);
      setStatus(`Editando usuario: ${user.username}`);
    });
  }

  if (elements.adminUserForm) {
    elements.adminUserForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const userId = elements.adminUserIdInput.value.trim();
      const payload = {
        username: elements.adminUsernameInput.value.trim(),
        email: elements.adminEmailInput.value.trim(),
        role: elements.adminUserRoleSelect.value,
        clientId: state.activeClientId,
        password: elements.adminUserPasswordInput.value,
        isActive: elements.adminUserActiveInput.checked
      };

      if (!payload.username) {
        setStatus("Debes indicar un usuario.");
        return;
      }

      if (!userId && !payload.password) {
        setStatus("La contraseña es obligatoria al crear un usuario.");
        return;
      }

      if (payload.role === "admin") {
        payload.clientId = "";
      }

      if (!payload.password) {
        delete payload.password;
      }

      const endpoint = userId ? `/api/admin/users/${encodeURIComponent(userId)}` : "/api/admin/users";
      const method = userId ? "PUT" : "POST";

      try {
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({ ok: false, error: "Error de red." }));
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "No se pudo guardar el usuario.");
        }

        await loadAdminUsers();
        resetAdminUserForm();
        setStatus(`Usuario ${userId ? "actualizado" : "creado"} correctamente.`);
      } catch (error) {
        setStatus(`Error guardando usuario: ${error.message}`);
      }
    });
  }

  if (elements.adminClientNameInput) {
    elements.adminClientNameInput.addEventListener("input", () => {
      const client = getActiveClient();
      client.name = elements.adminClientNameInput.value;
      renderAdminClientsList();
      renderSelectors();
      renderCanvas();
      setStatus("Cambios de cliente pendientes de guardar.");
    });
  }

  [
    elements.adminPrimaryColorInput,
    elements.adminSecondaryColorInput,
    elements.adminDarkColorInput,
    elements.adminAccentColorInput
  ].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      const client = getActiveClient();
      client.primaryColor = elements.adminPrimaryColorInput.value;
      client.secondaryColor = elements.adminSecondaryColorInput.value;
      client.darkColor = elements.adminDarkColorInput.value;
      client.accentColor = elements.adminAccentColorInput.value;
      renderAdminClientsList();
      renderCanvas();
      setStatus("Cambios de cliente pendientes de guardar.");
    });
  });

  if (elements.adminLogoWidthInput) {
    elements.adminLogoWidthInput.addEventListener("input", () => {
      const client = getActiveClient();
      client.logoWidth = Number(elements.adminLogoWidthInput.value);
      renderCanvas();
      setStatus("Cambios de cliente pendientes de guardar.");
    });
  }

  if (elements.adminLogoInput) {
    elements.adminLogoInput.addEventListener("change", async () => {
      const file = elements.adminLogoInput.files[0];
      if (!file) return;
      const client = getActiveClient();
      client.logoDataUrl = await readFileAsDataUrl(file);
      client.logoPath = "";
      renderCanvas();
      renderAdminClientsList();
      await saveState();
      elements.adminLogoInput.value = "";
      setStatus("Logotipo actualizado y guardado.");
    });
  }

  if (elements.adminClientForm) {
    elements.adminClientForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await saveState();
        render();
        setStatus("Cliente guardado correctamente.");
      } catch (error) {
        setStatus(`Error guardando cliente: ${error.message}`);
      }
    });
  }

  if (elements.exportsFormatSelect && elements.formatSelect) {
    elements.exportsFormatSelect.value = elements.formatSelect.value;
    elements.exportsFormatSelect.addEventListener("change", () => {
      elements.formatSelect.value = elements.exportsFormatSelect.value;
    });
    elements.formatSelect.addEventListener("change", () => {
      elements.exportsFormatSelect.value = elements.formatSelect.value;
    });
  }

  if (elements.exportsQualityInput && elements.qualityInput) {
    elements.exportsQualityInput.value = elements.qualityInput.value;
    elements.exportsQualityInput.addEventListener("input", () => {
      elements.qualityInput.value = elements.exportsQualityInput.value;
    });
    elements.qualityInput.addEventListener("input", () => {
      elements.exportsQualityInput.value = elements.qualityInput.value;
    });
  }

  elements.clientSelect.addEventListener("change", () => {
    state.activeClientId = elements.clientSelect.value;
    ensureActiveProjectForClient(state.activeClientId);
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

  elements.logoWidthInput.addEventListener("input", () => {
    const client = getActiveClient();
    client.logoWidth = Number(elements.logoWidthInput.value);
    renderCanvas();
    scheduleAutosave();
  });

  elements.newClientButton.addEventListener("click", () => {
    createClientWithProject();
  });

  if (elements.deleteClientButton) {
    elements.deleteClientButton.addEventListener("click", () => {
      deleteClientById(state.activeClientId);
    });
  }

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

  elements.projectList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, projectId } = button.dataset;
    const project = state.projects.find((item) => item.id === projectId);
    if (!project) return;

    if (action === "open") {
      state.activeProjectId = project.id;
      activeSlideIndex = 0;
      render();
      setStatus(`Proyecto abierto: ${project.name}`);
      return;
    }

    if (action === "duplicate") {
      const copy = structuredClone(project);
      copy.id = uid("project");
      copy.name = `${project.name} copia`;
      copy.updatedAt = new Date().toISOString();
      copy.slides = (copy.slides || []).map((slide) => ({ ...slide, id: uid("slide") }));
      state.projects.push(copy);
      state.activeProjectId = copy.id;
      activeSlideIndex = 0;
      render();
      scheduleAutosave();
      setStatus(`Proyecto duplicado: ${copy.name}`);
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(`Eliminar "${project.name}"? Esta accion no se puede deshacer.`);
      if (!confirmed) return;

      state.projects = state.projects.filter((item) => item.id !== project.id);
      ensureActiveProjectForClient(state.activeClientId);
      activeSlideIndex = 0;
      render();
      scheduleAutosave();
      setStatus(`Proyecto eliminado: ${project.name}`);
    }
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

  elements.backgroundList.addEventListener("click", (event) => {
    const button = event.target.closest(".background-thumb");
    if (!button) return;
    updateSlide({ backgroundId: button.dataset.backgroundId, backgroundDataUrl: "" });
    setStatus("Fondo aplicado a la lámina actual.");
  });

  elements.backgroundInput.addEventListener("change", async () => {
    try {
      await uploadBackgroundFiles(elements.backgroundInput.files);
      elements.backgroundInput.value = "";
    } catch (error) {
      elements.backgroundInput.value = "";
      setStatus(`Error cargando fondo: ${error.message}`);
    }
  });

  const backgroundLibrary = elements.backgroundList.closest(".background-library");
  if (backgroundLibrary) {
    backgroundLibrary.addEventListener("dragover", (event) => {
      event.preventDefault();
      backgroundLibrary.classList.add("drag-over");
    });

    backgroundLibrary.addEventListener("dragleave", (event) => {
      if (!backgroundLibrary.contains(event.relatedTarget)) {
        backgroundLibrary.classList.remove("drag-over");
      }
    });

    backgroundLibrary.addEventListener("drop", async (event) => {
      event.preventDefault();
      backgroundLibrary.classList.remove("drag-over");
      try {
        await uploadBackgroundFiles(event.dataTransfer?.files || []);
      } catch (error) {
        setStatus(`Error cargando fondo: ${error.message}`);
      }
    });
  }

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

  if (elements.exportJsonButton) {
    elements.exportJsonButton.addEventListener("click", () => {
      exportActiveProjectAsJson();
      setStatus("JSON exportado desde el proyecto actual.");
    });
  }

  if (elements.exportsJsonButton) {
    elements.exportsJsonButton.addEventListener("click", () => {
      exportActiveProjectAsJson();
      setExportsStatus("JSON del proyecto exportado.");
      setStatus("JSON del proyecto exportado.");
    });
  }

  if (elements.exportConfigCsvButton) {
    elements.exportConfigCsvButton.addEventListener("click", () => {
      exportConfigCsv();
      setExportsStatus("CSV de configuracion exportado.");
      setStatus("CSV de configuracion exportado.");
    });
  }

  elements.jsonInput.addEventListener("change", async () => {
    try {
      const file = elements.jsonInput.files[0];
      if (!file) return;
      const project = await importProjectFromJsonFile(file);
      elements.jsonInput.value = "";
      setStatus(`JSON importado: ${project.slides.length} láminas creadas en "${project.name}".`);
      setExportsStatus(`JSON importado: ${project.slides.length} laminas.`);
    } catch (error) {
      setStatus(`Error importando JSON: ${error.message}`);
      setExportsStatus(`Error importando JSON: ${error.message}`);
    }
  });

  if (elements.configCsvInput) {
    elements.configCsvInput.addEventListener("change", async () => {
      try {
        const file = elements.configCsvInput.files[0];
        if (!file) return;
        await importConfigCsv(file);
        elements.configCsvInput.value = "";
        setExportsStatus("Configuracion CSV importada y aplicada.");
        setStatus("Configuracion CSV importada y aplicada.");
      } catch (error) {
        setStatus(`Error importando CSV: ${error.message}`);
        setExportsStatus(`Error importando CSV: ${error.message}`);
      }
    });
  }

  elements.clearBackgroundButton.addEventListener("click", () => {
    updateSlide({ backgroundId: "", backgroundDataUrl: "" });
    setStatus("Fondo quitado de la lámina actual.");
  });

  elements.exportCurrentButton.addEventListener("click", async () => {
    try {
      setStatus("Exportando lámina actual...");
      const filePath = await exportCanvas(activeSlideIndex, true);
      setStatus(`Exportación guardada: ${filePath}`);
    } catch (error) {
      console.error("Export current failed", error);
      setStatus(`Error: ${error.message}`);
    }
  });

  if (elements.exportsCurrentButton) {
    elements.exportsCurrentButton.addEventListener("click", async () => {
      try {
        setExportsStatus("Exportando lámina actual...");
        const filePath = await exportCanvas(activeSlideIndex, true);
        setExportsStatus(`Exportacion guardada: ${filePath}`);
        setStatus(`Exportacion guardada: ${filePath}`);
      } catch (error) {
        console.error("Export current (exports workspace) failed", error);
        setExportsStatus(`Error exportando: ${error.message}`);
        setStatus(`Error: ${error.message}`);
      }
    });
  }

  const runExportAll = async () => {
    const project = getActiveProject();
    const files = [];
    for (let index = 0; index < project.slides.length; index += 1) {
      files.push(await exportCanvas(index, true));
    }
    return files;
  };

  if (elements.exportAllButton) {
    elements.exportAllButton.addEventListener("click", async () => {
      try {
        const project = getActiveProject();
        setStatus(`Exportando ${project.slides.length} láminas...`);
        const files = await runExportAll();
        setStatus(`Carrusel exportado:\n${files.join("\n")}`);
      } catch (error) {
        console.error("Export all failed", error);
        setStatus(`Error: ${error.message}`);
      }
    });
  }

  if (elements.exportsAllButton) {
    elements.exportsAllButton.addEventListener("click", async () => {
      try {
        const project = getActiveProject();
        setExportsStatus(`Exportando ${project.slides.length} laminas...`);
        const files = await runExportAll();
        setExportsStatus(`Carrusel exportado (${files.length} archivos).`);
        setStatus(`Carrusel exportado:\n${files.join("\n")}`);
      } catch (error) {
        console.error("Export all (exports workspace) failed", error);
        setExportsStatus(`Error exportando: ${error.message}`);
        setStatus(`Error: ${error.message}`);
      }
    });
  }
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
  bindEvents();
  currentUser = await fetchCurrentUser();

  if (!currentUser) {
    showAuthShell();
    setAuthStatus("Usa tu cuenta asignada para entrar.");
    return;
  }

  await loadAppState();
  showAppShell();
  render();
}

init().catch((error) => {
  setStatus(`Error inicializando la app: ${error.message}`);
});
