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
const contactEmail = "icarehipodermoclise@gmail.com";
const storageKey = "icare-model-checklist";

function activateTab(tab) {
  const targetId = tab.dataset.tab;

  tabs.forEach((item) => {
    item.setAttribute("aria-selected", String(item === tab));
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });

  if (targetId === "tecnica" && techniqueVideo) {
    techniqueVideo.src = techniqueVideo.dataset.src;
  }

  history.replaceState(null, "", `#${targetId}`);
}

function openHashTab() {
  const aliases = {
    avaliacao: "indicacoes",
    plano: "prescricao",
    monitoramento: "checklist",
    cuidador: "contato",
  };
  const rawHash = window.location.hash.replace("#", "");
  const target = aliases[rawHash] || rawHash || "boas-vindas";
  const tab = tabs.find((item) => item.dataset.tab === target);
  if (tab) activateTab(tab);
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

const compatibilityLabels = {
  morfina: "Morfina",
  escopolamina: "Escopolamina",
  clorpromazina: "Clorpromazina",
  dipirona: "Dipirona",
  dexametasona: "Dexametasona",
  haloperidol: "Haloperidol",
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
  "dexametasona::morfina": {
    status: "não testado",
    className: "warning",
    detail:
      "Combinação usada na prática, mas a fonte destaca falta de apoio laboratorial formal para muitas associações.",
  },
  "dexametasona::haloperidol": {
    status: "incompatível",
    className: "danger",
    detail:
      "Evitar sem validação. A fonte não apresenta dado direto com haloperidol e recomenda confirmação farmacêutica ou sítio separado.",
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

function renderCompatibilityResult() {
  const first = compatItemA.value;
  const second = compatItemB.value;
  let result;

  if (first === second) {
    result = {
      status: "compatível",
      className: "success",
      detail: "Mesmo item selecionado; não há mistura de fármacos diferentes.",
    };
  } else if (first === "sf" || second === "sf") {
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
  const used = new Set();
  return prescriptionItemControls
    .map((control) => control.value)
    .filter(Boolean)
    .filter((value) => {
      if (used.has(value)) return false;
      used.add(value);
      return true;
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
    document.querySelector("#prescriptionOutput").value =
      "Selecione pelo menos um item para gerar a prescrição orientada por compatibilidade.";
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
  const groupLines = groups.flatMap((group, index) => [
    `Punção ${index + 1}: ${group.map((item) => compatibilityLabels[item]).join(" + ")}`,
    "  - Via: subcutânea",
    ...group.flatMap((item) => prescriptionItemLines(item)),
  ]);
  punctureHighlight.className = "status-panel prescription-highlight success";
  punctureHighlight.innerHTML = `
    <h2>Número orientado: ${groups.length}</h2>
    <p>${groups.length} ${punctureWord} para ${items.length} item(ns) selecionado(s).</p>
  `;
  renderPunctureGroups(groups);

  document.querySelector("#prescriptionOutput").value = [
    "Prescrição por hipodermóclise",
    `Itens selecionados (${items.length}/5): ${items.map((item) => compatibilityLabels[item]).join(", ")}`,
    "",
    `Número orientado: ${groups.length} ${punctureWord}`,
    ...groupLines,
    "",
    "Compatibilidade entre os itens:",
    ...prescriptionCompatibilityLines(items),
    "",
    "Fontes usadas: tabela-base de medicamentos/soluções para dose, diluição, tempo e comentários; documento de compatibilidade para agrupamento por punção.",
    "Orientações: separar em punções diferentes os pares incompatíveis ou não testados; confirmar prescrição final, diluição, volume, velocidade e protocolo local antes da administração; registrar sítio e monitorar precipitação, dor, edema progressivo, secreção, febre ou piora clínica.",
  ].join("\n");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab));
});

[compatItemA, compatItemB].forEach((control) => {
  control.addEventListener("change", renderCompatibilityResult);
});

prescriptionItemControls.forEach((control) => {
  control.addEventListener("change", generatePrescription);
});

document.querySelector("#copyPrescription").addEventListener("click", async () => {
  const output = document.querySelector("#prescriptionOutput");
  if (!output.value) generatePrescription();
  try {
    await navigator.clipboard.writeText(output.value);
  } catch {
    output.focus();
    output.select();
  }
});
document.querySelector("#clearPrescription").addEventListener("click", () => {
  document.querySelector("#prescriptionOutput").value = "";
  prescriptionItemControls.forEach((control) => {
    control.value = "";
  });
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
openHashTab();
