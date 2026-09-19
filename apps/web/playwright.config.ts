import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    retries: process.env.CI ? 1 : 0,
    workers: 2,
    reporter: "list",
    outputDir: "../../docs/visual/test-results",
    use: {
        baseURL: "http://127.0.0.1:5173",
        viewport: { width: 1440, height: 900 },
        locale: "en-US",
        timezoneId: "UTC",
        colorScheme: "light",
        deviceScaleFactor: 1,
        trace: "retain-on-failure",
    },
    webServer: { command: "pnpm dev --host 127.0.0.1", url: "http://127.0.0.1:5173", reuseExistingServer: !process.env.CI },
});
