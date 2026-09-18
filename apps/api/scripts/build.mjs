import { readFileSync } from "fs";
import { build } from "esbuild";

// Bundles first-party code (apps/api/src + packages/shared/src) into one file per entry point,
// while keeping real node_modules dependencies external. This solves two problems at once:
// (1) packages/shared does not need its own build or main/types pointing to a dist — esbuild
// resolves the workspace and inlines the TypeScript directly; (2) it avoids the classic problems
// of bundling `pg` (dynamic require of an optional native binding).
//
// IMPORTANT: esbuild's `packages: "external"` externalizes ANY import resolved through
// node_modules — including pnpm workspace packages (which are only symlinks there), which would
// break @gikan/shared at runtime (it has no own dist). Therefore, the external list is built
// manually from package.json while excluding "workspace:*" dependencies.
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));

const external = Object.entries(pkg.dependencies ?? {})
    .filter(([, version]) => !version.startsWith("workspace:"))
    .flatMap(([name]) => [name, `${name}/*`]);

const sharedOptions = {
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    external,
    sourcemap: true,
    logLevel: "info",
};

await build({ ...sharedOptions, entryPoints: ["src/server.ts"], outfile: "dist/server.js" });
await build({ ...sharedOptions, entryPoints: ["src/db/migrate.ts"], outfile: "dist/migrate.js" });
