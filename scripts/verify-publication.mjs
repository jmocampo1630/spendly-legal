import { readFile } from "node:fs/promises";

const deletionPage = await readFile(new URL("../delete-account/index.html", import.meta.url), "utf8");
const privacyPolicy = await readFile(new URL("../privacy.md", import.meta.url), "utf8");
const failures = [];

if (!/mailto:[^\s\"')>]+@[^\s\"')>]+/i.test(deletionPage)) {
  failures.push("delete-account/index.html needs the monitored public support mailto link");
}

if (!/mailto:[^\s\"')>]+@[^\s\"')>]+/i.test(privacyPolicy)) {
  failures.push("privacy.md needs the same monitored public support mailto link");
}

if (failures.length > 0) {
  console.error("Publication blocked:\n- " + failures.join("\n- "));
  process.exitCode = 1;
} else {
  console.log("Publication prerequisites passed.");
}

