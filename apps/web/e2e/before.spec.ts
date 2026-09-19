import { test } from "@playwright/test";
import { mockApi, projectId } from "./fixtures";

test("capture original Gikan", async ({ page }) => {
    test.skip(process.env.CAPTURE_BEFORE !== "1", "Historical capture, run before UI migration only.");
    await mockApi(page);
    for (const [name, path] of [["projects", "/"], ["list", `/projects/${projectId}/issues`], ["board", `/projects/${projectId}/board`], ["issue", `/projects/${projectId}/issues/PLAT-1`], ["documents", `/projects/${projectId}/documents`]]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `../../docs/visual/before/${name}.png`, animations: "disabled" });
    }
});
