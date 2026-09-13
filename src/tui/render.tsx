import { render } from "ink";
import { App } from "./App.js";
import type { Session } from "../session/load.js";
import type { Screen } from "./keys.js";
import type { HarnessLaunchRequest } from "../integrations/harness-launch.js";

export async function renderDashboard(
  session: Session,
  preset?: string,
  start?: Screen,
): Promise<HarnessLaunchRequest | undefined> {
  let pending: HarnessLaunchRequest | undefined;
  const instance = render(
    <App
      session={session}
      preset={preset}
      start={start}
      onLaunch={(req) => {
        pending = req;
      }}
    />,
    {
      exitOnCtrlC: true,
      patchConsole: true,
    },
  );
  await instance.waitUntilExit();
  return pending;
}
