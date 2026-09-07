import { render } from "ink";
import { App } from "./App.js";
import type { Session } from "../session/load.js";
import type { Screen } from "./keys.js";

export async function renderDashboard(session: Session, preset?: string, start?: Screen): Promise<void> {
  const instance = render(<App session={session} preset={preset} start={start} />);
  await instance.waitUntilExit();
}
