import { render } from "ink";
import { App } from "./App.js";
import type { Session } from "../session/load.js";

export async function renderDashboard(session: Session, preset?: string): Promise<void> {
  const instance = render(<App session={session} preset={preset} />);
  await instance.waitUntilExit();
}
