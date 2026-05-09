const tabs = Array.from(document.querySelectorAll(".tab-trigger"));
const panels = Array.from(document.querySelectorAll(".tab-panel"));
const appShell = document.querySelector(".app");
const accessGate = document.querySelector("#accessGate");
const accessGateTitle = document.querySelector("#accessGateTitle");
const confirmHealthProfessionalButton = document.querySelector("#confirmHealthProfessional");
const denyHealthProfessionalButton = document.querySelector("#denyHealthProfessional");
const checklistItems = Array.from(document.querySelectorAll("#visitChecklist input[type='checkbox']"));
const checklistCount = document.querySelector("#checklistCount");
const checklistProgress = document.querySelector("#checklistProgress");
const materialChecklistItems = Array.from(
  document.querySelectorAll("#materialChecklist input[type='checkbox']"),
);
const materialChecklistCount = document.querySelector("#materialChecklistCount");
const materialChecklistProgress = document.querySelector("#materialChecklistProgress");
const clearMaterialChecklistButton = document.querySelector("#clearMaterialChecklist");
const materialSubtabs = Array.from(document.querySelectorAll(".material-subtab"));
const materialSubtabPanels = Array.from(document.querySelectorAll("[data-material-panel]"));
const materialListSubtabs = Array.from(document.querySelectorAll(".material-list-subtab"));
const materialListSubtabPanels = Array.from(document.querySelectorAll("[data-material-list-panel]"));
const techniqueSubtabs = Array.from(document.querySelectorAll(".technique-subtab"));
const techniqueSubtabPanels = Array.from(document.querySelectorAll("[data-technique-panel]"));
const dropSubtabs = Array.from(document.querySelectorAll(".drop-subtab"));
const dropSubtabPanels = Array.from(document.querySelectorAll("[data-drop-panel]"));
const compatItemA = document.querySelector("#compatItemA");
const compatItemB = document.querySelector("#compatItemB");
const compatInteractiveResult = document.querySelector("#compatInteractiveResult");
const prescriptionItemsContainer = document.querySelector("#prescriptionItems");
const addPrescriptionItemButton = document.querySelector("#addPrescriptionItem");
let prescriptionItemControls = Array.from(document.querySelectorAll(".prescription-item"));
const punctureHighlight = document.querySelector("#punctureHighlight");
const punctureGroups = document.querySelector("#punctureGroups");
const dropCameraPreview = document.querySelector("#dropCameraPreview");
const dropCameraPlaceholder = document.querySelector("#dropCameraPlaceholder");
const startDropCameraButton = document.querySelector("#startDropCamera");
const stopDropCameraButton = document.querySelector("#stopDropCamera");
const startAutoDropCounterButton = document.querySelector("#startAutoDropCounter");
const stopAutoDropCounterButton = document.querySelector("#stopAutoDropCounter");
const dropCameraStatus = document.querySelector("#dropCameraStatus");
const recordDropButton = document.querySelector("#recordDrop");
const resetDropCounterButton = document.querySelector("#resetDropCounter");
const dropCount = document.querySelector("#dropCount");
const dropElapsed = document.querySelector("#dropElapsed");
const dropPerMinute = document.querySelector("#dropPerMinute");
const dropMlHour = document.querySelector("#dropMlHour");
const manualDropsMinute = document.querySelector("#manualDropsMinute");
const manualMlHour = document.querySelector("#manualMlHour");
const contactForm = document.querySelector("#contactForm");
const contactResult = document.querySelector("#contactResult");
const techniqueVideo = document.querySelector("#techniqueVideo");
const visitCounter = document.querySelector("#visitCounter");
const voiceChecklistToggle = document.querySelector("#voiceChecklistToggle");
const voiceChecklistStatus = document.querySelector("#voiceChecklistStatus");
const voiceChecklistTranscript = document.querySelector("#voiceChecklistTranscript");
const materialVoiceToggle = document.querySelector("#materialVoiceToggle");
const materialVoiceStatus = document.querySelector("#materialVoiceStatus");
const materialVoiceTranscript = document.querySelector("#materialVoiceTranscript");
const documentNoteTrigger = document.querySelector("#documentNoteTrigger");
const documentNotePanel = document.querySelector("#documentNote");
const closeDocumentNoteButton = document.querySelector("#closeDocumentNote");
const documentMaterialTrigger = document.querySelector("#documentMaterialTrigger");
const documentMaterialPanel = document.querySelector("#materialChecklistPanel");
const closeMaterialChecklistPanelButton = document.querySelector("#closeMaterialChecklist");
const documentChecklistTrigger = document.querySelector("#documentChecklistTrigger");
const documentChecklistPanel = document.querySelector("#checklist");
const closeChecklistButton = document.querySelector("#closeChecklist");
const contactEmail = "icarehipodermoclise@gmail.com";
const accessStorageKey = "icare-health-professional-access";
const storageKey = "icare-model-checklist";
const materialStorageKey = "icare-material-checklist";
const visitCounterUrl = "https://abacus.jasoncameron.dev/hit/icare-hipodermoclise1/visitas";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isMobileVoiceDevice =
  window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 820px)").matches;
let checklistRecognition = null;
let checklistVoiceActive = false;
let materialRecognition = null;
let materialVoiceActive = false;
let dropCameraStream = null;
let dropTimestamps = [];
let dropTimer = null;
let manualConversionLock = false;
let autoDropActive = false;
let autoDropFrame = null;
let previousDropBrightness = null;
let lastAutoDropAt = 0;
const dropDetectionCanvas = document.createElement("canvas");
const dropDetectionContext = dropDetectionCanvas.getContext("2d", { willReadFrequently: true });

function rememberProfessionalAccess() {
  try {
    sessionStorage.setItem(accessStorageKey, "yes");
  } catch {
    // Session storage can be unavailable in restrictive browser modes.
  }
}

function hasProfessionalAccess() {
  try {
    return sessionStorage.getItem(accessStorageKey) === "yes";
  } catch {
    return false;
  }
}

function allowProfessionalAccess() {
  rememberProfessionalAccess();
  document.body.classList.remove("access-pending", "access-denied");
  accessGate.hidden = true;
  appShell.removeAttribute("aria-hidden");
  scrollToActivePanel({ behavior: "auto" });
}

function denyProfessionalAccess() {
  document.body.classList.remove("access-pending");
  document.body.classList.add("access-denied");
  appShell.setAttribute("aria-hidden", "true");
  accessGateTitle.textContent = "Acesso bloqueado";
  accessGate.querySelector("p").textContent =
    "Este conteúdo é destinado exclusivamente a profissionais de saúde.";
  confirmHealthProfessionalButton.hidden = true;
  denyHealthProfessionalButton.hidden = true;
}

function initializeAccessGate() {
  if (!accessGate || !appShell) return;

  if (hasProfessionalAccess()) {
    allowProfessionalAccess();
    return;
  }

  confirmHealthProfessionalButton.addEventListener("click", allowProfessionalAccess);
  denyHealthProfessionalButton.addEventListener("click", denyProfessionalAccess);
  confirmHealthProfessionalButton.focus();
}

