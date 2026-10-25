import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { pollRunStatus, presentStage } from "../../docs/demos/pycon-2026/web/run-state.mjs";

test("report stages retain actual state and distinguish NOT_RUN from evidence labels", async () => {
  assert.deepEqual(presentStage({ status: "VERIFIED" }), {
    status: "VERIFIED",
    label: "Etapa verificada",
    className: "stage-verified",
  });
  assert.deepEqual(presentStage({ status: "NOT_RUN" }), {
    status: "NOT_RUN",
    label: "No ejecutada",
    className: "stage-not-run",
  });
  assert.deepEqual(presentStage({ status: "COMPLETED" }), {
    status: "COMPLETED",
    label: "Etapa completada",
    className: "stage-completed",
  });
  const app = await readFile(new URL("../../docs/demos/pycon-2026/web/app.js", import.meta.url), "utf8");
  assert.match(app, /presentStage\(stage\)/);
  assert.match(app, /\$\{stageView\.label\} · \$\{stageView\.status\}/);
  assert.doesNotMatch(app, /"status confirmed", stage\.status/);
  const report = JSON.parse(await readFile(new URL("../../docs/demos/pycon-2026/evidence/report.json", import.meta.url), "utf8"));
  for (const name of ["RUNTIME_TESTS", "MODEL_ANALYSIS"]) {
    const stage = report.stages.find((candidate) => candidate.name === name);
    assert.equal(stage.status, "NOT_RUN");
    assert.equal(presentStage(stage).className, "stage-not-run");
  }
});

test("poll exhaustion preserves the run ID and resumes polling the same run", async () => {
  const runId = "a1b2c3";
  const requestedIds = [];
  let status = "running";
  const fetchStatus = async (id) => {
    requestedIds.push(id);
    return { run_id: id, status };
  };
  const fetchEvents = async (id) => {
    requestedIds.push(id);
    return { events: [] };
  };
  const noWait = async () => {};

  const pending = await pollRunStatus(runId, fetchStatus, fetchEvents, { maxPolls: 2, delay: noWait });
  assert.equal(pending.kind, "pending");
  assert.equal(pending.runId, runId);
  assert.equal(requestedIds.length, 4);
  const app = await readFile(new URL("../../docs/demos/pycon-2026/web/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(outcome\.kind === "pending"\) \{[\s\S]*?return;\s*\}\s*activeRunId = null;/);
  assert.match(app, /resumeButton\.addEventListener\("click", \(\) => pollActiveRun\(activeRunId\)\)/);
  assert.match(app, /Boolean\(activeRunId\)/);

  status = "completed";
  const resumed = await pollRunStatus(pending.runId, fetchStatus, fetchEvents, { maxPolls: 2, delay: noWait });
  assert.equal(resumed.kind, "terminal");
  assert.equal(resumed.runId, runId);
  assert.equal(resumed.state.status, "completed");
  assert.ok(requestedIds.every((requestedId) => requestedId === runId));
});
