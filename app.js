const tabs = Array.from(document.querySelectorAll(".tab-trigger"));
const panels = Array.from(document.querySelectorAll(".tab-panel"));
const checklistItems = Array.from(document.querySelectorAll("#visitChecklist input[type='checkbox']"));
const checklistCount = document.querySelector("#checklistCount");
const checklistProgress = document.querySelector("#checklistProgress");
const compatItemA = document.querySelector("#compatItemA");
const compatItemB = document.querySelector("#compatItemB");
const compatInteractiveResult = document.querySelector("#compatInteractiveResult");
const prescriptionItemControls = Array.from(document.querySelectorAll(".prescription-item"));
const punctureHighlight = document.querySelector("#punctureHighlight");
const punctureGroups = document.querySelector("#punctureGroups");
const contactForm = document.querySelector("#contactForm");
const contactResult = document.querySelector("#contactResult");
const techniqueVideo = document.querySelector("#techniqueVideo");
const visitCounter = document.querySelector("#visitCounter");
const voiceChecklistToggle = document.querySelector("#voiceChecklistToggle");
const voiceChecklistStatus = document.querySelector("#voiceChecklistStatus");
const voiceChecklistTranscript = document.querySelector("#voiceChecklistTranscript");
const documentChecklistTrigger = document.querySelector("#documentChecklistTrigger");
const documentChecklistPanel = document.querySelector("#checklist");
const contactEmail = "icarehipodermoclise@gmail.com";
const storageKey = "icare-model-checklist";
const visitCounterUrl = "https://abacus.jasoncameron.dev/hit/icare-hipodermoclise1/visitas";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isMobileVoiceDevice =
  window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 820px)").matches;
let checklistRecognition = null;
let checklistVoiceActive = false;

async function updateVisitCounter() {
  try {
    const response = await fetch(visitCounterUrl, { cache: "no-store" });
    const data = await response.json();
    visitCounter.textContent = String(data.value);
  } catch {
    visitCounter.textContent = "--";
  }
}

function activateTab(tab) {
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

  history.replaceState(null, "", `#${targetId}`);
}

function loadTechniqueVideo() {
  if (!techniqueVideo || techniqueVideo.getAttribute("src") !== "about:blank") return;
  techniqueVideo.src = techniqueVideo.dataset.src;
}

function openDocumentChecklist() {
  if (!documentChecklistTrigger || !documentChecklistPanel) return;
  documentChecklistPanel.hidden = false;
  documentChecklistTrigger.setAttribute("aria-expanded", "true");
}

