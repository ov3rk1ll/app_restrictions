import { expandGlob, xmlParse as parse } from "./deps.ts";

export async function parseStrings(
  path: string,
): Promise<Record<string, string>> {
  const strings: Record<string, string> = {};
  for await (const file of expandGlob(`${path}/**/*.xml`)) {
    const content = await Deno.readTextFile(file.path);
    const xml = parse(content).resources as any;
    if (!xml || !xml.hasOwnProperty("string")) {
      continue;
    }
    for (const n of xml.string) {
      strings[`@string/${n["@name"]}`] = n["#text"];
    }
  }
  return strings;
}

export async function parseStringArrays(
  path: string,
  strings: Record<string, string>,
): Promise<Record<string, string[]>> {
  const arrays: Record<string, string[]> = {};
  for await (const file of expandGlob(`${path}/**/*.xml`)) {
    const content = await Deno.readTextFile(file.path);
    const xml = parse(content).resources as any;
    if (!xml || !xml.hasOwnProperty("string-array")) {
      continue;
    }
    for (const n of xml["string-array"]) {
      const key = `@array/${n["@name"]}`;
      arrays[key] = [];
      for (const i of (n["item"] as string[])) {
        try {
          if ((i + "").startsWith("@string/")) {
            arrays[key].push(strings[i]);
          } else {
            arrays[key].push(i);
          }
        } catch (err) {
          throw new Error("Failed to parse " + i + " - " + err.message);
        }
      }
    }
  }
  return arrays;
}
