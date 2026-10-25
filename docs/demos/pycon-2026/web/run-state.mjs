const STAGE_LABELS = new Map([
  ["VERIFIED", ["Etapa verificada", "stage-verified"]],
  ["COMPLETED", ["Etapa completada", "stage-completed"]],
  ["NOT_RUN", ["No ejecutada", "stage-not-run"]],
]);

export function presentStage(stage) {
  const status = typeof stage?.status === "string" ? stage.status : "UNKNOWN";
  const [label, className] = STAGE_LABELS.get(status) || ["Estado no clasificado", "stage-unknown"];
  return { status, label, className };
}

export async function pollRunStatus(runId, fetchStatus, fetchEvents, {
  maxPolls = 300,
  delay = () => new Promise((resolve) => setTimeout(resolve, 1200)),
  onUpdate = () => {},
} = {}) {
  let state = null;
  let events = [];
  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const [nextState, activity] = await Promise.all([fetchStatus(runId), fetchEvents(runId)]);
    state = nextState;
    events = Array.isArray(activity.events) ? activity.events.slice(-100) : [];
    onUpdate(state, events);
    if (state.status === "completed" || state.status === "failed") {
      return { kind: "terminal", runId, state, events };
    }
    if (attempt + 1 < maxPolls) await delay();
  }
  return { kind: "pending", runId, state, events };
}