function openHashTab() {
  const aliases = {
    avaliacao: "indicacoes",
    plano: "prescricao",
    checklist: "documentos",
    monitoramento: "documentos",
    cuidador: "contato",
  };
  const rawHash = window.location.hash.replace("#", "");
  const target = aliases[rawHash] || rawHash || "boas-vindas";
  const tab = tabs.find((item) => item.dataset.tab === target);
  if (tab) activateTab(tab);
  if (rawHash === "checklist") openDocumentChecklist();
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

function markChecklistByVoice(index) {
  const item = checklistItems[index];
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

function stopChecklistVoice() {
  checklistVoiceActive = false;
  if (checklistRecognition) checklistRecognition.stop();
  if (voiceChecklistToggle) voiceChecklistToggle.textContent = "Iniciar voz";
  setVoiceStatus("Assistente de voz pausado.");
}

function startChecklistVoice() {
  if (!SpeechRecognition || !voiceChecklistToggle) {
    setVoiceStatus("Reconhecimento de voz indisponível neste navegador.", "warning");
    return;
  }

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
    detail:
      "Compatibilidade provável por suporte indireto para opioides com hyoscine butilbrometo em contexto paliativo.",
  },
  "haloperidol::morfina": {
    status: "compatível",
    className: "success",
    detail:
      "Combinação frequente; há dados parenterais em SF 0,9% sem precipitação.",
  },
  "escopolamina::haloperidol": {
    status: "compatível",
    className: "success",
    detail:
      "Há dado SC para mistura com haloperidol e hyoscine butilbrometo em SF 0,9%.",
  },
  "midazolam::morfina": {
    status: "compatível",
    className: "success",
    detail:
      "Combinação muito usada em infusão subcutânea contínua; há relato de boa tolerabilidade local.",
  },
  "haloperidol::midazolam": {
    status: "compatível",
    className: "success",
    detail:
      "A combinação morfina + haloperidol + midazolam é descrita como frequente em CSCI em cuidados paliativos.",
  },
  "escopolamina::midazolam": {
    status: "compatível",
    className: "success",
    detail:
      "Combinações com hioscina/escopolamina e midazolam são muito usadas em CSCI, inclusive com opioides.",
  },
  "clorpromazina::morfina": {
    status: "não testado",
    className: "warning",
    detail:
      "Há inferência por coquetéis parenterais, mas não dado SC direto para o par isolado.",
  },
  "clorpromazina::haloperidol": {
    status: "não testado",
    className: "warning",
    detail:
      "Sem precipitação em coquetel parenteral com morfina e haloperidol, mas não há dado SC direto para o par isolado.",
  },
  "clorpromazina::midazolam": {
    status: "não testado",
    className: "warning",
    detail:
      "Não há dado específico para via SC/hipodermóclise; a clorpromazina é descrita como potencialmente irritante por via subcutânea.",
  },
  "dexametasona::morfina": {
    status: "não testado",
    className: "warning",
    detail:
      "Combinação usada na prática, mas a fonte destaca falta de apoio laboratorial formal para muitas associações.",
  },
  "dexametasona::haloperidol": {
    status: "não testado",
    className: "warning",
    detail:
      "A dexametasona aparece como usada por via SC, mas não foi estudada nessas combinações específicas.",
  },
  "dexametasona::midazolam": {
    status: "não testado",
    className: "warning",
    detail:
      "A dexametasona aparece como usada por via SC, mas não há detalhamento de compatibilidade com midazolam nas misturas citadas.",
  },
};

const prescriptionData = {
  morfina: {
    dose: "Dose inicial: 2-3mg 4/4h (bolus) ou infusão contínua ACM",
    dilution:
      "Não requer diluição (bolus); 1mg/mL = 100mg de morfina + SF qsp 100mL (infusão contínua)",
    time: "Bolus ou infusão contínua",
    minVolume: "",
    comments:
      "Não existe dose máxima. Iniciar com a menor dose possível em pacientes muito idosos, frágeis ou com doença renal crônica.",
    reference: "1, 2",
  },
  escopolamina: {
    dose: "20mg 8/8h até 60mg 6/6h",
    dilution: "SF 50mL (intermitente); SF 100mL (infusão contínua)",
    time: "50min ou infusão contínua",
    minVolume: "SF 1:1mL, infusão lenta em bolus",
    comments:
      "Seguir padrão de 1mL/min ou 62,5mL/h. Pode produzir boca seca, confusão e sedação.",
    reference: "1, 2, 4",
  },
  clorpromazina: {
    dose: "12,5 a 50mg até de 6/6h (dose máxima 150mg/dia)",
    dilution: "SF 50mL (intermitente); SF 100mL (infusão contínua)",
    time: "30min ou infusão contínua",
    minVolume: "",
    comments: "Se infusão contínua, usar frasco sem PVC.",
    reference: "6, 7, 8",
  },
  dipirona: {
    dose: "1 a 2g até 6/6h",
    dilution: "SF 1:1mL",
    time: "Aplicação lenta em bolus",
    minVolume: "",
    comments: "Seguir padrão de 1mL/min.",
    reference: "1, 2",
  },
  dexametasona: {
    dose: "2 a 16mg a cada 24h",
    dilution: "SF 50mL",
    time: "60min",
    minVolume: "SF 1:1mL, aplicação lenta",
    comments:
      "Sítio exclusivo, devido incompatibilidade com outras drogas e risco de irritação local.",
    reference: "1, 4",
  },
  haloperidol: {
    dose: "0,5 a 30mg/dia",
    dilution: "AD 1:1mL",
    time: "Bolus: infusão lenta",
    minVolume: "",
    comments:
      "Pode-se administrar em bolus único diário. Recomenda-se metade da dose para idosos. Diluir em água, pois altas doses podem precipitar com SF. Concentração máxima 2mg/mL. Administrar em sítio exclusivo.",
    reference: "2.0",
  },
  midazolam: {
    dose: "1 a 5mg em bolus ou infusão contínua ACM",
    dilution:
      "SF 5mL (bolus); 1mg/mL = 100mg de midazolam + SF qsp 100mL (infusão contínua)",
    time: "ACM",
    minVolume: "",
    comments:
      "Pode causar irritação local. Velocidade de infusão de 0,5mL/h a 20mL/h. Primeira escolha como sedativo. Titular a dose de acordo com os sintomas.",
    reference: "1, 4",
  },
  sf: {
    dose: "Máximo 1500mL em 24h por sítio",
    dilution: "Solução pronta",
    time: "Infusão contínua conforme prescrição e tolerância local",
    minVolume: "",
    comments:
      "Volume de infusão máximo 62,5mL/h. Coxa é preferencial para volumes maiores. Volume máximo somando todos os sítios: 3000mL/24h.",
    reference: "1.0",
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
      detail: "SF 0,9% é o diluente presente nas combinações com melhor suporte descritas na fonte.",
    };
  } else if (first === "dipirona" || second === "dipirona") {
    result = {
      status: "não testado",
      className: "warning",
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
    return { status: "compatível", className: "success" };
  }
  if (first === "dipirona" || second === "dipirona") {
    return { status: "não testado", className: "warning" };
  }
  return (
    compatibilityPairs[compatibilityKey(first, second)] || {
      status: "não testado",
      className: "warning",
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
  const selected = selectedPrescriptionItems();
  prescriptionItemControls.forEach((control) => {
    Array.from(control.options).forEach((option) => {
      option.disabled =
        Boolean(option.value) && option.value !== control.value && selected.includes(option.value);
    });
  });
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
  lines.push(`    Referência da tabela-base: ${data.reference}`);
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
      <h2>Número orientado</h2>
      <p>Selecione pelo menos um item.</p>
    `;
    punctureGroups.innerHTML = "";
    return;
  }

  const groups = groupItemsByCompatibility(items);
  const punctureWord = groups.length === 1 ? "punção por hipodermóclise" : "punções por hipodermóclise";
  punctureHighlight.className = "status-panel prescription-highlight success";
  punctureHighlight.innerHTML = `
    <h2>Número orientado: ${groups.length}</h2>
    <p>${groups.length} ${punctureWord} para ${items.length} item(ns) selecionado(s).</p>
  `;
  renderPunctureGroups(groups);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab));
});

window.addEventListener("hashchange", openHashTab);

if (documentChecklistTrigger) {
  documentChecklistTrigger.addEventListener("click", openDocumentChecklist);
}

[compatItemA, compatItemB].forEach((control) => {
  control.addEventListener("change", renderCompatibilityResult);
});

prescriptionItemControls.forEach((control) => {
  control.addEventListener("change", () => {
    syncPrescriptionOptions();
    generatePrescription();
  });
});

document.querySelector("#clearPrescription").addEventListener("click", () => {
  prescriptionItemControls.forEach((control) => {
    control.value = "";
  });
  syncPrescriptionOptions();
  punctureHighlight.className = "status-panel prescription-highlight";
  punctureHighlight.innerHTML = `
    <h2>Número orientado</h2>
    <p>Selecione os itens para gerar a prescrição automaticamente.</p>
  `;
  punctureGroups.innerHTML = "";
});

checklistItems.forEach((item) => {
  item.addEventListener("change", () => {
    saveChecklist();
    updateChecklistProgress();
  });
});

document.querySelector("#clearChecklist").addEventListener("click", () => {
  checklistItems.forEach((item) => {
    item.checked = false;
  });
  saveChecklist();
  updateChecklistProgress();
});

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
renderCompatibilityResult();
syncPrescriptionOptions();
updateVisitCounter();
openHashTab();
