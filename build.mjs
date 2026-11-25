import { build } from "esbuild";
import { readFile } from "node:fs/promises";

// Keep the license notices with the standalone extension and installer.
const notices = await Promise.all([
  ["Hanziify", "./LICENSE"],
  ["OpenCC.js", "./node_modules/opencc-js/LICENSE"],
  ["OpenCC.js third-party notices", "./node_modules/opencc-js/THIRD_PARTY_LICENSES.md"],
].map(async ([name, path]) => `${name}\n${await readFile(new URL(path, import.meta.url), "utf8")}`));

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/hanziify.js",
  format: "iife",
  platform: "browser",
  target: "es2020",
  banner: { js: `/*\n${notices.join("\n\n").replaceAll("*/", "* /")}\n*/` },
});
