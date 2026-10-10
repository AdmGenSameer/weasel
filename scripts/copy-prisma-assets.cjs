const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "apps/api/src/generated/prisma");
const target = path.join(root, "apps/api/dist/generated/prisma");
if (!fs.existsSync(source))
  throw new Error("Prisma client is missing. Run npm run db:generate before building the API.");
fs.cpSync(source, target, { recursive: true, force: true });
