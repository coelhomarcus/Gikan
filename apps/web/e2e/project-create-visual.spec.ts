import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockApi } from "./fixtures";

const outputDirectory = path.resolve(process.cwd(), "../../docs/visual/project-create");

test("capture the project creation dialog and compact icon selector on desktop and mobile", async ({ page }) => {
    await mkdir(outputDirectory, { recursive: true });
    await mockApi(page, { empty: true });
    await page.goto("/");
    await page.getByRole("button", { name: "New project" }).first().click();
    await expect(page.getByRole("heading", { name: "New project" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(outputDirectory, "project-create-desktop.png"), animations: "disabled" });

    const iconTrigger = page.getByRole("button", { name: "Choose project icon" });
    await iconTrigger.click();
    await expect(page.getByRole("textbox", { name: "Search project icons" })).toBeVisible();
    await page.screenshot({ path: path.join(outputDirectory, "project-create-icons-desktop.png"), animations: "disabled" });

    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("Name").focus();
    await page.screenshot({ path: path.join(outputDirectory, "project-create-mobile.png"), animations: "disabled" });
    await iconTrigger.click();
    await expect(page.getByRole("textbox", { name: "Search project icons" })).toBeVisible();
    const popup = page.getByRole("textbox", { name: "Search project icons" }).locator("xpath=ancestor::div[contains(@class, 'rounded-lg')]");
    const bounds = await popup.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: path.join(outputDirectory, "project-create-icons-mobile.png"), animations: "disabled" });
});
