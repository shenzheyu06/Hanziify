import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/hanziify.js",
  format: "iife",
  platform: "browser",
  target: "es2020",
});
