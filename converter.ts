export function convert(
    restrictions: any[],
    strings: Record<string, string>,
    arrays: Record<string, string[]>,
): any[] {
    const result: any[] = [];
    if (!Array.isArray(restrictions)) {
        restrictions = [restrictions];
    }
    for (const restriction of restrictions) {
        // New object with key
        const o: any = { key: restriction["@android:key"] };

        // Map types used in xml to types returned by managment API
        switch (restriction["@android:restrictionType"]) {
            case "string":
                o.type = "STRING";
                break;
            case "integer":
                o.type = "INTEGER";
                break;
            case "bool":
                o.type = "BOOL";
                break;
            case "choice":
                o.type = "CHOICE";
                break;
            case "multi-select":
                o.type = "MULTISELECT";
                break;
            case "bundle_array":
                o.type = "BUNDLE_ARRAY";
                break;
            case "bundle":
                o.type = "BUNDLE";
                break;
            case "hidden":
                o.type = "HIDDEN";
                break;
            default:
                throw new Error(
                    `Unsupported restrictionType "${restriction["@android:restrictionType"]
                    }"`,
                );
        }

        // Set default value if defined
        if (restriction.hasOwnProperty("@android:defaultValue")) {
            if (
                o.type === "STRING" && restriction["@android:defaultValue"] === null
            ) {
                // Replace null with empty string
                o.defaultValue = "";
            } else if (
                typeof restriction["@android:defaultValue"] === "string" &&
                restriction["@android:defaultValue"].startsWith("@string/")
            ) {
                // Replace from string map
                o.defaultValue = strings[restriction["@android:defaultValue"]];
            } else {
                // Use value from XML
                o.defaultValue = restriction["@android:defaultValue"];
            }
        }

        // Set title from string map or XML
        if (restriction["@android:title"].startsWith("@string/")) {
            o.title = strings[restriction["@android:title"]];
        } else {
            o.title = restriction["@android:title"];
        }

        // Set description from string map or XML if defined
        if (restriction["@android:description"]) {
            if (restriction["@android:description"].startsWith("@string/")) {
                o.description = strings[restriction["@android:description"]];
            } else {
                o.description = restriction["@android:description"];
            }
        }

        // Set entries for CHOICE and MULTISELECT type
        if (o.type == "CHOICE" || o.type === "MULTISELECT") {
            if (
                !restriction["@android:entries"] || !restriction["@android:entryValues"]
            ) {
                throw new Error(
                    "Type set to CHOICE or MULTISELECT but entries or entryValues is missing",
                );
            }

            o.entries = [];
            const entries = arrays[restriction["@android:entries"]];
            const entryValues = arrays[restriction["@android:entryValues"]];

            if (entries.length !== entryValues.length) {
                throw new Error("Length of entries and entryValues is not the same");
            }

            for (let i = 0; i < entries.length; i++) {
                o.entries.push({ value: entryValues[i], name: entries[i] });
            }
        }

        // Check if there are sub restriction
        if (restriction["restriction"]) {
            o.nestedProperties = convert(restriction["restriction"], strings, arrays);
        }

        result.push(o);
    }

    return result;
}
