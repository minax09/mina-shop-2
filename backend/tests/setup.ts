import { config } from "dotenv";
import { fileURLToPath } from "node:url";

config({
  path: fileURLToPath(new URL("../.env.test", import.meta.url)),
  override: true,
});

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set. Check backend/.env.test");
}

const databaseName = new URL(url).pathname.replace("/", "");

if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Refusing to run tests against "${databaseName}". The database name must end with "_test".`,
  );
}