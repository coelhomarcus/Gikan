import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../src/", import.meta.url).pathname;
const checks = [
    {
        file: "features/issues/components/rich-text-editor.tsx",
        required: ["@tiptap/react/menus", "@tiptap/suggestion", "ToggleGroupRoot", "BasePopover"],
        forbidden: ["window.prompt", "document.execCommand"],
    },
    {
        file: "components/base/sheet/sheet.tsx",
        required: ["@base-ui/react/dialog", "BaseDialog.Backdrop", "BaseDialog.Popup"],
        forbidden: [],
    },
    {
        file: "components/base/buttons/button.tsx",
        required: ['data-icon="inline-start"', 'data-icon="inline-end"'],
        forbidden: [],
    },
];

const failures = [];
for (const check of checks) {
    const source = await readFile(join(root, check.file), "utf8");
    for (const pattern of check.required) {
        if (!source.includes(pattern)) failures.push(`${check.file}: missing ${pattern}`);
    }
    for (const pattern of check.forbidden) {
        if (source.includes(pattern)) failures.push(`${check.file}: forbidden ${pattern}`);
    }
}

const activeRoots = ["pages", "features", "components/base", "components/layout", "components/overlay"];
async function collect(directory) {
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(join(root, directory), { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const relative = join(directory, entry.name);
        if (entry.isDirectory()) files.push(...(await collect(relative)));
        else if (/\.tsx?$/.test(entry.name)) files.push(relative);
    }
    return files;
}

for (const directory of activeRoots) {
    for (const file of await collect(directory)) {
        const source = await readFile(join(root, file), "utf8");
        if (/from ["'](?:react-aria|react-aria-components|react-stately|@react-aria|@react-stately)/.test(source)) failures.push(`${file}: legacy React Aria import`);
        if (/<(?:select|datalist)(?:\s|>)/.test(source)) failures.push(`${file}: native select/datalist`);
    }
}

if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
}

console.log("Design system checks passed.");
