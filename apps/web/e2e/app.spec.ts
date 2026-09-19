import { expect, test } from "@playwright/test";
import { columns, mockApi, projectId } from "./fixtures";

test("dark theme, URL filters, and issue peek preserve the current workspace", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/issues`);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
    await expect(page.getByText("Build the project workspace")).toBeVisible();

    await page.getByPlaceholder("Search issues").fill("refine");
    await expect(page).toHaveURL(/q=refine/);
    await expect(page.locator('[data-issue-identifier="PLAT-2"]')).toBeVisible();
    await expect(page.locator('[data-issue-identifier="PLAT-1"]')).toHaveCount(0);

    await page.locator('[data-issue-identifier="PLAT-2"]').click();
    await expect(page).toHaveURL(/issues\/PLAT-2/);
    const peek = page.getByRole("dialog", { name: "Issue PLAT-2" });
    await expect(peek).toBeVisible();
    expect((await peek.boundingBox())?.width).toBe((1440 - 16) / 2);
    await expect(page.getByRole("combobox", { name: "Assignee" })).toHaveAttribute("placeholder", "Unassigned");
    await expect(page.getByRole("combobox", { name: "Label" })).toHaveValue("Design");
    await expect(page.getByRole("combobox", { name: "Cycle" })).toHaveValue("September sprint");
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/issues\?q=refine$/);
    await expect(page.locator('[data-issue-identifier="PLAT-2"]')).toBeFocused();
});

test("list and board switch without dropping query state; settings routes load", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/issues?priority=high&group=status`);
    await expect(page.locator('[data-issue-identifier="PLAT-1"]')).toBeVisible();

    await page.getByRole("link", { name: "Board layout" }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/board\\?priority=high&group=status`));
    await expect(page.locator('[class*="w-[350px]"]').first()).toHaveCSS("width", "350px");
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/board\\?priority=high&group=status`));

    await page.getByRole("link", { name: "List layout" }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/issues\\?priority=high&group=status`));

    await page.goto(`/projects/${projectId}/settings`);
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/settings/general`));
    await expect(page.getByLabel("Project name", { exact: true })).toBeVisible();
    await page.goto(`/projects/${projectId}/settings/states`);
    await expect(page.getByRole("heading", { name: "States" })).toBeVisible();
    await page.goto(`/projects/${projectId}/cycles`);
    await expect(page.getByText("September sprint")).toBeVisible();
});

test("mobile navigation opens as an accessible dark drawer", async ({ page }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/projects/${projectId}/issues`);
    const openNavigation = page.getByRole("button", { name: "Open navigation" });
    await openNavigation.click();
    const navigation = page.getByRole("dialog", { name: "Navigation" });
    await expect(navigation).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.keyboard.press("Escape");
    await expect(navigation).toBeHidden();
    await expect(openNavigation).toBeFocused();
});

test("creates an issue and saves an edited title from its peek view", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/issues`);
    await page.locator("#main-content").getByRole("button", { name: "New issue" }).click();
    await page.getByRole("textbox", { name: "Issue title" }).fill("Validate the new dark workspace");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/issues\/PLAT-5/);
    await expect(page.getByRole("dialog", { name: "Issue PLAT-5" })).toBeVisible();
    const title = page.getByRole("textbox", { name: "Issue title" });
    await title.fill("Updated workspace issue");
    const updateResponse = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().includes("/issues/PLAT-5"));
    await title.blur();
    await updateResponse;
    await expect(title).toHaveValue("Updated workspace issue");
});

test("saves project document content and creates a cycle", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/documents`);
    const editor = page.locator(".ProseMirror[contenteditable='true']").first();
    await editor.fill("Updated planning notes for the September sprint.");
    const documentSave = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().includes("/document"));
    await page.getByRole("button", { name: "Save" }).click();
    await documentSave;
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    await page.goto(`/projects/${projectId}/cycles`);
    await page.getByPlaceholder("Cycle name").fill("October sprint");
    await page.getByRole("button", { name: "Create cycle" }).click();
    await expect(page.getByText("October sprint", { exact: true })).toBeVisible();
});

test("posts an issue comment", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/issues/PLAT-1`);
    await page.locator(".ProseMirror[contenteditable='true']").last().fill("Workspace details are ready for review.");
    const commentSave = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith("/comments"));
    await page.getByRole("button", { name: "Comment" }).click();
    await commentSave;
    await expect(page.getByText("Workspace details are ready for review.", { exact: true })).toBeVisible();
});

