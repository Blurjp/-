import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { buildStyleProfile, parseChatExport, senders } from "../src";

it("the bundled TestFlight sample chat parses and yields a style", () => {
  const m = parseChatExport(readFileSync(new URL("../../app/sample-data/sample-chat.csv", import.meta.url), "utf8"));
  expect(m).toHaveLength(12);
  expect(senders(m)).toEqual(["Grandma Rose", "Me"]);
  expect(buildStyleProfile(m, "Grandma Rose").catchphrases.join("|")).toContain("sweet pea");
});
