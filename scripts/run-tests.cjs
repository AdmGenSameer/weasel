const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const build = spawnSync(
  process.execPath,
  [path.join(root, "node_modules/typescript/bin/tsc"), "-p", "apps/api/tsconfig.build.json"],
  { stdio: "inherit", cwd: root },
);
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const validationSource = fs.readFileSync(path.join(root, "apps/web/lib/validation.ts"), "utf8");
const validationJs = ts.transpileModule(validationSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const testBuild = path.join(root, "work/test-dist");
fs.mkdirSync(testBuild, { recursive: true });
fs.writeFileSync(path.join(testBuild, "validation.cjs"), validationJs);

const testFiles = fs
  .readdirSync(path.join(root, "tests/unit"))
  .filter((file) => file.endsWith(".test.cjs"))
  .map((file) => path.join("tests/unit", file));
const tests = spawnSync(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
  cwd: root,
});
if (tests.error) throw tests.error;
process.exit(tests.status ?? 1);
