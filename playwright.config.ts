import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "**/*.e2e.spec.ts", fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:4173", launchOptions: { executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] }, screenshot: "only-on-failure" },
  projects: [{ name: "desktop", use: { viewport: { width: 1280, height: 900 } } }, { name: "mobile", use: { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } }],
  webServer: { command: "npm run preview -- --host 127.0.0.1 --port 4173", port: 4173, reuseExistingServer: !process.env.CI },
});