async function updateVisitCounter() {
  try {
    const response = await fetch(visitCounterUrl, { cache: "no-store" });
    const data = await response.json();
    visitCounter.textContent = String(data.value);
  } catch {
    visitCounter.textContent = "--";
  }
}

function shouldScrollToPanel() {
  return window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 820px)").matches;
}

function scrollToActivePanel({ behavior = "smooth" } = {}) {
  if (!shouldScrollToPanel() || document.body.classList.contains("access-pending")) return;

  const activePanel = panels.find((panel) => panel.classList.contains("active"));
  if (!activePanel) return;

  window.requestAnimationFrame(() => {
    const top = activePanel.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: Math.max(top, 0), behavior });
  });
}

function activateTab(tab, { scrollToPanel = false } = {}) {
  const targetId = tab.dataset.tab;

  tabs.forEach((item) => {
    item.setAttribute("aria-selected", String(item === tab));
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });

  if (targetId === "tecnica") {
    loadTechniqueVideo();
  }

  if (targetId !== "contador-gotas") {
    stopDropCamera();
  }

  history.replaceState(null, "", `#${targetId}`);

  if (scrollToPanel) {
    scrollToActivePanel();
  }
}

function loadTechniqueVideo() {
  if (!techniqueVideo || techniqueVideo.getAttribute("src") !== "about:blank") return;
  techniqueVideo.src = techniqueVideo.dataset.src;
}

function dropFactorValue() {
  return 20;
}

function formatDecimal(value, maximumFractionDigits = 1) {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  });
}

function formatInputDecimal(value) {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(1)).toString();
}

function formatElapsed(milliseconds) {
  if (!milliseconds || milliseconds < 1000) return "0s";
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}min ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}

function calculatedDropsPerMinute() {
  if (dropTimestamps.length < 2) return null;
  const elapsedMinutes = (dropTimestamps[dropTimestamps.length - 1] - dropTimestamps[0]) / 60000;
  if (elapsedMinutes <= 0) return null;
  return (dropTimestamps.length - 1) / elapsedMinutes;
}

function updateDropCounterResults() {
  if (!dropCount || !dropElapsed || !dropPerMinute || !dropMlHour) return;

  const now = Date.now();
  const elapsed = dropTimestamps.length ? now - dropTimestamps[0] : 0;
  const dropsMinute = calculatedDropsPerMinute();
  const mlHour = dropsMinute === null ? null : (dropsMinute * 60) / dropFactorValue();

  dropCount.textContent = String(dropTimestamps.length);
  dropElapsed.textContent = formatElapsed(elapsed);
  dropPerMinute.textContent = dropsMinute === null ? "--" : formatDecimal(dropsMinute, 1);
  dropMlHour.textContent = mlHour === null ? "--" : formatDecimal(mlHour, 1);
}

function startDropTimer() {
  if (dropTimer) return;
  dropTimer = window.setInterval(updateDropCounterResults, 1000);
}

function stopDropTimer() {
  if (!dropTimer) return;
  window.clearInterval(dropTimer);
  dropTimer = null;
}

function recordDrop() {
  dropTimestamps.push(Date.now());
  startDropTimer();
  updateDropCounterResults();
}

function resetDropCounter() {
  dropTimestamps = [];
  stopDropTimer();
  updateDropCounterResults();
}

function setDropCameraStatus(message, className = "") {
  if (!dropCameraStatus) return;
  dropCameraStatus.textContent = message;
  dropCameraStatus.className = `drop-counter-status ${className}`.trim();
}

async function startDropCamera() {
  if (!dropCameraPreview || !navigator.mediaDevices?.getUserMedia) {
    setDropCameraStatus("Câmera indisponível neste navegador.", "warning");
    return;
  }

  try {
    dropCameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    dropCameraPreview.srcObject = dropCameraStream;
    await dropCameraPreview.play();
    dropCameraPreview.classList.add("active");
    if (dropCameraPlaceholder) dropCameraPlaceholder.hidden = true;
    if (startDropCameraButton) startDropCameraButton.disabled = true;
    if (stopDropCameraButton) stopDropCameraButton.disabled = false;
    setDropCameraStatus("Câmera ativa. Toque em Registrar gota a cada gota observada.", "success");
  } catch {
    setDropCameraStatus(
      "Não foi possível acessar a câmera. Verifique a permissão do navegador e tente novamente.",
      "warning",
    );
  }
}

function stopDropCamera() {
  stopAutoDropCounter();
  if (!dropCameraStream) return;
  dropCameraStream.getTracks().forEach((track) => track.stop());
  dropCameraStream = null;
  if (dropCameraPreview) {
    dropCameraPreview.pause();
    dropCameraPreview.srcObject = null;
    dropCameraPreview.classList.remove("active");
  }
  if (dropCameraPlaceholder) dropCameraPlaceholder.hidden = false;
  if (startDropCameraButton) startDropCameraButton.disabled = false;
  if (stopDropCameraButton) stopDropCameraButton.disabled = true;
  setDropCameraStatus("Câmera parada.", "");
}

function readDropDetectionBrightness() {
  if (!dropCameraPreview || !dropDetectionContext || dropCameraPreview.readyState < 2) return null;

  const videoWidth = dropCameraPreview.videoWidth;
  const videoHeight = dropCameraPreview.videoHeight;
  if (!videoWidth || !videoHeight) return null;

  const sampleWidth = Math.max(24, Math.round(videoWidth * 0.32));
  const sampleHeight = Math.max(24, Math.round(videoHeight * 0.4));
  const sampleX = Math.round((videoWidth - sampleWidth) / 2);
  const sampleY = Math.round((videoHeight - sampleHeight) / 2);

  dropDetectionCanvas.width = 80;
  dropDetectionCanvas.height = 80;
  dropDetectionContext.drawImage(
    dropCameraPreview,
    sampleX,
    sampleY,
    sampleWidth,
    sampleHeight,
    0,
    0,
    dropDetectionCanvas.width,
    dropDetectionCanvas.height,
  );

  const { data } = dropDetectionContext.getImageData(
    0,
    0,
    dropDetectionCanvas.width,
    dropDetectionCanvas.height,
  );
  let totalBrightness = 0;
  for (let index = 0; index < data.length; index += 4) {
    totalBrightness += (data[index] + data[index + 1] + data[index + 2]) / 3;
  }
  return totalBrightness / (data.length / 4);
}

function detectDropFrame() {
  if (!autoDropActive) return;

  const brightness = readDropDetectionBrightness();
  const now = Date.now();
  if (brightness !== null && previousDropBrightness !== null) {
    const difference = Math.abs(brightness - previousDropBrightness);
    if (difference > 10 && now - lastAutoDropAt > 650) {
      lastAutoDropAt = now;
      recordDrop();
    }
  }
  previousDropBrightness = brightness;
  autoDropFrame = window.requestAnimationFrame(detectDropFrame);
}

