import { loadEnvFile } from "node:process";
import { spawn } from "node:child_process";

// Vite loads .env.local for its own process; Vercel's Node functions do not.
// Load it before starting the CLI so both children inherit the server variables.
try {
  loadEnvFile(".env.local");
} catch {
  console.error(JSON.stringify({ event: "chat_dev_start_failed", code: "env_file_unavailable" }));
  process.exit(1);
}

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["vercel", "dev", ...process.argv.slice(2)], {
  stdio: "inherit", env: process.env,
});
child.on("error", () => {
  console.error(JSON.stringify({ event: "chat_dev_start_failed", code: "cli_unavailable" }));
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", code => { process.exitCode = code ?? 1; });
