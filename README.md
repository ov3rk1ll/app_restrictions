# App restrictions to JSON converter

Convert a android.content.APP_RESTRICTIONS xml file to json as returned by https://developers.google.com/android/management/reference/rest/v1/enterprises.applications#managedproperty

## Run

deno run --allow-read --allow-write https://raw.githubusercontent.com/ov3rk1ll/app_restrictions/main/run.ts [input res folder] --output [output file]

The _input res folder_ must point to the res folder containing xml/app_restrictions.xml, values/strings.xml, etc  
If you only have the APP_RESTRICTIONS xml file, you can directly point to it via -f|--input instead.

You can pass a -f|--file argument if the "APP_RESTRICTIONS" file is not called "app_restrictions.xml"
