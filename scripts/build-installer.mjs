import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

if (process.platform !== "win32") {
  throw new Error("Build the Hanziify Windows installer on Windows.");
}

const framework = join(process.env.SystemRoot || "C:\\Windows", "Microsoft.NET");
const compiler = ["Framework64", "Framework"]
  .map(folder => join(framework, folder, "v4.0.30319", "csc.exe"))
  .find(existsSync);
if (!compiler) throw new Error("The .NET Framework 4 compiler was not found.");

const root = fileURLToPath(new URL("..", import.meta.url));
const installer = join(root, "dist", "HanziifySetup.exe");
execFileSync(compiler, [
  "/nologo",
  "/target:exe",
  "/optimize+",
  `/out:${installer}`,
  `/resource:${join(root, "dist", "hanziify.js")},hanziify.js`,
  join(root, "scripts", "HanziifySetup.cs"),
], { stdio: "inherit" });
console.log(`Built ${installer}`);
