import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { documentId, mockApi, projectId } from "./fixtures";

const documentWith = (...content: Record<string, unknown>[]) => ({ type: "doc" as const, content });
const paragraph = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });

async function openDocument(page: Page, content: ReturnType<typeof documentWith>) {
    await mockApi(page, { documentContent: content });
    await page.goto(`/projects/${projectId}/documents/${documentId}`);
    await expect(page.getByRole("textbox", { name: "Document content" })).toBeVisible();
}

test("markdown heading input rule changes only its current block and Enter starts body text", async ({ page }) => {
    await openDocument(page, documentWith(paragraph("Stable text before"), paragraph("Target title"), paragraph("Stable text after")));
    const editor = page.getByRole("textbox", { name: "Document content" });
    const target = editor.locator(":scope > p").nth(1);
    await target.click({ position: { x: 1, y: 12 } });
    await page.keyboard.press("Home");
    await page.keyboard.type("# ");

    const heading = editor.locator(":scope > h1");
    await expect(heading).toHaveText("Target title");
    await expect(editor.locator(":scope > p").first()).toHaveText("Stable text before");
    await expect(editor.locator(":scope > p").last()).toHaveText("Stable text after");
    const [headingSize, paragraphSize] = await Promise.all([
        heading.evaluate((element) => getComputedStyle(element).fontSize),
        editor
            .locator(":scope > p")
            .first()
            .evaluate((element) => getComputedStyle(element).fontSize),
    ]);
    expect(parseFloat(headingSize)).toBeGreaterThan(parseFloat(paragraphSize));

    await heading.evaluate((element) => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
    });
    await expect(editor).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(editor).toBeFocused();
    await page.keyboard.type("Body text remains normal");
    await expect(editor.locator(":scope > h1")).toHaveCount(1);
    await expect(editor.locator(":scope > p").nth(1)).toHaveText("Body text remains normal");
    await expect(editor.locator(":scope > p").nth(2)).toHaveText("Stable text after");
});

for (const [syntax, tag] of [
    ["## ", "h2"],
    ["### ", "h3"],
] as const) {
    test(`${syntax.trim()} markdown changes only its current paragraph`, async ({ page }) => {
        await openDocument(page, documentWith(paragraph("Before"), paragraph("Section title"), paragraph("After")));
        const editor = page.getByRole("textbox", { name: "Document content" });
        const target = editor.locator(":scope > p").nth(1);
        await target.click({ position: { x: 1, y: 12 } });
        await page.keyboard.press("Home");
        await page.keyboard.type(syntax);
        await expect(editor.locator(`:scope > ${tag}`)).toHaveText("Section title");
        await expect(editor.locator(":scope > p").first()).toHaveText("Before");
        await expect(editor.locator(":scope > p").last()).toHaveText("After");
    });
}

test("slash menu opens at the caret and Escape keeps its token in place", async ({ page }) => {
    await openDocument(page, documentWith(paragraph("Before"), paragraph("Target section"), paragraph("After")));
    const editor = page.getByRole("textbox", { name: "Document content" });
    const target = editor.locator(":scope > p").nth(1);
    await target.click({ position: { x: 1, y: 12 } });
    await page.keyboard.press("Home");
    await page.keyboard.type("/");
    const commands = page.getByRole("listbox", { name: "Editor commands" });
    await expect(commands).toBeVisible();
    await expect(commands.getByRole("option")).toHaveCount(12);
    await page.keyboard.press("Escape");
    await expect(commands).toBeHidden();
    await expect(target).toHaveText("/Target section");
});

test("slash autocomplete filters aliases and converts only its current paragraph", async ({ page }) => {
    await openDocument(page, documentWith(paragraph("Before"), paragraph("Target section"), paragraph("After")));
    const editor = page.getByRole("textbox", { name: "Document content" });
    const target = editor.locator(":scope > p").nth(1);
    await target.click({ position: { x: 1, y: 12 } });
    await page.keyboard.press("Home");
    await page.keyboard.type("/h2");
    const commands = page.getByRole("listbox", { name: "Editor commands" });
    await expect(commands.getByRole("option", { name: /Heading 2/ })).toBeVisible();
    await expect(commands.getByRole("option")).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(editor.locator(":scope > h2")).toHaveText("Target section");
    await expect(editor.locator(":scope > p").first()).toHaveText("Before");
    await expect(editor.locator(":scope > p").last()).toHaveText("After");
});