test("presents API load errors", async ({ page }) => {
    await mockApi(page, { errorPath: `/projects/${projectId}/issues` });
    await page.goto(`/projects/${projectId}/issues`);
    await expect(page.getByText("Could not load the project issues.")).toBeVisible();
});

test("signs in and out without changing the existing account flow", async ({ page }) => {
    await mockApi(page, { authenticated: false });
    await page.goto(`/projects/${projectId}/issues`);
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Username or email").fill("alex@example.test");
    await page.getByRole("textbox", { name: "Password *", exact: true }).fill("correct-horse-battery");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    const logoutResponse = page.waitForResponse((response) => response.url().endsWith("/auth/logout"));
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    expect((await logoutResponse).status()).toBe(204);
    await expect(page).toHaveURL(/\/login$/);
});

test("registers an account with the existing invitation field", async ({ page }) => {
    await mockApi(page, { authenticated: false });
    await page.goto("/register");
    await page.getByRole("textbox", { name: "Name *", exact: true }).fill("Alex Morgan");
    await page.getByRole("textbox", { name: "Username *", exact: true }).fill("alex");
    await page.getByRole("textbox", { name: "Email *", exact: true }).fill("alex@example.test");
    await page.getByRole("textbox", { name: "Password *", exact: true }).fill("correct-horse-battery");
    await page.getByRole("textbox", { name: "Special code *", exact: true }).fill("GIKAN-DEMO");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
});

test("project settings update details, statuses, labels, and members", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/settings/general`);
    await page.getByLabel("Description").fill("A focused workspace for product delivery.");
    const projectSave = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().endsWith(`/projects/${projectId}`));
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await projectSave;
    await expect(page.getByText("Project details saved.")).toBeVisible();

    await page.goto(`/projects/${projectId}/settings/states`);
    await page.getByRole("button", { name: "Add state", exact: true }).click();
    await page.getByRole("textbox", { name: "State name" }).fill("In review");
    await page.locator("form").getByRole("button", { name: "Add state", exact: true }).click();
    const reviewRow = page.locator("li").filter({ hasText: "In review" });
    await expect(reviewRow).toBeVisible();
    await reviewRow.hover();
    await reviewRow.getByRole("button", { name: "Edit In review" }).click();
    await page.getByRole("textbox", { name: "State name" }).fill("QA review");
    await page.locator("form").getByRole("button", { name: "Save", exact: true }).click();
    const savedStatus = page.locator("li").filter({ hasText: "QA review" });
    await expect(savedStatus).toBeVisible();
    await savedStatus.hover();
    await savedStatus.getByRole("button", { name: "Delete state" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete state" }).click();
    await expect(savedStatus).toHaveCount(0);

    await page.goto(`/projects/${projectId}/settings/labels`);
    await page.getByRole("button", { name: "Add label", exact: true }).click();
    await page.getByRole("textbox", { name: "Label name" }).fill("User research");
    await page.locator("form").getByRole("button", { name: "Add label", exact: true }).click();
    const researchRow = page.locator("li").filter({ hasText: "User research" });
    await expect(researchRow).toBeVisible();
    await researchRow.hover();
    await researchRow.getByRole("button", { name: "Edit User research" }).click();
    await page.getByRole("textbox", { name: "Label name" }).fill("UX research");
    await page.locator("form").getByRole("button", { name: "Save", exact: true }).click();
    const savedLabel = page.locator("li").filter({ hasText: "UX research" });
    await expect(savedLabel).toBeVisible();
    await savedLabel.hover();
    await savedLabel.getByRole("button", { name: "Delete label" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete label" }).click();
    await expect(savedLabel).toHaveCount(0);

    await page.goto(`/projects/${projectId}/settings/members`);
    await page.getByRole("button", { name: "Add member", exact: true }).click();
    await page.getByLabel("Username", { exact: true }).fill("sam");
    const invite = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/projects/${projectId}/members`));
    await page.getByRole("dialog").getByRole("button", { name: "Add member", exact: true }).click();
    await invite;
    const member = page.getByRole("row").filter({ hasText: "sam@example.test" });
    await expect(member).toBeVisible();
    await member.hover();
    await member.getByRole("button", { name: /^Remove / }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove member" }).click();
    await expect(member).toHaveCount(0);
});