async function startAutoDropCounter() {
  if (!dropCameraStream) {
    await startDropCamera();
  }
  if (!dropCameraStream || autoDropActive) return;

  autoDropActive = true;
  previousDropBrightness = null;
  lastAutoDropAt = 0;
  if (startAutoDropCounterButton) startAutoDropCounterButton.disabled = true;
  if (stopAutoDropCounterButton) stopAutoDropCounterButton.disabled = false;
  setDropCameraStatus(
    "Contagem automática ativa. Centralize a câmara de gotejamento na imagem; use Registrar gota se precisar corrigir.",
    "success",
  );
  detectDropFrame();
}

function stopAutoDropCounter() {
  if (!autoDropActive && !autoDropFrame) return;
  autoDropActive = false;
  previousDropBrightness = null;
  if (autoDropFrame) {
    window.cancelAnimationFrame(autoDropFrame);
    autoDropFrame = null;
  }
  if (startAutoDropCounterButton) startAutoDropCounterButton.disabled = false;
  if (stopAutoDropCounterButton) stopAutoDropCounterButton.disabled = true;
  if (dropCameraStream) {
    setDropCameraStatus("Contagem automática parada. A câmera continua disponível para contagem manual.", "");
  }
}

function syncManualFromDropsMinute() {
  if (!manualDropsMinute || !manualMlHour || manualConversionLock) return;
  manualConversionLock = true;
  const dropsMinute = Number(manualDropsMinute.value.replace(",", "."));
  manualMlHour.value = Number.isFinite(dropsMinute) && manualDropsMinute.value
    ? formatInputDecimal((dropsMinute * 60) / dropFactorValue())
    : "";
  manualConversionLock = false;
}

function syncManualFromMlHour() {
  if (!manualDropsMinute || !manualMlHour || manualConversionLock) return;
  manualConversionLock = true;
  const mlHour = Number(manualMlHour.value.replace(",", "."));
  manualDropsMinute.value = Number.isFinite(mlHour) && manualMlHour.value
    ? formatInputDecimal((mlHour * dropFactorValue()) / 60)
    : "";
  manualConversionLock = false;
}

function refreshDropFactorCalculations() {
  updateDropCounterResults();
  if (manualDropsMinute?.value) {
    syncManualFromDropsMinute();
  } else if (manualMlHour?.value) {
    syncManualFromMlHour();
  }
}