test("slash autocomplete supports arrow selection and safely shows an empty result", async ({ page }) => {
    await openDocument(page, documentWith(paragraph("Before"), paragraph("Target section"), paragraph("After")));
    const editor = page.getByRole("textbox", { name: "Document content" });
    const target = editor.locator(":scope > p").nth(1);
    await target.click({ position: { x: 1, y: 12 } });
    await page.keyboard.press("Home");
    await page.keyboard.type("/heading");
    const commands = page.getByRole("listbox", { name: "Editor commands" });
    await expect(commands.getByRole("option")).toHaveCount(3);
    await page.keyboard.press("ArrowDown");
    await expect(commands.getByRole("option", { name: /Heading 2/ })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(editor.locator(":scope > h2")).toHaveText("Target section");

    const after = editor.locator(":scope > p").last();
    await after.click({ position: { x: 1, y: 12 } });
    await page.keyboard.press("Home");
    await page.keyboard.type("/no-such-command");
    await expect(commands).toContainText("No results");
    await page.keyboard.press("Escape");
    await expect(after).toHaveText("/no-such-commandAfter");
});

test("a successful document save preserves the live editor selection and subsequent typing", async ({ page }) => {
    await openDocument(page, documentWith(paragraph("Keep editing here")));
    const editor = page.getByRole("textbox", { name: "Document content" });
    const paragraphEditor = editor.locator(":scope > p").first();
    await paragraphEditor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" while saving");
    const saveResponse = page.waitForResponse(
        (response) => response.request().method() === "PATCH" && response.url().includes(`/projects/${projectId}/documents/${documentId}`),
    );
    await page.keyboard.press("ControlOrMeta+s");
    await saveResponse;
    await page.keyboard.type(".");
    await expect(paragraphEditor).toHaveText("Keep editing here while saving.");
});

test("slash inserts an editable table between neighboring document blocks", async ({ page }) => {
    await openDocument(page, documentWith(paragraph("Before table"), paragraph("Table block"), paragraph("After table")));
    const editor = page.getByRole("textbox", { name: "Document content" });
    const target = editor.locator(":scope > p").nth(1);
    await target.click({ position: { x: 1, y: 12 } });
    await page.keyboard.press("Home");
    await page.keyboard.type("/table");
    await expect(page.getByRole("option", { name: /Table/ })).toBeVisible();
    await page.keyboard.press("Enter");

    const blocks = editor.locator(":scope > *");
    await expect(blocks).toHaveCount(4);
    await expect(blocks.nth(0)).toHaveText("Before table");
    await expect(blocks.nth(1)).toHaveClass(/tableWrapper/);
    await expect(blocks.nth(1).locator("tr")).toHaveCount(3);
    await expect(blocks.nth(1).locator("tr").first().locator("th")).toHaveCount(3);
    await expect(blocks.nth(2)).toHaveText("Table block");
    await expect(blocks.nth(3)).toHaveText("After table");
});

test("table actions add rows and columns without losing the active cell", async ({ page }) => {
    await openDocument(page, documentWith(paragraph("Before"), paragraph("Table target"), paragraph("After")));
    const editor = page.getByRole("textbox", { name: "Document content" });
    const target = editor.locator(":scope > p").nth(1);
    await target.click({ position: { x: 1, y: 12 } });
    await page.keyboard.press("Home");
    await page.keyboard.type("/table");
    await page.keyboard.press("Enter");
    const table = editor.locator("table");
    await expect(table.locator("tr")).toHaveCount(3);
    const actions = page.getByRole("button", { name: "Table actions" });
    await expect(actions).toBeVisible();
    await actions.click();
    await page.getByRole("button", { name: "Add row below" }).click();
    await expect(table.locator("tr")).toHaveCount(4);
    await page.getByRole("button", { name: "Add column after" }).click();
    await expect(table.locator("tr").first().locator("th")).toHaveCount(4);
    await expect(editor.locator(":scope > p").first()).toHaveText("Before");
    await expect(editor.locator(":scope > p").last()).toHaveText("After");
});

test("slash autocomplete filters aliases and inserts an image at the caret without losing neighboring text", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openDocument(page, documentWith(paragraph("Before"), paragraph("Start  end"), paragraph("After")));
    const editor = page.getByRole("textbox", { name: "Document content" });
    const target = editor.locator(":scope > p").nth(1);
    await target.click({ position: { x: 1, y: 12 } });
    await page.keyboard.press("Home");
    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
    await page.keyboard.type("/image");
    await expect(page.getByRole("listbox", { name: "Editor commands" })).toBeVisible();
    await expect(page.getByRole("option", { name: /Image/ })).toBeVisible();
    await page.keyboard.press("Enter");

    const blocks = editor.locator(":scope > *");
    await expect(blocks).toHaveCount(5);
    await expect.poll(() => blocks.nth(1).evaluate((element) => element.textContent)).toBe("Start ");
    await expect(blocks.nth(2)).toHaveClass(/node-image/);
    await expect.poll(() => blocks.nth(3).evaluate((element) => element.textContent)).toBe(" end");
    await expect(blocks.nth(4)).toHaveText("After");
    await expect(page.getByRole("textbox", { name: "Image URL" })).toBeVisible();
    await editor.focus();
    await page.keyboard.press("ControlOrMeta+z");
    await expect(editor.locator(":scope > .document-image")).toHaveCount(0);
    await expect(editor.locator(":scope > p").nth(1)).toHaveText("Start  end");
    expect(pageErrors).toEqual([]);
});

