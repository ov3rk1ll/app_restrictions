import { xmlParse as parse } from "./deps.ts";

export async function parseStrings(
    path: string,
): Promise<Record<string, string>> {
    const strings: Record<string, string> = {};
    const stringsXml = await Deno.readTextFile(path);
    for (const n of (parse(stringsXml).resources as any).string) {
        strings[`@string/${n["@name"]}`] = n["#text"];
    }
    return strings;
}

export async function parseStringArrays(
    path: string,
    strings: Record<string, string>,
): Promise<Record<string, string[]>> {
    const arrays: Record<string, string[]> = {};
    const arraysXml = await Deno.readTextFile(path);
    for (const n of (parse(arraysXml).resources as any)['string-array']) {
        const key = `@array/${n['@name']}`;
        arrays[key] = [];
        for (const i of (n['item'] as string[])) {
            if (i.startsWith('@string/')) {
                arrays[key].push(strings[i]);
            } else {
                arrays[key].push(i);
            }
        }
    }
    return arrays;
}
