"use strict";

import { pollRunStatus, presentStage } from "/web/run-state.mjs";

const byId = (id) => document.getElementById(id);
const reportRoot = byId("report");
const reportState = byId("report-state");
const preflight = byId("preflight");
const modelSelect = byId("model-select");
const refreshButton = byId("refresh-models");
const runButton = byId("run-button");
const resumeButton = byId("resume-run");
const runStatus = byId("run-status");
const runError = byId("run-error");
const eventList = byId("run-events");
const runResult = byId("run-result");
const findingsRoot = byId("findings");
const video = byId("demo-video");
const videoFallback = byId("video-fallback");
let installedModels = [];
let activeRun = false;
let activeRunId = null;
let pollingRun = false;
let preflightReady = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function statusClass(value) {
  if (value === "CONFIRMED") return "confirmed";
  if (value === "INFERRED") return "inferred";
  return "unresolved";
}

function updateRunControls() {
  runButton.disabled = !installedModels.length || !preflightReady || activeRun || Boolean(activeRunId);
  refreshButton.disabled = activeRun || pollingRun;
  resumeButton.hidden = !activeRunId;
  resumeButton.disabled = !activeRunId || pollingRun;
}

function renderReport(report) {
  reportRoot.replaceChildren();
  for (const claim of Array.isArray(report.claims) ? report.claims : []) {
    const card = element("article", "claim");
    card.append(element("span", `status ${statusClass(claim.status)}`, claim.status || "UNRESOLVED"));
    card.append(element("h3", "", claim.title || "Afirmación sin título"));
    card.append(element("p", "", claim.summary || "Sin resumen disponible."));
    const references = Array.isArray(claim.sources) ? claim.sources.slice(0, 8) : [];
    for (const reference of references) {
      const path = typeof reference.path === "string" ? reference.path : "Referencia sin ruta";
      const lines = `${reference.line_start ?? "?"}–${reference.line_end ?? "?"}`;
      card.append(element("p", "refs", `${reference.label || "EVIDENCIA"} · ${path}:${lines} · ${reference.relationship || ""}`));
    }
    reportRoot.append(card);
  }
  for (const stage of Array.isArray(report.stages) ? report.stages : []) {
    const card = element("article", "claim");
    const stageView = presentStage(stage);
    card.append(element("span", `stage-state ${stageView.className}`, `${stageView.label} · ${stageView.status}`));
    card.append(element("h3", "", stage.name || "Etapa"));
    card.append(element("p", "", stage.detail || "Sin detalle."));
    reportRoot.append(card);
  }
  const measurement = report.context_reduction;
  if (measurement) {
    const card = element("article", "claim");
    card.append(element("span", "status inferred", "MEDICIÓN"));
    card.append(element("h3", "", "Reducción de bytes"));
    card.append(element("p", "", `${measurement.byte_reduction_percent}% · ${measurement.evidence_metadata_bytes} bytes de metadatos frente a ${measurement.cited_source_file_bytes} bytes en ${measurement.cited_source_files} archivos citados.`));
    card.append(element("p", "refs", measurement.interpretation || "Medición de tamaño, no de comprensión."));
    reportRoot.append(card);
  }
  reportState.textContent = `Informe ${report.schema || "local"} · revisión ${report.repository?.revision || "sin revisión"} · etiqueta ${report.repository?.tag || "sin etiqueta"}`;
}

async function loadReport() {
  try {
    renderReport(await getJson("/api/presentation/report.json"));
  } catch {
    reportState.textContent = "No se pudo cargar el informe local. Los artefactos enlazados siguen disponibles.";
    reportState.className = "notice error";
  }
}

async function refreshPreflight() {
  preflight.dataset.state = "loading";
  try {
    const state = await getJson("/api/preflight");
    preflightReady = Boolean(state.ready);
    const text = state.ready
      ? `Disponible · fixture ${state.fixture?.tag || "verificado"} · inventario de modelos accesible.`
      : `No disponible para ejecutar · fixture ${state.fixture_available ? "presente" : "ausente"} · inventario ${state.models_available ? "accesible" : "no disponible"}.`;
    preflight.replaceChildren(element("span", "", text));
    preflight.dataset.state = state.ready ? "ready" : "blocked";
  } catch {
    preflightReady = false;
    preflight.replaceChildren(element("span", "", "No se pudo verificar el servicio local. Puedes revisar el informe estático."));
    preflight.dataset.state = "error";
  }
}

async function refreshModels() {
  refreshButton.disabled = true;
  modelSelect.disabled = true;
  try {
    const inventory = await getJson("/api/models");
    installedModels = Array.isArray(inventory.models) ? inventory.models.filter((model) =>
      typeof model.tag === "string" && typeof model.digest === "string" && model.tag && model.digest) : [];
    modelSelect.replaceChildren();
    modelSelect.append(new Option(installedModels.length ? "Selecciona un modelo" : "No hay modelos instalados", ""));
    installedModels.forEach((model, index) => {
      modelSelect.append(new Option(`${model.tag} · ${model.digest}`, String(index)));
    });
    modelSelect.disabled = installedModels.length === 0;
    updateRunControls();
    runStatus.textContent = installedModels.length
      ? `${installedModels.length} identidad(es) instalada(s), obtenida(s) del inventario local.`
      : "No hay modelos instalados disponibles para seleccionar.";
  } catch {
    installedModels = [];
    runButton.disabled = true;
    modelSelect.replaceChildren(new Option("Inventario no disponible", ""));
    runStatus.textContent = "No fue posible actualizar los modelos instalados.";
  } finally {
    updateRunControls();
  }
}

