import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = process.argv[2];
const repository = "https://github.com/jsaveker/Mathcraft";
if (!destination || path.basename(path.resolve(destination)) !== "mathcraft") {
  throw new Error(
    "Usage: npm run export:website -- /path/to/saveker-website/public/mathcraft",
  );
}
if (
  execFileSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
) {
  throw new Error(
    "Commit source changes before exporting so the release records an exact source revision.",
  );
}
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const output = path.resolve(destination);
if (existsSync(output)) {
  const prior = path.join(output, "release.json");
  if (
    !existsSync(prior) ||
    JSON.parse(readFileSync(prior, "utf8")).sourceRepository !== repository
  ) {
    throw new Error(
      "Refusing to replace a directory that is not an existing Mathcraft release.",
    );
  }
}
execFileSync("npm", ["run", "build:website"], { cwd: root, stdio: "inherit" });
if (existsSync(output)) rmSync(output, { recursive: true });
mkdirSync(output, { recursive: true });
cpSync(path.join(root, "dist"), output, { recursive: true });
const notices = [
  ["Three.js", "node_modules/three/LICENSE"],
  ["Outfit font", "node_modules/@fontsource-variable/outfit/LICENSE"],
  ["DM Sans font", "node_modules/@fontsource-variable/dm-sans/LICENSE"],
]
  .map(
    ([name, file]) =>
      `${name}\n${"=".repeat(name.length)}\n${readFileSync(path.join(root, file), "utf8")}`,
  )
  .join("\n\n");
writeFileSync(path.join(output, "THIRD_PARTY_NOTICES.txt"), notices);
function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(full) : [full];
  });
}
const files = Object.fromEntries(
  filesIn(output)
    .sort()
    .map((file) => [
      path.relative(output, file).split(path.sep).join("/"),
      createHash("sha256").update(readFileSync(file)).digest("hex"),
    ]),
);
writeFileSync(
  path.join(output, "release.json"),
  JSON.stringify(
    {
      app: "mathcraft",
      sourceRepository: repository,
      sourceCommit,
      basePath: "/mathcraft/",
      buildCommand: "npm run build:website",
      files,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Exported ${sourceCommit} to ${output}`);
