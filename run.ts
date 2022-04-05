import { argsParse, xmlParse as parse } from "./deps.ts";
import { parseStrings, parseStringArrays } from "./maps.ts";
import { convert } from "./converter.ts";

const args = argsParse(Deno.args);
if (args._.length === 0) {
    throw new Error("Input folder argument missing");
}
if (!args['o'] && !args['output']) {
    throw new Error("Putput file (-o or --output) argument missing");
}

const target = args['o'] || args['output'];
const folder = args._[0];

// Read strings.xml and build map
let strings: Record<string, string> = {};
const stringsPath = `${folder}/values/strings.xml`;
try {
    strings = await parseStrings(stringsPath);
} catch (error) {
    if (error instanceof Deno.errors.NotFound) {
        console.warn(`Failed to open ${stringsPath}`)
    } else {
        throw error;
    }
}

// Read string-arrays from arrays.xml and build map. Replace values from strings maps
let arrays: Record<string, string[]> = {};
const arraysPath = `${folder}/values/arrays.xml`;
try {
    arrays = await parseStringArrays(arraysPath, strings);
} catch (error) {
    if (error instanceof Deno.errors.NotFound) {
        console.warn(`Failed to open ${arraysPath}`)
    } else {
        throw error;
    }
}

const filename = args['f'] || args['file'] || 'app_restrictions.xml';
let restrictions: Array<any> = [];
const restrictionsPath = `${folder}/xml/${filename}`;
try {
    const restrictionsXml = await Deno.readTextFile(restrictionsPath);
    restrictions = convert((parse(restrictionsXml).restrictions as any).restriction, strings, arrays);
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(restrictions));
    await Deno.writeFile(target, data);
    console.log(`Output saved to ${target}!`);
} catch (error) {
    if (error instanceof Deno.errors.NotFound) {
        console.warn(`Failed to open ${restrictionsPath}`)
    } else {
        throw error;
    }
}

