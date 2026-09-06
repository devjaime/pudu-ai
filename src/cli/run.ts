import { addModelPath } from "../storage/config.js";
import { loadSession } from "../session/load.js";
import { runBenchmark } from "../benchmark/engine.js";
import { listBenchmarks } from "../storage/benchmarks.js";
import { killAll } from "../shared/process.js";
import { setLogLevel } from "../shared/logger.js";
import { renderDashboard } from "../tui/render.js";
import { resolveLocale, setLocale, t } from "../i18n/index.js";
import { parseAnswers, planTasks, tasksText } from "../tasks/plan.js";
import { helpText } from "./help.js";
import type { CliArgs } from "./parse-args.js";
import {
  compareText,
  doctorText,
  hardwareText,
  historyCsv,
  historyText,
  modelsText,
  recommendText,
  reportMarkdown,
  resultText,
  runtimesText,
} from "./text.js";

function print(value: unknown, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

export async function run(args: CliArgs): Promise<number> {
  setLocale(resolveLocale(args.lang));
  if (args.help) {
    process.stdout.write(`${helpText()}\n`);
    return 0;
  }
  if (args.verbose) setLogLevel("verbose");
  if (!args.color) process.env.NO_COLOR = "1";

  const cleanup = (): void => {
    void killAll("SIGTERM");
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });

  if (args.addPath) {
    await addModelPath(args.addPath);
    print(t("addedPath", { path: args.addPath }), args.json);
    return 0;
  }

  if (!args.json && !args.csv && process.stderr.isTTY) {
    process.stderr.write(`${t("loading")}\n`);
  }
  const session = await loadSession({ network: args.network });

  switch (args.command) {
    case "hardware":
      print(args.json ? session.hardware : `${hardwareText(session)}\n\n${runtimesText(session)}`, args.json);
      return 0;
    case "models":
      print(args.json ? session.rows : modelsText(session), args.json);
      return 0;
    case "recommend":
      print(args.json ? session.recommendations : recommendText(session), args.json);
      return 0;
    case "tasks": {
      const answers = parseAnswers({
        for: args.forKinds,
        scope: args.scope,
        priority: args.priority,
      });
      const plans = planTasks(session, answers);
      print(args.json ? { answers, plans } : tasksText(plans, answers), args.json);
      return 0;
    }
    case "history": {
      const records = session.history;
      if (args.csv) {
        process.stdout.write(`${historyCsv(records)}\n`);
        return 0;
      }
      print(args.json ? records : historyText(records), args.json);
      return 0;
    }
    case "doctor":
      print(args.json ? session : doctorText(session), args.json);
      return 0;
    case "compare":
      print(args.json ? session.history : compareText(session.history), args.json);
      return 0;
    case "report": {
      const last = session.history.at(-1);
      if (!last) {
        process.stderr.write(`${t("noHistory")}\n`);
        return 1;
      }
      process.stdout.write(reportMarkdown(last));
      return 0;
    }
    case "benchmark": {
      const id = args.positional[0];
      if (!id) {
        if (args.json) {
          print({ error: t("jsonNeedModel") }, true);
          return 1;
        }
        await renderDashboard(session, args.preset);
        return 0;
      }
      const model = session.models.find((m) => m.id === id || m.name === id);
      if (!model) {
        process.stderr.write(`${t("modelNotFound", { id })}\n`);
        return 1;
      }
      const catalog = session.rows.find((r) => r.local.id === model.id)?.catalog;
      const result = await runBenchmark({
        model,
        hardware: session.hardware,
        preset: args.preset,
        catalog,
      });
      if (args.json) {
        print(result.record, true);
        return 0;
      }
      process.stdout.write(`${resultText(result.record, result.assessment)}\n`);
      return 0;
    }
    case "dashboard":
    default:
      if (args.json) {
        print(session, true);
        return 0;
      }
      await renderDashboard(session, args.preset);
      return 0;
  }
}

export { listBenchmarks };