test("issue properties and relations save, and description can be edited", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/issues/PLAT-1`);

    await page.getByRole("combobox", { name: "Priority" }).click();
    const prioritySave = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().endsWith("/issues/PLAT-1"));
    await page.getByRole("option", { name: "Low" }).click();
    await prioritySave;
    await expect(page.getByRole("combobox", { name: "Priority" })).toHaveText("Low");

    const description = page.locator(".ProseMirror[contenteditable='true']").first();
    await description.fill("A detailed implementation plan for the project workspace.");
    const descriptionSave = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().endsWith("/issues/PLAT-1"));
    await page.getByRole("button", { name: "Save description" }).click();
    await descriptionSave;
    await expect(description).toContainText("A detailed implementation plan for the project workspace.");

    const relationForm = page.locator("form").filter({ has: page.getByPlaceholder("Issue identifier") });
    const relationPicker = page.getByPlaceholder("Issue identifier");
    await relationPicker.fill("PLAT-2");
    await page.getByRole("option", { name: /PLAT-2/ }).click();
    const relationSave = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith("/issues/PLAT-1/relations"));
    await relationForm.getByRole("button", { name: "Add" }).click();
    await relationSave;
    await expect(page.getByRole("link", { name: /PLAT-2.*Refine the issue list/ })).toBeVisible();
});

test("an issue can be assigned as a sub-issue and appears under its parent", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/issues/PLAT-2`);
    await page.getByRole("combobox", { name: "Parent" }).click();
    const parentSave = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().endsWith("/issues/PLAT-2"));
    await page.getByRole("option", { name: /PLAT-1/ }).click();
    await parentSave;
    await expect(page.getByRole("combobox", { name: "Parent" })).toHaveAttribute("placeholder", "PLAT-1 · Build the project workspace");

    await page.goto(`/projects/${projectId}/issues/PLAT-1`);
    await expect(page.getByText("Sub-issues · 1")).toBeVisible();
    await expect(page.getByRole("link", { name: /PLAT-2.*Refine the issue list/ })).toBeVisible();
});

