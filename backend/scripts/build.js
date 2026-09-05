import { cpSync, rmSync, existsSync } from "fs";

if (existsSync("dist")) {
  rmSync("dist", { recursive: true, force: true });
}
cpSync("src", "dist", { recursive: true });

console.log("Build complete: src -> dist");