function appendEvents(events) {
  eventList.replaceChildren();
  for (const event of Array.isArray(events) ? events.slice(-100) : []) {
    const row = element("li");
    row.append(element("strong", "", event.stage || "evento"));
    row.append(document.createTextNode(` — ${event.message || ""}`));
    eventList.append(row);
  }
}

function renderRunResult(run) {
  findingsRoot.replaceChildren();
  const result = run.result && typeof run.result === "object" ? run.result : {};
  findingsRoot.append(element("h3", "", result.summary || "Síntesis recibida"));
  const findings = Array.isArray(result.findings) ? result.findings.slice(0, 32) : [];
  if (!findings.length) findingsRoot.append(element("p", "muted", "La respuesta no contiene hallazgos proyectados."));
  for (const finding of findings) {
    const item = element("article", "finding");
    item.append(element("span", `status ${statusClass(finding.label)}`, finding.label || "UNRESOLVED"));
    item.append(element("p", "", finding.claim || finding.summary || "Hallazgo sin afirmación."));
    if (finding.rationale) item.append(element("p", "muted", finding.rationale));
    const refs = Array.isArray(finding.evidence_refs) ? finding.evidence_refs.slice(0, 8) : [];
    if (refs.length) item.append(element("p", "refs", `Referencias proyectadas: ${refs.join(" · ")}`));
    findingsRoot.append(item);
  }
  if (run.manifest_id) {
    const link = element("a", "manifest-link", "Abrir manifiesto redactado de esta corrida");
    link.href = `/api/manifests/${encodeURIComponent(run.manifest_id)}`;
    findingsRoot.append(link);
  }
  findingsRoot.append(element("p", "muted", "Respuesta proyectada y redactada por el servidor. Validez estructural no significa veracidad factual; los hallazgos no fueron comprobados."));
  runResult.hidden = false;
}

async function pollActiveRun(runId) {
  if (!runId || pollingRun || runId !== activeRunId) return;
  pollingRun = true;
  activeRun = true;
  runError.hidden = true;
  updateRunControls();
  try {
    const outcome = await pollRunStatus(
      runId,
      (id) => getJson(`/api/runs/${encodeURIComponent(id)}`),
      (id) => getJson(`/api/runs/${encodeURIComponent(id)}/events`),
      {
        onUpdate(state, events) {
          appendEvents(events);
          runStatus.textContent = state.status === "running" ? "Análisis en ejecución…" : "Corrida en cola…";
        },
      },
    );
    if (outcome.kind === "pending") {
      runStatus.textContent = `La consulta de ${runId} alcanzó su límite local. El servidor puede seguir trabajando; continúa consultando esta misma corrida.`;
      return;
    }
    activeRunId = null;
    activeRun = false;
    if (outcome.state.status === "completed") {
      runStatus.textContent = "Corrida completada. La corrección factual no fue verificada.";
      renderRunResult(outcome.state);
    } else {
      runStatus.textContent = "La corrida terminó con error.";
      runError.textContent = outcome.state.error || "La corrida falló.";
      runError.hidden = false;
    }
  } catch (error) {
    runError.textContent = `No se pudo consultar ${runId}: ${error.message}. Se conserva la corrida para reanudar la consulta.`;
    runError.hidden = false;
    runStatus.textContent = "No hay un estado terminal confirmado; no se iniciará otra corrida.";
  } finally {
    pollingRun = false;
    updateRunControls();
  }
}

async function startRun() {
  const model = installedModels[Number(modelSelect.value)];
  if (!model || activeRun || activeRunId || !preflightReady) return;
  activeRun = true;
  runError.hidden = true;
  runResult.hidden = true;
  eventList.replaceChildren();
  updateRunControls();
  runStatus.textContent = "Enviando la identidad exacta al servidor local…";
  try {
    const response = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ model: model.tag, digest: model.digest }),
      cache: "no-store",
    });
    const accepted = await response.json();
    if (!response.ok) throw new Error(accepted.error || `HTTP ${response.status}`);
    if (typeof accepted.run_id !== "string" || !/^[0-9a-f]{32}$/.test(accepted.run_id)) {
      throw new Error("El servidor devolvió un identificador de corrida no válido.");
    }
    activeRunId = accepted.run_id;
    runStatus.textContent = `Corrida ${activeRunId} en cola…`;
    await pollActiveRun(activeRunId);
  } catch (error) {
    if (!activeRunId) activeRun = false;
    runError.textContent = `No se pudo iniciar la corrida: ${error.message}`;
    runError.hidden = false;
    runStatus.textContent = activeRunId
      ? "No hay un estado terminal confirmado; se conserva la corrida para reanudar."
      : "No hay una corrida activa.";
  } finally {
    updateRunControls();
  }
}

refreshButton.addEventListener("click", async () => {
  await refreshPreflight();
  await refreshModels();
});
runButton.addEventListener("click", startRun);
resumeButton.addEventListener("click", () => pollActiveRun(activeRunId));
video.addEventListener("error", () => { video.hidden = true; videoFallback.hidden = false; });

loadReport();
refreshPreflight();
