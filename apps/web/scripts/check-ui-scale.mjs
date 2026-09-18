import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("../src/", import.meta.url).pathname;
const roots = ["pages", "features", "components/base", "components/layout", "components/overlay"];
const allowedSpacing = new Set(["components/base/input/pin-input.tsx", "components/base/textarea/textarea.tsx"]);
const files = [];

async function collect(directory) {
    for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await collect(path);
        else if (/\.(tsx?|css)$/.test(entry.name)) files.push(path);
    }
}

for (const directory of roots) await collect(directory);

const violations = [];
for (const path of files) {
    const source = await readFile(join(root, path), "utf8");
    const displayPath = relative(new URL("../", import.meta.url).pathname, join(root, path));

    if (/from ["'](?:react-aria|react-aria-components|react-stately|@react-aria|@react-stately)/.test(source)) {
        violations.push(`${displayPath}: legacy React Aria import`);
    }
    if (/<(?:select|datalist)(?:\s|>)/.test(source)) violations.push(`${displayPath}: native select/datalist`);
    if (!allowedSpacing.has(path) && /(?:gap-1\.5|px-3\.5|py-2\.5|rounded-\[10px\])/.test(source)) {
        violations.push(`${displayPath}: non-standard spacing/radius; use control-scale or 4px spacing`);
    }
}

if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exit(1);
}

console.log(`UI scale check passed (${files.length} active source files).`);