test("image edit and resize controls do not dispatch stale mouse or pointer selections", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route("https://assets.test/plane-reference.png", (route) =>
        route.fulfill({
            status: 200,
            contentType: "image/png",
            body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6N8AAAAASUVORK5CYII=", "base64"),
        }),
    );
    await openDocument(
        page,
        documentWith(
            paragraph("Image above"),
            { type: "image", attrs: { src: "https://assets.test/plane-reference.png", alt: "Reference image", widthPercent: 100 } },
            paragraph("Image below"),
        ),
    );
    const edit = page.getByRole("button", { name: "Edit image" });
    await edit.click();
    const url = page.getByRole("textbox", { name: "Image URL" });
    await url.fill("not a valid URL");
    await page.getByRole("button", { name: "Apply image" }).click();
    await expect(page.getByText("Enter an HTTP or HTTPS image URL.")).toBeVisible();
    await url.fill("https://assets.test/plane-reference.png");
    await page.getByRole("button", { name: "Apply image" }).click();

    const resize = page.getByRole("slider", { name: "Image width" });
    const bounds = await resize.boundingBox();
    if (!bounds) throw new Error("Image resize control did not render.");
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x - 70, bounds.y + bounds.height / 2);
    await page.mouse.up();
    await expect.poll(() => resize.getAttribute("aria-valuenow")).not.toBe("100");

    const widthBeforeCancel = await resize.getAttribute("aria-valuenow");
    const pointerIdPromise = resize.evaluate(
        (element) => new Promise<number>((resolve) => element.addEventListener("pointerdown", (event) => resolve(event.pointerId), { once: true })),
    );
    const nextBounds = await resize.boundingBox();
    if (!nextBounds) throw new Error("Image resize control did not render after the first resize.");
    await page.mouse.move(nextBounds.x + nextBounds.width / 2, nextBounds.y + nextBounds.height / 2);
    await page.mouse.down();
    const pointerId = await pointerIdPromise;
    await page.mouse.move(nextBounds.x + nextBounds.width / 2 - 40, nextBounds.y + nextBounds.height / 2);
    await resize.evaluate((element, id) => element.dispatchEvent(new PointerEvent("pointercancel", { pointerId: id, bubbles: true })), pointerId);
    await page.mouse.up();
    await expect(resize).toHaveAttribute("aria-valuenow", widthBeforeCancel!);
    expect(pageErrors).toEqual([]);
});

test("a broken image can be repaired and rejects non-HTTP URLs without losing attributes", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route("https://images.test/**", (route) =>
        route.request().url().includes("broken.png")
            ? route.fulfill({ status: 404 })
            : route.fulfill({
                  status: 200,
                  contentType: "image/png",
                  body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6N8AAAAASUVORK5CYII=", "base64"),
              }),
    );
    await openDocument(
        page,
        documentWith(
            paragraph("Before"),
            { type: "image", attrs: { src: "https://images.test/broken.png", alt: "Architecture diagram", widthPercent: 45 } },
            paragraph("After"),
        ),
    );
    await expect(page.getByText("Image could not be loaded. Edit its URL to try again.")).toBeVisible();
    await page.getByRole("button", { name: "Edit image" }).click();
    const url = page.getByRole("textbox", { name: "Image URL" });
    const alt = page.getByRole("textbox", { name: "Alternative text" });
    await expect(url).toHaveValue("https://images.test/broken.png");
    await expect(alt).toHaveValue("Architecture diagram");
    await url.fill("ftp://images.test/replacement.png");
    await page.getByRole("button", { name: "Apply image" }).click();
    await expect(page.getByText("Enter an HTTP or HTTPS image URL.")).toBeVisible();
    await url.fill("https://images.test/repaired.png");
    await page.getByRole("button", { name: "Apply image" }).click();
    const image = page.locator(".document-image img");
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("alt", "Architecture diagram");
    await expect(page.getByRole("slider", { name: "Image width" })).toHaveAttribute("aria-valuenow", "45");
    expect(pageErrors).toEqual([]);
});
