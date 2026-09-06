import { readFileSync } from "fs";
import { build } from "esbuild";

// Bundla o código de primeira parte (apps/api/src + packages/shared/src) num único arquivo
// por entry point, mas mantém as dependências reais de node_modules externas. Isso resolve
// dois problemas ao mesmo tempo: (1) packages/shared não precisa de build próprio nem de
// main/types apontando pra um dist -- o esbuild resolve o workspace e inlina o TS direto;
// (2) evita os problemas clássicos de empacotar `pg` (require dinâmico de binding nativo opcional).
//
// IMPORTANTE: `packages: "external"` do esbuild externaliza QUALQUER import resolvido via
// node_modules -- incluindo pacotes workspace do pnpm (que são só symlinks lá dentro), o que
// quebraria @gikan/shared em runtime (ele não tem dist próprio). Por isso construímos a
// lista de externals manualmente a partir de package.json, excluindo dependências "workspace:*".
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