test("board drag and drop moves an issue into its new status", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/board`);
    const issue = page.locator('[data-issue-identifier="PLAT-1"]');
    const destination = page.locator('[data-issue-identifier="PLAT-3"]');
    const moveRequest = page.waitForRequest((request) => request.method() === "PATCH" && request.url().endsWith("/issues/PLAT-1"));
    await issue.dragTo(destination, { steps: 10, targetPosition: { x: 24, y: 18 } });
    const request = await moveRequest;
    expect(request.postDataJSON().columnId).toBe(columns[2].id);
    await expect(page.locator('[data-issue-identifier="PLAT-1"]')).toBeVisible();
});

test("profile edits are saved and administration export respects account permissions", async ({ page }) => {
    await mockApi(page);
    await page.goto("/settings/profile");
    await page.getByRole("textbox", { name: "Full name", exact: true }).fill("Alex Morgan Updated");
    const profileSave = page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().endsWith("/users/me"));
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await profileSave;
    await expect(page.getByText("Profile saved.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Download backup" })).toHaveAttribute("href", "/api/admin/backup");

    await mockApi(page, { admin: false });
    await page.goto("/settings/profile");
    await expect(page.getByRole("link", { name: "Download backup" })).toHaveCount(0);
});

test("empty data has a clear empty state and issue update failures are reported", async ({ page }) => {
    await mockApi(page, { empty: true });
    await page.goto(`/projects/${projectId}/issues`);
    await expect(page.getByText("No issues yet", { exact: false })).toBeVisible();

    await mockApi(page);
    await page.route(`**/api/issues/PLAT-1`, async (route) => {
        if (route.request().method() === "PATCH") return route.fulfill({ status: 500, json: { error: "Simulated service failure" } });
        return route.fallback();
    });
    await page.goto(`/projects/${projectId}/issues/PLAT-1`);
    const title = page.getByRole("textbox", { name: "Issue title" });
    await title.fill("Unsaved issue title");
    await title.blur();
    await expect(page.getByRole("alert")).toContainText("Simulated service failure");
});

test("Kanban keeps Plane card geometry and rolls back a failed move", async ({ page }) => {
    await mockApi(page);
    await page.route("**/api/issues/PLAT-1", async (route) => {
        if (route.request().method() === "PATCH") return route.fulfill({ status: 500, json: { error: "Move failed. Try again." } });
        return route.fallback();
    });
    await page.goto(`/projects/${projectId}/board`);
    const card = page.locator('[data-issue-identifier="PLAT-1"]');
    await expect(card).toHaveCSS("width", "350px");
    await expect(card).toHaveCSS("padding", "12px");
    await expect(card).toHaveCSS("border-radius", "8px");
    await expect(card.locator("p")).toHaveCSS("font-size", "14px");
    await expect(card.locator("p")).toHaveCSS("font-weight", "500");
    const destination = page.locator('[data-issue-identifier="PLAT-3"]');
    await card.dragTo(destination, { steps: 10, targetPosition: { x: 24, y: 18 } });
    await expect(page.getByRole("alert")).toContainText("Move failed");
    await expect(page.locator(`[data-board-column="${columns[0].id}"]`).locator('[data-issue-identifier="PLAT-1"]')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/board$`));
});

test("Peek menus, description save, and close preserve board context", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/board`);
    const card = page.locator('[data-issue-identifier="PLAT-1"]');
    await card.click();
    const peek = page.getByRole("dialog", { name: "Issue PLAT-1" });
    await expect(peek).toBeVisible();
    expect((await peek.boundingBox())?.x).toBe(720);
    expect((await peek.boundingBox())?.y).toBe(40);
    await expect(peek.locator(".tiptap-toolbar")).toHaveCount(0);
    await expect(card).toHaveAttribute("data-peek-selected", "true");
    await peek.getByRole("combobox", { name: "Priority" }).click();
    await expect(page.getByRole("option", { name: "Low", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(peek).toBeVisible();
    await expect(peek.getByRole("combobox", { name: "Priority" })).toBeFocused();
    const description = peek.locator(".peek-description .ProseMirror");
    await description.fill("A description edited from the board Peek.");
    await expect(peek.locator(".tiptap-toolbar")).toBeVisible();
    const saved = page.waitForResponse(r => r.request().method() === "PATCH" && r.url().endsWith("/issues/PLAT-1"));
    await peek.getByRole("button", { name: "Save description" }).click();
    await saved;
    await expect(peek.locator(".tiptap-toolbar")).toHaveCount(0);
    await peek.getByRole("button", { name: "Add relation" }).click();
    await expect(peek.getByPlaceholder("Issue identifier")).toBeVisible();
    await peek.getByRole("button", { name: "Close issue" }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/board$`));
    await expect(card).toBeFocused();
    await card.press("Enter");
    await expect(page.getByRole("dialog").locator(".peek-description .ProseMirror")).toHaveText("A description edited from the board Peek.");
});

test("keyboard board dragging and column collapse remain operable", async ({ page }) => {
    await mockApi(page);
    await page.goto(`/projects/${projectId}/board`);
    const card = page.locator('[data-issue-identifier="PLAT-1"]');
    await card.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/board$`));
    await expect(page.locator(`[data-board-column="${columns[0].id}"]`).locator('[data-issue-identifier="PLAT-1"]')).toBeVisible();
    await page.getByRole("button", { name: "Collapse Backlog" }).click();
    await expect(card).toBeHidden();
    await page.getByRole("button", { name: "Expand Backlog" }).click();
    await expect(card).toBeVisible();
});
