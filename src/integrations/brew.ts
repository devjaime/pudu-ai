import { commandExists } from "../shared/which.js";
import { runCommand } from "../shared/process.js";

const BREW_CANDIDATES = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew", "brew"];

export async function resolveBrew(): Promise<string | undefined> {
  for (const bin of BREW_CANDIDATES) {
    const found = await commandExists(bin);
    if (found) return found;
  }
  return undefined;
}

export async function dockerReady(): Promise<boolean> {
  const docker = await commandExists("docker");
  if (!docker) return false;
  const info = await runCommand("docker", ["info"], { timeout: 8000 });
  return info.exitCode === 0;
}

export async function ensureBrew(): Promise<{ ok: boolean; brew?: string; log: string }> {
  const existing = await resolveBrew();
  if (existing) return { ok: true, brew: existing, log: existing };
  const install = await runCommand(
    "/bin/bash",
    ["-c", 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'],
    { timeout: 15 * 60_000 },
  );
  const after = await resolveBrew();
  if (after) return { ok: true, brew: after, log: after };
  return {
    ok: false,
    log: install.stderr || "Homebrew missing. Install: https://brew.sh",
  };
}

export async function brewInstallCask(name: string): Promise<{ ok: boolean; log: string }> {
  const brew = await resolveBrew();
  if (!brew) {
    const ensured = await ensureBrew();
    if (!ensured.ok || !ensured.brew) return { ok: false, log: ensured.log };
    const result = await runCommand(ensured.brew, ["install", "--cask", name], { timeout: 15 * 60_000 });
    return { ok: result.exitCode === 0, log: result.stderr || result.stdout };
  }
  const result = await runCommand(brew, ["install", "--cask", name], { timeout: 15 * 60_000 });
  if (result.exitCode === 0) return { ok: true, log: result.stdout };
  const formula = await runCommand(brew, ["install", name], { timeout: 15 * 60_000 });
  return { ok: formula.exitCode === 0, log: formula.stderr || formula.stdout };
}

export async function startDockerDesktop(): Promise<void> {
  if (process.platform === "darwin") {
    await runCommand("open", ["-a", "Docker"], { timeout: 15000 });
  }
}

export async function waitForDocker(ms = 90_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await dockerReady()) return true;
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  return dockerReady();
}
