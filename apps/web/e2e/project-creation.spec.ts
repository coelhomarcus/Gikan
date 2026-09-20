import { expect, test } from "@playwright/test";
import { mockApi, projectId } from "./fixtures";

test("new project modal validates fields, chooses a compact icon, and submits existing project data", async ({ page }) => {
    await mockApi(page, { empty: true });
    await page.goto("/");
    await page.getByRole("button", { name: "New project" }).first().click();

    await expect(page.getByRole("heading", { name: "New project" })).toBeVisible();
    const modal = page.getByRole("heading", { name: "New project" }).locator("xpath=ancestor::*[@role='dialog']");
    expect((await modal.boundingBox())?.width).toBe(672);
    const iconTriggerBounds = await page.getByRole("button", { name: "Choose project icon" }).boundingBox();
    const nameFieldBounds = await page.getByLabel("Name").locator("xpath=ancestor::*[@data-input-wrapper]").boundingBox();
    expect(iconTriggerBounds?.height).toBe(nameFieldBounds?.height);
    expect(Math.abs((iconTriggerBounds?.width ?? 0) - (iconTriggerBounds?.height ?? 0))).toBeLessThanOrEqual(1);
    const issueKeyFieldBounds = await page.getByLabel("Project ID").locator("xpath=ancestor::*[@data-input-wrapper]").boundingBox();
    expect(issueKeyFieldBounds?.y).toBeGreaterThan((nameFieldBounds?.y ?? 0) + (nameFieldBounds?.height ?? 0));
    const issueKeyHint = page.getByText("2–8 letters or numbers, used in issue identifiers. Leave blank to generate automatically.");
    await expect(issueKeyHint).toBeVisible();
    await expect(issueKeyHint).toHaveClass(/text-xs/);
    await expect(issueKeyHint).toHaveClass(/text-tertiary\/60/);

    await page.getByRole("button", { name: "Create project" }).click();
    await expect
        .poll(() => page.getByLabel("Name").evaluate((element) => element.closest('[data-invalid="true"]') !== null))
        .toBe(true);

    await page.getByLabel("Name").fill("Gikan Platform");
    await expect(page.getByLabel("Project ID")).toHaveAttribute("placeholder", "GP");
    await page.getByLabel("Project ID").fill("GIKAN7");

    await page.getByRole("button", { name: "Choose project icon" }).click();
    const search = page.getByRole("textbox", { name: "Search project icons" });
    await expect(search).toBeFocused();
    await search.fill("rocket");
    await expect(page.getByRole("button", { name: "Use rocket icon" })).toBeVisible();
    const iconMenu = page.getByRole("listbox", { name: "Choose project icon" });
    if (await iconMenu.count()) {
        const bounds = await iconMenu.boundingBox();
        expect(bounds?.width).toBeLessThanOrEqual(320);
    }
    await page.getByRole("button", { name: "Use rocket icon" }).click();
    await expect(search).toBeHidden();

    await page.getByLabel("Description").fill("A project created from the redesigned dialog.");
    await page.getByLabel("Repository URL").fill("https://github.com/example/gikan");
    const createRequest = page.waitForRequest((request) => request.method() === "POST" && new URL(request.url()).pathname === "/api/projects");
    await page.getByRole("button", { name: "Create project" }).click();
    const request = await createRequest;
    expect(request.postDataJSON()).toMatchObject({
        name: "Gikan Platform",
        issueKey: "GIKAN7",
        description: "A project created from the redesigned dialog.",
        repositoryUrl: "https://github.com/example/gikan",
        icon: "rocket",
    });
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
});

test("duplicate project ID stays in the modal and displays the API field error", async ({ page }) => {
    await mockApi(page, { empty: true });
    await page.route("**/api/projects", async (route) => {
        if (route.request().method() === "POST") {
            await route.fulfill({ status: 409, json: { error: "Project key is already in use" } });
            return;
        }
        await route.continue();
    });
    await page.goto("/");
    await page.getByRole("button", { name: "New project" }).first().click();
    await page.getByLabel("Name").fill("Duplicate Key Project");
    await page.getByLabel("Project ID").fill("PLAT");
    await page.getByRole("button", { name: "Create project" }).click();

    await expect(page.getByText("Project key is already in use")).toBeVisible();
    await expect(page.getByRole("heading", { name: "New project" })).toBeVisible();
    await expect(page.getByLabel("Project ID")).toHaveValue("PLAT");

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "New project" })).toBeHidden();
});
