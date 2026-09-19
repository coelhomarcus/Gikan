import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { mockApi, projectId } from "./fixtures";

const views = [
    ["projects", "/", "Platform"],
    ["overview", `/projects/${projectId}`, "Building a better workspace"],
    ["list", `/projects/${projectId}/issues`, "Build the project workspace"],
    ["board", `/projects/${projectId}/board`, "Backlog"],
    ["issue", `/projects/${projectId}/issues/PLAT-1`, "Build the project workspace"],
    ["documents", `/projects/${projectId}/documents`, "Overview notes"],
    ["cycles", `/projects/${projectId}/cycles`, "September sprint"],
    ["settings-general", `/projects/${projectId}/settings/general`, "General"],
    ["settings-states", `/projects/${projectId}/settings/states`, "States"],
    ["settings-members", `/projects/${projectId}/settings/members`, "Members"],
    ["settings-labels", `/projects/${projectId}/settings/labels`, "Labels"],
    ["profile-settings", "/settings/profile", "Settings / Profile"],
] as const;

test("capture stable dark Gikan route references at desktop widths", async ({ page }) => {
    test.setTimeout(180_000);
    await mockApi(page);
    for (const viewport of [
        { width: 1440, height: 900 },
        { width: 1920, height: 1080 },
    ]) {
        await page.setViewportSize(viewport);
        for (const [name, path, landmark] of views) {
            await page.goto(path);
            await expect(page.locator("[data-app-content]")).toBeVisible();
            await expect(page.getByText(landmark, { exact: false }).first()).toBeVisible();
            if (name === "settings-general") await expect(page.getByLabel("Loading icon picker")).toHaveCount(0);
            await page.evaluate(() => document.fonts.ready);
            const directory = `../../docs/visual/after/${viewport.width}-${viewport.height}`;
            await page.screenshot({ path: `${directory}/${name}.png`, animations: "disabled", fullPage: false });
        }
    }
});

test("capture responsive list, board, issue, and document views", async ({ page }) => {
    test.setTimeout(180_000);
    await mockApi(page);
    const responsiveViews = [
        ["list", `/projects/${projectId}/issues`],
        ["board", `/projects/${projectId}/board`],
        ["issue", `/projects/${projectId}/issues/PLAT-1`],
        ["documents", `/projects/${projectId}/documents`],
    ] as const;
    for (const viewport of [
        { width: 1024, height: 768 },
        { width: 768, height: 1024 },
        { width: 390, height: 844 },
    ]) {
        await page.setViewportSize(viewport);
        for (const [name, path] of responsiveViews) {
            await page.goto(path);
            await expect(page.locator("[data-app-content]")).toBeVisible();
            if (name === "list") await expect(page.locator('[data-issue-identifier="PLAT-1"]')).toBeVisible();
            if (name === "board") await expect(page.getByText("Backlog", { exact: true }).first()).toBeVisible();
            if (name === "issue") await expect(page.getByRole("textbox", { name: "Issue title" })).toHaveValue("Build the project workspace");
            if (name === "documents") await expect(page.getByRole("heading", { name: "Overview notes" })).toBeVisible();
            await page.evaluate(() => document.fonts.ready);
            const directory = `../../docs/visual/after/${viewport.width}-${viewport.height}`;
            await page.screenshot({ path: `${directory}/${name}.png`, animations: "disabled", fullPage: false });
        }
    }
});

test("capture interactive menu, focus, hover, Peek, and mobile drawer states", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/projects/${projectId}/issues`);
    await page.locator('[data-issue-identifier="PLAT-1"]').hover();
    await page.screenshot({ path: "../../docs/visual/after/1440-900/list-row-hover.png", animations: "disabled" });
    await page.getByPlaceholder("Search issues").focus();
    await page.screenshot({ path: "../../docs/visual/after/1440-900/list-search-focus.png", animations: "disabled" });

    await page.getByRole("button", { name: "Filters" }).click();
    await expect(page.getByText("Filter issues")).toBeVisible();
    await page.screenshot({ path: "../../docs/visual/after/1440-900/list-filters-open.png", animations: "disabled" });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Display" }).click();
    await expect(page.getByText("Display options")).toBeVisible();
    await page.screenshot({ path: "../../docs/visual/after/1440-900/list-display-open.png", animations: "disabled" });

    await page.keyboard.press("Escape");
    await page.locator('[data-issue-identifier="PLAT-1"]').click();
    await expect(page.getByRole("dialog", { name: "Issue PLAT-1" })).toBeVisible();
    await page.screenshot({ path: "../../docs/visual/after/1440-900/issue-peek.png", animations: "disabled" });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/projects/${projectId}/issues`);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
    await page.screenshot({ path: "../../docs/visual/after/390-844/mobile-navigation-open.png", animations: "disabled" });
});


test("capture Kanban and side Peek for Plane review", async ({ page }) => {
    await mockApi(page);
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        await page.goto(`/projects/${projectId}/board`);
        const card = page.locator('[data-issue-identifier="PLAT-1"]');
        await expect(card).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.mouse.move(0, 0);
        const directory = `../../docs/visual/after/${viewport.width}-${viewport.height}`;
        await page.screenshot({ path: `${directory}/board.png`, animations: "disabled" });
        await card.click();
        await expect(page.getByRole("textbox", { name: "Issue title" })).toHaveValue("Build the project workspace");
        await expect(page.getByRole("combobox", { name: "Cycle" })).toHaveValue("September sprint");
        await page.mouse.move(0, 0);
        await page.screenshot({ path: `${directory}/board-peek.png`, animations: "disabled" });
        if (viewport.width === 1440) {
            const measurements = await page.evaluate(() => {
                const selectors = { card: '[data-issue-identifier="PLAT-1"]', cardTitle: '[data-issue-identifier="PLAT-1"] p', cardIdentifier: '[data-issue-identifier="PLAT-1"] > span', title: '.plane-issue-peek textarea', description: '.peek-description .ProseMirror', panel: '[role="dialog"]' };
                return Object.fromEntries(Object.entries(selectors).map(([key, selector]) => {
                    const element = document.querySelector(selector)!;
                    const s = getComputedStyle(element), r = element.getBoundingClientRect();
                    return [key, { x: r.x, y: r.y, width: r.width, height: r.height, fontSize: s.fontSize, lineHeight: s.lineHeight, weight: s.fontWeight, background: s.backgroundColor, color: s.color, padding: s.padding, radius: s.borderRadius }];
                }));
            });
            await writeFile('../../docs/visual/gikan-kanban-peek-measurements.json', JSON.stringify(measurements, null, 2));
        }
    }
});