function activateMaterialSubtab(trigger) {
  const target = trigger.dataset.materialSubtab;

  materialSubtabs.forEach((item) => {
    item.setAttribute("aria-selected", String(item === trigger));
  });

  materialSubtabPanels.forEach((panel) => {
    const isActive = panel.dataset.materialPanel === target;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
}

function activateMaterialListSubtab(trigger) {
  const target = trigger.dataset.materialListSubtab;

  materialListSubtabs.forEach((item) => {
    const isActive = item === trigger;
    item.setAttribute("aria-selected", String(isActive));
    item.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  materialListSubtabPanels.forEach((panel) => {
    const isActive = panel.dataset.materialListPanel === target;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
}

function moveMaterialListSubtabFocus(currentTrigger, direction) {
  const currentIndex = materialListSubtabs.indexOf(currentTrigger);
  if (currentIndex < 0) return;

  const nextIndex = (currentIndex + direction + materialListSubtabs.length) % materialListSubtabs.length;
  const nextTrigger = materialListSubtabs[nextIndex];
  activateMaterialListSubtab(nextTrigger);
  nextTrigger.focus();
}

function activateTechniqueSubtab(trigger) {
  const target = trigger.dataset.techniqueSubtab;

  techniqueSubtabs.forEach((item) => {
    const isActive = item === trigger;
    item.setAttribute("aria-selected", String(isActive));
    item.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  techniqueSubtabPanels.forEach((panel) => {
    const isActive = panel.dataset.techniquePanel === target;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
}

function moveTechniqueSubtabFocus(currentTrigger, direction) {
  const currentIndex = techniqueSubtabs.indexOf(currentTrigger);
  if (currentIndex < 0) return;

  const nextIndex = (currentIndex + direction + techniqueSubtabs.length) % techniqueSubtabs.length;
  const nextTrigger = techniqueSubtabs[nextIndex];
  activateTechniqueSubtab(nextTrigger);
  nextTrigger.focus();
}

function activateDropSubtab(trigger) {
  const target = trigger.dataset.dropSubtab;

  dropSubtabs.forEach((item) => {
    const isActive = item === trigger;
    item.setAttribute("aria-selected", String(isActive));
    item.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  dropSubtabPanels.forEach((panel) => {
    const isActive = panel.dataset.dropPanel === target;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });

  if (target === "manual") {
    stopDropCamera();
  }
}

function moveDropSubtabFocus(currentTrigger, direction) {
  const currentIndex = dropSubtabs.indexOf(currentTrigger);
  if (currentIndex < 0) return;

  const nextIndex = (currentIndex + direction + dropSubtabs.length) % dropSubtabs.length;
  const nextTrigger = dropSubtabs[nextIndex];
  activateDropSubtab(nextTrigger);
  nextTrigger.focus();
}

function openDocumentChecklist() {
  if (!documentChecklistTrigger || !documentChecklistPanel) return;
  documentChecklistPanel.hidden = false;
  documentChecklistTrigger.setAttribute("aria-expanded", "true");
}

function closeDocumentChecklist() {
  if (!documentChecklistTrigger || !documentChecklistPanel) return;
  documentChecklistPanel.hidden = true;
  documentChecklistTrigger.setAttribute("aria-expanded", "false");
}

function toggleDocumentChecklist() {
  if (documentChecklistPanel?.hidden) {
    openDocumentChecklist();
  } else {
    closeDocumentChecklist();
  }
}

function openDocumentNote() {
  if (!documentNoteTrigger || !documentNotePanel) return;
  documentNotePanel.hidden = false;
  documentNoteTrigger.setAttribute("aria-expanded", "true");
}

function closeDocumentNote() {
  if (!documentNoteTrigger || !documentNotePanel) return;
  documentNotePanel.hidden = true;
  documentNoteTrigger.setAttribute("aria-expanded", "false");
}

function toggleDocumentNote() {
  if (documentNotePanel?.hidden) {
    openDocumentNote();
  } else {
    closeDocumentNote();
  }
}

function openMaterialChecklistPanel() {
  if (!documentMaterialTrigger || !documentMaterialPanel) return;
  documentMaterialPanel.hidden = false;
  documentMaterialTrigger.setAttribute("aria-expanded", "true");
}

function closeMaterialChecklistPanel() {
  if (!documentMaterialTrigger || !documentMaterialPanel) return;
  documentMaterialPanel.hidden = true;
  documentMaterialTrigger.setAttribute("aria-expanded", "false");
}

function toggleMaterialChecklistPanel() {
  if (documentMaterialPanel?.hidden) {
    openMaterialChecklistPanel();
  } else {
    closeMaterialChecklistPanel();
  }
}

function openHashTab() {
  const aliases = {
    avaliacao: "indicacoes",
    plano: "prescricao",
    checklist: "documentos",
    "material-checklist": "documentos",
    monitoramento: "documentos",
    cuidador: "orientacoes-cuidador",
  };
  const rawHash = window.location.hash.replace("#", "");
  const target = aliases[rawHash] || rawHash || "boas-vindas";
  const tab = tabs.find((item) => item.dataset.tab === target);
  if (tab) activateTab(tab, { scrollToPanel: Boolean(rawHash) });
  if (rawHash === "checklist") openDocumentChecklist();
  if (rawHash === "material-checklist") openMaterialChecklistPanel();
}

function readChecklist() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveChecklist() {
  localStorage.setItem(storageKey, JSON.stringify(checklistItems.map((item) => item.checked)));
}

function updateChecklistProgress() {
  const checked = checklistItems.filter((item) => item.checked).length;
  const total = checklistItems.length;
  const percent = total ? Math.round((checked / total) * 100) : 0;
  checklistCount.textContent = `${checked} de ${total} itens marcados`;
  checklistProgress.style.width = `${percent}%`;
}

function restoreChecklist() {
  const saved = readChecklist();
  checklistItems.forEach((item, index) => {
    item.checked = Boolean(saved[index]);
  });
  updateChecklistProgress();
}

function readMaterialChecklist() {
  try {
    return JSON.parse(localStorage.getItem(materialStorageKey)) || [];
  } catch {
    return [];
  }
}

function saveMaterialChecklist() {
  localStorage.setItem(
    materialStorageKey,
    JSON.stringify(materialChecklistItems.map((item) => item.checked)),
  );
}

function updateMaterialChecklistProgress() {
  if (!materialChecklistCount || !materialChecklistProgress) return;
  const checked = materialChecklistItems.filter((item) => item.checked).length;
  const total = materialChecklistItems.length;
  const percent = total ? Math.round((checked / total) * 100) : 0;
  materialChecklistCount.textContent = `${checked} de ${total} itens marcados`;
  materialChecklistProgress.style.width = `${percent}%`;
}

function restoreMaterialChecklist() {
  const saved = readMaterialChecklist();
  materialChecklistItems.forEach((item, index) => {
    item.checked = Boolean(saved[index]);
  });
  updateMaterialChecklistProgress();
}

function normalizeSpeechText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function setVoiceStatus(message, className = "") {
  if (!voiceChecklistStatus) return;
  voiceChecklistStatus.className = `voice-status${className ? ` ${className}` : ""}`;
  voiceChecklistStatus.textContent = message;
}

function setMaterialVoiceStatus(message, className = "") {
  if (!materialVoiceStatus) return;
  materialVoiceStatus.className = `voice-status${className ? ` ${className}` : ""}`;
  materialVoiceStatus.textContent = message;
}

function markChecklistByVoice(index) {
  const item = checklistItems[index];
  if (!item || item.checked) return false;
  item.checked = true;
  return true;
}

function markMaterialByVoice(index) {
  const item = materialChecklistItems[index];
  if (!item || item.checked) return false;
  item.checked = true;
  return true;
}

const checklistVoiceTargets = [
  {
    index: 0,
    label: "prescrição atual",
    terms: ["prescricao atual", "prescricao conferida", "receita conferida"],
  },
  {
    index: 1,
    label: "compatibilidades",
    terms: ["compatibilidade", "compatibilidades revisadas", "fonte segura"],
  },
  {
    index: 2,
    label: "plano de retorno",
    terms: ["plano de retorno", "telemonitoramento", "retorno definido"],
  },
  {
    index: 3,
    label: "medicamentos e diluentes",
    terms: ["medicamentos", "solucoes", "diluentes", "medicacoes"],
  },
  {
    index: 4,
    label: "materiais de punção",
    terms: ["materiais de puncao", "fixacao", "cateter", "material de puncao"],
  },
  {
    index: 5,
    label: "descarte",
    terms: ["descarte", "perfurocortante", "perfurocortantes"],
  },
  {
    index: 6,
    label: "endereço e cuidador",
    terms: ["endereco", "cuidador", "cuidadora", "referencia confirmada"],
  },
  {
    index: 7,
    label: "telefone de suporte",
    terms: ["telefone", "suporte validado", "contato validado"],
  },
  {
    index: 8,
    label: "sinais de alerta",
    terms: ["sinais de alerta", "alertas revisados", "sinais revisados"],
  },
  {
    index: 9,
    label: "registro clínico",
    terms: ["registro clinico", "registro preparado", "preenchimento"],
  },
];

const materialVoiceTargets = [
  {
    index: 0,
    label: "bandeja e luvas do scalp",
    terms: ["bandeja scalp", "luvas scalp", "luva scalp", "bandeja agulhado", "luvas agulhado"],
  },
  {
    index: 1,
    label: "antisséptico do scalp",
    terms: ["alcool scalp", "clorexidina scalp", "antisseptico scalp", "antissepsia scalp"],
  },
  {
    index: 2,
    label: "gaze ou algodão do scalp",
    terms: ["gaze scalp", "algodao scalp", "gaze agulhado", "algodao agulhado"],
  },
  {
    index: 3,
    label: "cateter agulhado",
    terms: ["scalp", "cateter agulhado", "agulhado", "vinte e um", "vinte e cinco", "21", "25"],
  },
  {
    index: 4,
    label: "agulha 40 por 12 do scalp",
    terms: ["agulha scalp", "40 por 12 scalp", "quarenta por doze scalp", "aspiracao scalp"],
  },
  {
    index: 5,
    label: "seringa e soro fisiológico do scalp",
    terms: ["seringa scalp", "soro fisiologico scalp", "sf scalp", "flaconete scalp"],
  },
  {
    index: 6,
    label: "cobertura estéril do scalp",
    terms: ["cobertura scalp", "curativo scalp", "transparente scalp", "esteril scalp"],
  },
  {
    index: 7,
    label: "micropore ou esparadrapo do scalp",
    terms: ["micropore scalp", "esparadrapo scalp", "fita scalp", "fixacao scalp"],
  },
  {
    index: 8,
    label: "bandeja e luvas do jelco",
    terms: ["bandeja jelco", "luvas jelco", "luva jelco", "bandeja intima", "luvas intima", "bandeja nao agulhado"],
  },
  {
    index: 9,
    label: "antisséptico do jelco",
    terms: ["alcool jelco", "clorexidina jelco", "antisseptico jelco", "alcool intima", "clorexidina intima"],
  },
  {
    index: 10,
    label: "gaze ou algodão do jelco",
    terms: ["gaze jelco", "algodao jelco", "gaze intima", "algodao intima"],
  },
  {
    index: 11,
    label: "cateter não agulhado",
    terms: ["jelco", "intima", "nao agulhado", "cateter nao agulhado", "vinte e dois", "vinte e quatro", "22", "24"],
  },
  {
    index: 12,
    label: "agulha 40 por 12 do jelco",
    terms: ["agulha jelco", "40 por 12 jelco", "quarenta por doze jelco", "aspiracao jelco"],
  },
  {
    index: 13,
    label: "seringa e soro fisiológico do jelco",
    terms: ["seringa jelco", "soro fisiologico jelco", "sf jelco", "flaconete jelco", "seringa intima"],
  },
  {
    index: 14,
    label: "equipo de duas vias",
    terms: ["equipo", "duas vias", "dupla via", "extensor"],
  },
  {
    index: 15,
    label: "cobertura estéril do jelco",
    terms: ["cobertura jelco", "curativo jelco", "transparente jelco", "esteril jelco", "cobertura intima"],
  },
  {
    index: 16,
    label: "micropore ou esparadrapo do jelco",
    terms: ["micropore jelco", "esparadrapo jelco", "fita jelco", "fixacao jelco", "micropore intima"],
  },
];

function processChecklistVoice(text) {
  const normalized = normalizeSpeechText(text);
  if (!normalized) return;

  if (normalized.includes("limpar checklist") || normalized.includes("limpar marcacoes")) {
    checklistItems.forEach((item) => {
      item.checked = false;
    });
    saveChecklist();
    updateChecklistProgress();
    setVoiceStatus("Checklist limpo por comando de voz.", "warning");
    return;
  }

  const matchedLabels = [];
  checklistVoiceTargets.forEach((target) => {
    if (target.terms.some((term) => normalized.includes(term)) && markChecklistByVoice(target.index)) {
      matchedLabels.push(target.label);
    }
  });

  if (matchedLabels.length) {
    saveChecklist();
    updateChecklistProgress();
    setVoiceStatus(`Marcado por voz: ${matchedLabels.join(", ")}.`, "listening");
  }
}

function processMaterialVoice(text) {
  const normalized = normalizeSpeechText(text);
  if (!normalized) return;

  if (
    normalized.includes("limpar material") ||
    normalized.includes("limpar checklist") ||
    normalized.includes("limpar marcacoes")
  ) {
    materialChecklistItems.forEach((item) => {
      item.checked = false;
    });
    saveMaterialChecklist();
    updateMaterialChecklistProgress();
    setMaterialVoiceStatus("Checklist de materiais limpo por comando de voz.", "warning");
    return;
  }

  const matchedLabels = [];
  materialVoiceTargets.forEach((target) => {
    if (target.terms.some((term) => normalized.includes(term)) && markMaterialByVoice(target.index)) {
      matchedLabels.push(target.label);
    }
  });

  if (matchedLabels.length) {
    saveMaterialChecklist();
    updateMaterialChecklistProgress();
    setMaterialVoiceStatus(`Marcado por voz: ${matchedLabels.join(", ")}.`, "listening");
  }
}

function stopChecklistVoice() {
  checklistVoiceActive = false;
  if (checklistRecognition) checklistRecognition.stop();
  if (voiceChecklistToggle) voiceChecklistToggle.textContent = "Iniciar voz";
  setVoiceStatus("Assistente de voz pausado.");
}

function stopMaterialVoice() {
  materialVoiceActive = false;
  if (materialRecognition) materialRecognition.stop();
  if (materialVoiceToggle) materialVoiceToggle.textContent = "Iniciar voz";
  setMaterialVoiceStatus("Assistente de voz pausado.");
}

function startChecklistVoice() {
  if (!SpeechRecognition || !voiceChecklistToggle) {
    setVoiceStatus("Reconhecimento de voz indisponível neste navegador.", "warning");
    return;
  }

  if (materialVoiceActive) stopMaterialVoice();

  if (!checklistRecognition) {
    checklistRecognition = new SpeechRecognition();
    checklistRecognition.lang = "pt-BR";
    checklistRecognition.continuous = !isMobileVoiceDevice;
    checklistRecognition.interimResults = !isMobileVoiceDevice;

    checklistRecognition.addEventListener("result", (event) => {
      let spokenText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        spokenText += event.results[index][0].transcript;
      }
      if (voiceChecklistTranscript) {
        voiceChecklistTranscript.textContent = spokenText || "Aguardando fala...";
      }
      processChecklistVoice(spokenText);
    });

    checklistRecognition.addEventListener("error", () => {
      checklistVoiceActive = false;
      voiceChecklistToggle.textContent = "Iniciar voz";
      setVoiceStatus("Não foi possível captar o áudio. Verifique a permissão do microfone.", "warning");
    });

    checklistRecognition.addEventListener("end", () => {
      if (!checklistVoiceActive) return;
      if (isMobileVoiceDevice) {
        checklistVoiceActive = false;
        voiceChecklistToggle.textContent = "Iniciar voz";
        setVoiceStatus("Fala processada. Toque em iniciar voz para ditar outro item.", "warning");
        return;
      }
      try {
        checklistRecognition.start();
      } catch {
        checklistVoiceActive = false;
        voiceChecklistToggle.textContent = "Iniciar voz";
      }
    });
  }

  checklistVoiceActive = true;
  voiceChecklistToggle.textContent = "Parar voz";
  setVoiceStatus(
    isMobileVoiceDevice
      ? "Ouvindo. Fale uma frase curta com os itens conferidos."
      : "Ouvindo. Fale os itens conferidos do checklist.",
    "listening",
  );
  try {
    checklistRecognition.start();
  } catch {
    checklistVoiceActive = false;
    voiceChecklistToggle.textContent = "Iniciar voz";
    setVoiceStatus("Não foi possível iniciar a escuta. Tente novamente.", "warning");
  }
}

function startMaterialVoice() {
  if (!SpeechRecognition || !materialVoiceToggle) {
    setMaterialVoiceStatus("Reconhecimento de voz indisponível neste navegador.", "warning");
    return;
  }

  if (checklistVoiceActive) stopChecklistVoice();

  if (!materialRecognition) {
    materialRecognition = new SpeechRecognition();
    materialRecognition.lang = "pt-BR";
    materialRecognition.continuous = !isMobileVoiceDevice;
    materialRecognition.interimResults = !isMobileVoiceDevice;

    materialRecognition.addEventListener("result", (event) => {
      let spokenText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        spokenText += event.results[index][0].transcript;
      }
      if (materialVoiceTranscript) {
        materialVoiceTranscript.textContent = spokenText || "Aguardando fala...";
      }
      processMaterialVoice(spokenText);
    });

    materialRecognition.addEventListener("error", () => {
      materialVoiceActive = false;
      materialVoiceToggle.textContent = "Iniciar voz";
      setMaterialVoiceStatus("Não foi possível captar o áudio. Verifique a permissão do microfone.", "warning");
    });

    materialRecognition.addEventListener("end", () => {
      if (!materialVoiceActive) return;
      if (isMobileVoiceDevice) {
        materialVoiceActive = false;
        materialVoiceToggle.textContent = "Iniciar voz";
        setMaterialVoiceStatus("Fala processada. Toque em iniciar voz para ditar outro item.", "warning");
        return;
      }
      try {
        materialRecognition.start();
      } catch {
        materialVoiceActive = false;
        materialVoiceToggle.textContent = "Iniciar voz";
      }
    });
  }

  materialVoiceActive = true;
  materialVoiceToggle.textContent = "Parar voz";
  setMaterialVoiceStatus(
    isMobileVoiceDevice
      ? "Ouvindo. Fale uma frase curta com os materiais conferidos."
      : "Ouvindo. Fale os materiais conferidos do checklist.",
    "listening",
  );
  try {
    materialRecognition.start();
  } catch {
    materialVoiceActive = false;
    materialVoiceToggle.textContent = "Iniciar voz";
    setMaterialVoiceStatus("Não foi possível iniciar a escuta. Tente novamente.", "warning");
  }
}

const compatibilityLabels = {
  morfina: "Morfina",
  escopolamina: "Escopolamina",
  clorpromazina: "Clorpromazina",
  dipirona: "Dipirona",
  dexametasona: "Dexametasona",
  haloperidol: "Haloperidol",
  midazolam: "Midazolam",
  sf: "Soro fisiológico 0,9% (SF)",
};

const compatibilityPairs = {
  "escopolamina::morfina": {
    status: "compatível",
    className: "success",
    source: "Compatibilidade refs. 2, 5",
    detail:
      "Compatibilidade provável por suporte indireto para opioides com hyoscine butilbrometo em contexto paliativo.",
  },
  "haloperidol::morfina": {
    status: "compatível",
    className: "success",
    source: "Compatibilidade refs. 3, 5",
    detail:
      "Combinação frequente; há dados parenterais em SF 0,9% sem precipitação.",
  },
  "escopolamina::haloperidol": {
    status: "compatível",
    className: "success",
    source: "Compatibilidade ref. 1",
    detail:
      "Há dado SC para mistura com haloperidol e hyoscine butilbrometo em SF 0,9%.",
  },
  "midazolam::morfina": {
    status: "compatível",
    className: "success",
    source: "Compatibilidade refs. 4, 5",
    detail:
      "Combinação muito usada em infusão subcutânea contínua; há relato de boa tolerabilidade local.",
  },
  "haloperidol::midazolam": {
    status: "compatível",
    className: "success",
    source: "Compatibilidade refs. 3, 5",
    detail:
      "A combinação morfina + haloperidol + midazolam é descrita como frequente em CSCI em cuidados paliativos.",
  },
  "escopolamina::midazolam": {
    status: "compatível",
    className: "success",
    source: "Compatibilidade refs. 2, 5",
    detail:
      "Combinações com hioscina/escopolamina e midazolam são muito usadas em CSCI, inclusive com opioides.",
  },
  "clorpromazina::morfina": {
    status: "não testado",
    className: "warning",
    source: "Compatibilidade ref. 3",
    detail:
      "Há inferência por coquetéis parenterais, mas não dado SC direto para o par isolado.",
  },
  "clorpromazina::haloperidol": {
    status: "não testado",
    className: "warning",
    source: "Compatibilidade ref. 3",
    detail:
      "Sem precipitação em coquetel parenteral com morfina e haloperidol, mas não há dado SC direto para o par isolado.",
  },
  "clorpromazina::midazolam": {
    status: "não testado",
    className: "warning",
    source: "Síntese da aba Compatibilidade",
    detail:
      "Não há dado específico para via SC/hipodermóclise; a clorpromazina é descrita como potencialmente irritante por via subcutânea.",
  },
  "dexametasona::morfina": {
    status: "não testado",
    className: "warning",
    source: "Compatibilidade ref. 6 e síntese da aba",
    detail:
      "Combinação usada na prática, mas a fonte destaca falta de apoio laboratorial formal para muitas associações.",
  },
  "dexametasona::haloperidol": {
    status: "não testado",
    className: "warning",
    source: "Compatibilidade ref. 6",
    detail:
      "A dexametasona aparece como usada por via SC, mas não foi estudada nessas combinações específicas.",
  },
  "dexametasona::midazolam": {
    status: "não testado",
    className: "warning",
    source: "Compatibilidade ref. 6 e síntese da aba",
    detail:
      "A dexametasona aparece como usada por via SC, mas não há detalhamento de compatibilidade com midazolam nas misturas citadas.",
  },
};

const prescriptionData = {
  morfina: {
    dose: "Bolus SC: 2-3mg a cada 4 horas; infusão contínua: 10-20mg/dia, com ajuste individualizado",
    dilution:
      "Preferir soro fisiológico 0,9%; diluir a dose prescrita em SF 0,9% conforme volume planejado",
    time:
      "Bolus ou infusão contínua; velocidade usual entre 20-100mL/h, equivalente a aproximadamente 7-33 gotas/min em equipo de macrogotas, sem exceder 100mL/h",
    minVolume: "",
    comments:
      "Não existe dose máxima definida. Iniciar com doses menores em idosos, pacientes frágeis ou com doença renal.",
    reference: "1, 2, 3, 4",
  },
  escopolamina: {
    dose: "20mg 8/8h até 60mg 6/6h; estudo descreve bolus SC de 20mg e manutenção 60mg/24h",
    dilution: "SF 0,9% 1mL para bolus; volume de diluição para infusão contínua não especificado nas fontes",
    time: "Bolus ou infusão contínua; manutenção descrita como 10mg SC a cada 4h ou infusão contínua SC",
    minVolume: "",
    comments: "Não confundir com apresentação combinada com dipirona.",
    reference: "5, 6",
  },
  clorpromazina: {
    dose: "12,5 a 50mg até de 6/6h (dose máxima 150mg/dia)",
    dilution: "SF 50mL (intermitente); SF 100mL (infusão contínua)",
    time: "30min ou infusão contínua",
    minVolume: "",
    comments: "Se infusão contínua, usar frasco sem PVC.",
    reference: "7, 8, 9",
  },
  dipirona: {
    dose: "1 a 2g até 6/6h, conforme protocolo local",
    dilution: "Sem dado específico robusto para volume/diluição por hipodermóclise nas fontes revisadas",
    time: "Sem recomendação específica para dipirona por hipodermóclise; práticas gerais de CSCI usam infusões de 24h quando indicado",
    minVolume: "",
    comments:
      "As fontes revisadas não encontraram estudos com parâmetros específicos de volume, diluição ou taxa de infusão para metamizol/dipirona por hipodermóclise.",
    reference: "6, 7, 10",
  },
  dexametasona: {
    dose: "2 a 16mg a cada 24h",
    dilution: "Água para injeção ou SF 0,9%; volume final e concentração não especificados nas fontes",
    time: "Bolus ou infusão contínua; práticas gerais de CSCI costumam usar 24h",
    minVolume: "",
    comments:
      "Estudos descrevem uso subcutâneo frequente em cuidados paliativos, mas não trazem volume, concentração ou taxa em mL/h específicos para dexametasona.",
    reference: "6, 11, 12",
  },
  haloperidol: {
    dose: "Em CSCI, mediana aproximada de 2,5 a 3mg/24h; faixa observada de 0,5 a 10mg/24h",
    dilution:
      "Os estudos de CSCI não especificam receita padrão de diluição, volume final ou taxa em mL/h para haloperidol isolado",
    time: "Bolus lento ou infusão subcutânea contínua, geralmente em 24h",
    minVolume: "",
    comments: "",
    reference: "6, 12, 13, 14, 15, 16",
  },
  midazolam: {
    dose: "1 a 5mg em bolus ou infusão contínua, titulando conforme sintomas",
    dilution: "SF 0,9% 5mL para bolus; em CSCI, ajustar volume final conforme protocolo local e dispositivo disponível",
    time: "Bolus ou infusão subcutânea contínua, geralmente em 24h",
    minVolume: "",
    comments:
      "Pode causar irritação local. Velocidade de infusão de 0,5mL/h a 20mL/h, equivalente a aproximadamente 0,2-7 gotas/min em equipo de macrogotas.",
    reference: "6, 14, 15, 17",
  },
  sf: {
    dose: "Máximo 1500mL em 24h por sítio",
    dilution: "Solução pronta",
    time: "Infusão contínua conforme prescrição e tolerância local",
    minVolume: "",
    comments:
      "Volume de infusão máximo 62,5mL/h, equivalente a aproximadamente 21 gotas/min em equipo de macrogotas. Considerar o limite de volume conforme o sítio de punção escolhido.",
    reference: "6, 7, 8",
  },
};

function compatibilityKey(first, second) {
  return [first, second].sort().join("::");
}

function syncCompatibilityOptions() {
  [compatItemA, compatItemB].forEach((control) => {
    const other = control === compatItemA ? compatItemB : compatItemA;
    Array.from(control.options).forEach((option) => {
      option.disabled = option.value !== control.value && option.value === other.value;
    });
  });
}

function renderCompatibilityResult() {
  if (compatItemA.value === compatItemB.value) {
    const fallback = Array.from(compatItemB.options).find(
      (option) => option.value && option.value !== compatItemA.value,
    );
    if (fallback) compatItemB.value = fallback.value;
  }

  syncCompatibilityOptions();

  const first = compatItemA.value;
  const second = compatItemB.value;
  let result;

  if (first === "sf" || second === "sf") {
    result = {
      status: "compatível",
      className: "success",
      source: "Compatibilidade refs. 1, 2, 3",
      detail: "SF 0,9% é o diluente presente nas combinações com melhor suporte descritas na fonte.",
    };
  } else if (first === "dipirona" || second === "dipirona") {
    result = {
      status: "não testado",
      className: "warning",
      source: "Síntese da aba Compatibilidade",
      detail: "A fonte informa lacuna específica para compatibilidade da dipirona nessas misturas.",
    };
  } else {
    result =
      compatibilityPairs[compatibilityKey(first, second)] || {
        status: "não testado",
        className: "warning",
        detail: "Não há dado direto na fonte para este par. Priorize confirmação farmacêutica ou sítio separado.",
      };
  }

  compatInteractiveResult.className = `status-panel ${result.className}`;
  compatInteractiveResult.innerHTML = `
    <h2>${result.status}</h2>
    <p>${compatibilityLabels[first]} + ${compatibilityLabels[second]}: ${result.detail}</p>
  `;
}

function getCompatibility(first, second) {
  if (first === second || first === "sf" || second === "sf") {
    return { status: "compatível", className: "success", source: "Compatibilidade refs. 1, 2, 3" };
  }
  if (first === "dipirona" || second === "dipirona") {
    return { status: "não testado", className: "warning", source: "Síntese da aba Compatibilidade" };
  }
  return (
    compatibilityPairs[compatibilityKey(first, second)] || {
      status: "não testado",
      className: "warning",
      source: "Síntese da aba Compatibilidade",
    }
  );
}

function canSharePuncture(item, group) {
  return group.every((existing) => getCompatibility(item, existing).status === "compatível");
}

function groupItemsByCompatibility(items) {
  const groups = [];
  items.forEach((item) => {
    const compatibleGroup = groups.find((group) => canSharePuncture(item, group));
    if (compatibleGroup) {
      compatibleGroup.push(item);
    } else {
      groups.push([item]);
    }
  });
  return groups;
}

function selectedPrescriptionItems() {
  return prescriptionItemControls.map((control) => control.value).filter(Boolean);
}

function syncPrescriptionOptions() {
  prescriptionItemControls = Array.from(document.querySelectorAll(".prescription-item"));
}

function prescriptionOptionMarkup() {
  return `
    <option value="">Nenhum item</option>
    <option value="morfina">Morfina</option>
    <option value="escopolamina">Escopolamina</option>
    <option value="clorpromazina">Clorpromazina</option>
    <option value="dipirona">Dipirona</option>
    <option value="dexametasona">Dexametasona</option>
    <option value="haloperidol">Haloperidol</option>
    <option value="midazolam">Midazolam</option>
    <option value="sf">Soro fisiológico 0,9% (SF)</option>
  `;
}

function refreshPrescriptionItemLabels() {
  prescriptionItemControls.forEach((control, index) => {
    const label = control.closest(".form-row");
    const labelText = label?.querySelector("span");
    if (labelText) labelText.textContent = `Item ${index + 1}`;
  });
}

function bindPrescriptionItem(control) {
  control.addEventListener("change", () => {
    syncPrescriptionOptions();
    generatePrescription();
  });
}

function addPrescriptionItem() {
  if (!prescriptionItemsContainer) return;

  const label = document.createElement("label");
  label.className = "form-row";
  label.innerHTML = `
    <span>Item ${prescriptionItemControls.length + 1}</span>
    <select class="prescription-item">
      ${prescriptionOptionMarkup()}
    </select>
  `;

  prescriptionItemsContainer.append(label);
  const control = label.querySelector(".prescription-item");
  prescriptionItemControls.push(control);
  bindPrescriptionItem(control);
  refreshPrescriptionItemLabels();
  control.focus();
}

function prescriptionCompatibilityLines(items) {
  const lines = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const first = items[i];
      const second = items[j];
      const result = getCompatibility(first, second);
      lines.push(
        `- ${compatibilityLabels[first]} + ${compatibilityLabels[second]}: ${result.status}`,
      );
    }
  }
  return lines.length ? lines : ["- Apenas um item selecionado; não há pares para comparar."];
}

function prescriptionItemLines(item) {
  const data = prescriptionData[item];
  const lines = [
    `  - ${compatibilityLabels[item]}: ${data.dose}; diluir em ${data.dilution}; tempo de infusão: ${data.time}.`,
  ];
  if (data.minVolume) lines.push(`    Menor volume: ${data.minVolume}`);
  lines.push(`    Comentários: ${data.comments}`);
  lines.push(`    Referências da aba Medicamentos e soluções: ${data.reference}`);
  return lines;
}

function renderPunctureGroups(groups) {
  punctureGroups.innerHTML = groups
    .map(
      (group, index) => `
        <section class="puncture-card">
          <h3>Punção ${index + 1}</h3>
          <ul>
            ${group
              .map((item) => {
                const data = prescriptionData[item];
                return `
                  <li>
                    <strong>${compatibilityLabels[item]}</strong>
                    <span>Dose: ${data.dose}</span>
                    <span>Diluição: ${data.dilution}</span>
                    <span>Tempo: ${data.time}</span>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </section>
      `,
    )
    .join("");
}

function generatePrescription() {
  const items = selectedPrescriptionItems();
  if (!items.length) {
    punctureHighlight.className = "status-panel prescription-highlight warning";
    punctureHighlight.innerHTML = `
      <h2>Quantidade de hipodermóclises sugerida:</h2>
      <p>Selecione pelo menos um item.</p>
    `;
    punctureGroups.innerHTML = "";
    return;
  }

  const groups = groupItemsByCompatibility(items);
  const punctureWord = groups.length === 1 ? "punção de hipodermóclise" : "punções de hipodermóclises";
  punctureHighlight.className = "status-panel prescription-highlight success";
  punctureHighlight.innerHTML = `
    <h2>Quantidade de hipodermóclises sugerida:</h2>
    <p>${groups.length} ${punctureWord} para ${items.length} item(ns) selecionado(s).</p>
  `;
  renderPunctureGroups(groups);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab, { scrollToPanel: true }));
});

window.addEventListener("hashchange", openHashTab);

if (documentChecklistTrigger) {
  documentChecklistTrigger.addEventListener("click", toggleDocumentChecklist);
}

if (documentNoteTrigger) {
  documentNoteTrigger.addEventListener("click", toggleDocumentNote);
}

if (documentMaterialTrigger) {
  documentMaterialTrigger.addEventListener("click", toggleMaterialChecklistPanel);
}

if (closeChecklistButton) {
  closeChecklistButton.addEventListener("click", closeDocumentChecklist);
}

if (closeDocumentNoteButton) {
  closeDocumentNoteButton.addEventListener("click", closeDocumentNote);
}

if (closeMaterialChecklistPanelButton) {
  closeMaterialChecklistPanelButton.addEventListener("click", closeMaterialChecklistPanel);
}

[compatItemA, compatItemB].forEach((control) => {
  control.addEventListener("change", renderCompatibilityResult);
});

prescriptionItemControls.forEach(bindPrescriptionItem);

if (addPrescriptionItemButton) {
  addPrescriptionItemButton.addEventListener("click", addPrescriptionItem);
}

document.querySelector("#clearPrescription").addEventListener("click", () => {
  prescriptionItemControls.forEach((control) => {
    control.value = "";
  });
  syncPrescriptionOptions();
  refreshPrescriptionItemLabels();
  punctureHighlight.className = "status-panel prescription-highlight";
  punctureHighlight.innerHTML = `
    <h2>Quantidade de hipodermóclises sugerida:</h2>
    <p>Selecione os itens para gerar a prescrição automaticamente.</p>
  `;
  punctureGroups.innerHTML = "";
});

if (startDropCameraButton) {
  startDropCameraButton.addEventListener("click", startDropCamera);
}

if (stopDropCameraButton) {
  stopDropCameraButton.addEventListener("click", stopDropCamera);
}

if (startAutoDropCounterButton) {
  startAutoDropCounterButton.addEventListener("click", startAutoDropCounter);
}

if (stopAutoDropCounterButton) {
  stopAutoDropCounterButton.addEventListener("click", stopAutoDropCounter);
}

if (recordDropButton) {
  recordDropButton.addEventListener("click", recordDrop);
}

if (resetDropCounterButton) {
  resetDropCounterButton.addEventListener("click", resetDropCounter);
}

if (manualDropsMinute) {
  manualDropsMinute.addEventListener("input", syncManualFromDropsMinute);
}

if (manualMlHour) {
  manualMlHour.addEventListener("input", syncManualFromMlHour);
}

checklistItems.forEach((item) => {
  item.addEventListener("change", () => {
    saveChecklist();
    updateChecklistProgress();
  });
});

materialChecklistItems.forEach((item) => {
  item.addEventListener("change", () => {
    saveMaterialChecklist();
    updateMaterialChecklistProgress();
  });
});

materialSubtabs.forEach((trigger) => {
  trigger.addEventListener("click", () => activateMaterialSubtab(trigger));
});

materialListSubtabs.forEach((trigger) => {
  trigger.addEventListener("click", () => activateMaterialListSubtab(trigger));
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveMaterialListSubtabFocus(trigger, 1);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveMaterialListSubtabFocus(trigger, -1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      activateMaterialListSubtab(materialListSubtabs[0]);
      materialListSubtabs[0].focus();
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastTrigger = materialListSubtabs[materialListSubtabs.length - 1];
      activateMaterialListSubtab(lastTrigger);
      lastTrigger.focus();
    }
  });
});

techniqueSubtabs.forEach((trigger) => {
  trigger.addEventListener("click", () => activateTechniqueSubtab(trigger));
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveTechniqueSubtabFocus(trigger, 1);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveTechniqueSubtabFocus(trigger, -1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      activateTechniqueSubtab(techniqueSubtabs[0]);
      techniqueSubtabs[0].focus();
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastTrigger = techniqueSubtabs[techniqueSubtabs.length - 1];
      activateTechniqueSubtab(lastTrigger);
      lastTrigger.focus();
    }
  });
});

dropSubtabs.forEach((trigger) => {
  trigger.addEventListener("click", () => activateDropSubtab(trigger));
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveDropSubtabFocus(trigger, 1);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveDropSubtabFocus(trigger, -1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      activateDropSubtab(dropSubtabs[0]);
      dropSubtabs[0].focus();
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastTrigger = dropSubtabs[dropSubtabs.length - 1];
      activateDropSubtab(lastTrigger);
      lastTrigger.focus();
    }
  });
});

document.querySelector("#clearChecklist").addEventListener("click", () => {
  checklistItems.forEach((item) => {
    item.checked = false;
  });
  saveChecklist();
  updateChecklistProgress();
});

if (clearMaterialChecklistButton) {
  clearMaterialChecklistButton.addEventListener("click", () => {
    materialChecklistItems.forEach((item) => {
      item.checked = false;
    });
    saveMaterialChecklist();
    updateMaterialChecklistProgress();
  });
}

if (voiceChecklistToggle) {
  if (!SpeechRecognition) {
    voiceChecklistToggle.disabled = true;
    setVoiceStatus("Reconhecimento de voz indisponível neste navegador.", "warning");
  }

  voiceChecklistToggle.addEventListener("click", () => {
    if (checklistVoiceActive) {
      stopChecklistVoice();
    } else {
      startChecklistVoice();
    }
  });
}

if (materialVoiceToggle) {
  if (!SpeechRecognition) {
    materialVoiceToggle.disabled = true;
    setMaterialVoiceStatus("Reconhecimento de voz indisponível neste navegador.", "warning");
  }

  materialVoiceToggle.addEventListener("click", () => {
    if (materialVoiceActive) {
      stopMaterialVoice();
    } else {
      startMaterialVoice();
    }
  });
}

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const body = [
    `Nome: ${formData.get("name") || ""}`,
    `E-mail: ${formData.get("email") || ""}`,
    `Perfil: ${formData.get("profile") || ""}`,
    "",
    "Sugestão:",
    formData.get("message") || "",
  ].join("\n");

  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(
    "Sugestão de melhoria - iCare"
  )}&body=${encodeURIComponent(body)}`;

  window.location.href = mailto;
  contactResult.classList.add("show");
  contactForm.reset();
});

restoreChecklist();
restoreMaterialChecklist();
renderCompatibilityResult();
syncPrescriptionOptions();
updateVisitCounter();
openHashTab();
initializeAccessGate();
