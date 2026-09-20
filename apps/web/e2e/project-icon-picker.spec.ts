import { expect, test } from "@playwright/test";
import { mockApi, projectId } from "./fixtures";

test("project icon picker keeps scrolling vertical and inside the icon list", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/settings/general`);

    for (const viewport of [
        { width: 1440, height: 900 },
        { width: 390, height: 844 },
    ]) {
        await page.setViewportSize(viewport);
        await page.getByRole("button", { name: "Change project icon" }).click();
        const dialog = page.getByRole("dialog", { name: "Project icon" });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText("63 icons")).toBeVisible();

        const measurements = await dialog.evaluate((popup) => {
            const list = popup.querySelector<HTMLElement>(".overflow-y-auto");
            const grid = popup.querySelector<HTMLElement>('[aria-label="Popular"] > div');
            if (!list || !grid) throw new Error("The icon list or icon grid is missing");

            return {
                popupOverflowY: getComputedStyle(popup).overflowY,
                popupFits: popup.scrollHeight <= popup.clientHeight,
                listOverflowY: getComputedStyle(list).overflowY,
                listOverflowX: getComputedStyle(list).overflowX,
                listHasVerticalContent: list.scrollHeight > list.clientHeight,
                gridFits: grid.scrollWidth <= grid.clientWidth,
            };
        });

        expect(measurements).toEqual({
            popupOverflowY: "hidden",
            popupFits: true,
            listOverflowY: "auto",
            listOverflowX: "hidden",
            listHasVerticalContent: true,
            gridFits: true,
        });

        await page.keyboard.press("Escape");
    }
});
