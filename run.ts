import { argsParse, xmlParse as parse } from "./deps.ts";
import { parseStringArrays, parseStrings } from "./maps.ts";
import { convert } from "./converter.ts";

const args = argsParse(Deno.args);
if (args._.length === 0) {
  throw new Error("Input folder argument missing");
}
if (!args["o"] && !args["output"]) {
  throw new Error("Putput file (-o or --output) argument missing");
}

const target = args["o"] || args["output"];
const folder = args._[0] as string;
const format = args["format"] ?? "json";

// Read strings.xml and build map
let strings: Record<string, string> = {};
try {
  strings = await parseStrings(folder);
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.warn(`Failed to open ${error.message}`);
  } else {
    throw error;
  }
}

// Read string-arrays from arrays.xml and build map. Replace values from strings maps
let arrays: Record<string, string[]> = {};
try {
  arrays = await parseStringArrays(folder, strings);
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.warn(`Failed to open ${error.message}`);
  } else {
    throw error;
  }
}

const filename = args["f"] || args["file"] || "app_restrictions.xml";
let restrictions: Array<any> = [];
const restrictionsPath = `${folder}/xml/${filename}`;
try {
  const restrictionsXml = await Deno.readTextFile(restrictionsPath);
  restrictions = convert(
    (parse(restrictionsXml).restrictions as any).restriction,
    strings,
    arrays,
  );
  const encoder = new TextEncoder();
  let data;
  if (format === "json") {
    data = encoder.encode(JSON.stringify(restrictions));
  } else if (format === "html") {
    const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css">
      </head>
      <body>
        <main class="container">
          <h1>Restrictions</h1>
          ${renderHtml(restrictions)}
        </main>
      </body>
    </html>
    `;
    data = encoder.encode(html);
  } else {
    throw new Error("Unsupported output format " + format);
  }
  await Deno.writeFile(target, data);
  console.log(`Output saved to ${target}!`);
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.warn(`Failed to open ${restrictionsPath}`);
  } else {
    throw error;
  }
}

function renderHtml(data: any[]) {
  let html = "<ul>";
  for (const e of data) {
    if (e.type === "HIDDEN") {
      continue;
    }

    html += "<li>" + e.title;
    if (e.description) {
      html += "<br><small><i>" + e.description + "</i></small>";
    }
    if (e.entries) {
      for (const i of e.entries) {
        html += "<br>&nbsp;&nbsp;&nbsp;&nbsp;- " + i.name;
      }
    }
    if (e.nestedProperties) {
      html += renderHtml(e.nestedProperties);
    }
    html += "</li>";
  }
  html += "</ul>";
  return html;
}
