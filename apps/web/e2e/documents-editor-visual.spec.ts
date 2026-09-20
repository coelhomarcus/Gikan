import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { documentId, mockApi, projectId } from "./fixtures";

const outputDirectory = path.resolve(process.cwd(), "../../docs/visual/documents-editor");
const paragraph = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
const content = (...blocks: Record<string, unknown>[]) => ({ type: "doc" as const, content: blocks });

async function openDocument(page: Page, blocks: Record<string, unknown>[]) {
    await mockApi(page, { documentContent: content(...blocks) });
    await page.goto(`/projects/${projectId}/documents/${documentId}`);
    await expect(page.getByRole("textbox", { name: "Document content" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
}

async function capture(
    browser: Browser,
    screenshotName: string,
    viewport: { width: number; height: number },
    blocks: Record<string, unknown>[],
    action?: (page: Page) => Promise<void>,
) {
    const context = await browser.newContext({
        baseURL: "http://127.0.0.1:5173",
        viewport,
        locale: "en-US",
        timezoneId: "UTC",
        colorScheme: "light",
        deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await openDocument(page, blocks);
    await action?.(page);
    await page.screenshot({ path: path.join(outputDirectory, screenshotName), animations: "disabled" });
    await context.close();
}

test("capture document editing, slash, image, table, and mobile states for visual review", async ({ browser }) => {
    await mkdir(outputDirectory, { recursive: true });
    const desktop = { width: 1440, height: 900 };
    await capture(browser, "editor-desktop.png", desktop, [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Project notes" }] },
        paragraph("Keep the whole page available for writing."),
        paragraph("Use slash commands to add a block."),
    ]);
    await capture(browser, "slash-menu-desktop.png", desktop, [paragraph("Text above"), paragraph("Use slash commands to add a block.")], async (page) => {
        const editor = page.getByRole("textbox", { name: "Document content" });
        const target = editor.locator(":scope > p").last();
        await target.click({ position: { x: 2, y: 12 } });
        await page.keyboard.press("Home");
        await page.keyboard.type("/");
        await expect(page.getByRole("listbox", { name: "Editor commands" })).toBeVisible();
    });
    await capture(browser, "image-block-desktop.png", desktop, [paragraph("Text before"), paragraph("Image target"), paragraph("Text after")], async (page) => {
        const editor = page.getByRole("textbox", { name: "Document content" });
        const target = editor.locator(":scope > p").nth(1);
        await target.click({ position: { x: 2, y: 12 } });
        await page.keyboard.press("Home");
        await page.keyboard.type("/image");
        await expect(page.getByRole("option", { name: /Image/ })).toBeVisible();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("textbox", { name: "Image URL" })).toBeVisible();
    });
    await capture(browser, "table-block-desktop.png", desktop, [paragraph("Text before"), paragraph("Table target"), paragraph("Text after")], async (page) => {
        const editor = page.getByRole("textbox", { name: "Document content" });
        const target = editor.locator(":scope > p").nth(1);
        await target.click({ position: { x: 2, y: 12 } });
        await page.keyboard.press("Home");
        await page.keyboard.type("/table");
        await expect(page.getByRole("option", { name: /Table/ })).toBeVisible();
        await page.keyboard.press("Enter");
        await expect(editor.locator("table")).toBeVisible();
    });
    await capture(
        browser,
        "slash-menu-near-viewport-edge.png",
        desktop,
        Array.from({ length: 40 }, (_, index) => paragraph(`Long page paragraph ${index + 1}`)),
        async (page) => {
            const scroller = page.locator("[data-document-scroll]");
            await scroller.evaluate((element) => (element.scrollTop = element.scrollHeight));
            const editor = page.getByRole("textbox", { name: "Document content" });
            const target = editor.locator(":scope > p").last();
            await target.click({ position: { x: 2, y: 12 } });
            await page.keyboard.press("End");
            await page.keyboard.type("/");
            const menu = page.getByRole("listbox", { name: "Editor commands" });
            await expect(menu).toBeVisible();
            const bounds = await page.locator(".document-suggestions").boundingBox();
            if (!bounds) throw new Error("The slash menu has no visible geometry.");
            expect(bounds.y).toBeGreaterThanOrEqual(0);
            expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
        },
    );
    await capture(browser, "editor-mobile.png", { width: 390, height: 844 }, [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Project notes" }] },
        paragraph("The document editor adapts to the available width."),
    ]);
});
