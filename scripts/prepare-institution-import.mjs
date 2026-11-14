// Preparation only: reads the approved workbook and writes a reviewable manifest/SQL.
// Database execution is deliberately separate.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import assert from "node:assert/strict";
import { schoolShortName, kindergartenShortName } from "./institution-short-names.mjs";
import { institutionImportSql } from "./institution-import-sql.mjs";

const [workbook, outputDir, python] = process.argv.slice(2);
if (!workbook || !outputDir || !python)
  throw new Error(
    "Usage: node scripts/prepare-institution-import.mjs workbook.xlsx output-dir python-executable",
  );
const sha256 = createHash("sha256").update(fs.readFileSync(workbook)).digest("hex");
assert.equal(
  sha256,
  "612ff3f714072358ffb8b99e810f0ffa9b1f25a2d2acab121f70be40a2c475a4",
  "Workbook differs from approved final source",
);
const sheets = JSON.parse(
  execFileSync(python, ["scripts/read-institution-workbook.py", workbook], {
    encoding: "utf8",
    maxBuffer: 2_000_000,
  }),
);
const originals = sheets.find((s) => s.name === "Баштапкы маалымат").rows.slice(1);
const bundled = await build({
  stdin: {
    contents: "export {prepareInstitutionLocation} from './src/lib/institution-import.ts'",
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { prepareInstitutionLocation } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);
const schoolTypes = {
  "Жалпы билим берүү мектеби": "general",
  "Орто мектеп": "secondary",
  "Негизги мектеп": "basic",
  "Башталгыч мектеп": "primary",
  "Жатак-мектеп": "boarding",
  Мектеп: "school",
};
const kindergartenTypes = {
  "Бала бакча": "kindergarten",
  "Мектеп алдындагы бала бакча": "school_preschool",
};
const plan = {
  source_file: path.basename(workbook),
  sha256,
  publish: true,
  schools: [],
  kindergartens: [],
};
for (const [sheetName, key, expected] of [
  ["Мектептер", "schools", 53],
  ["Бакчалар", "kindergartens", 56],
]) {
  for (const row of sheets.find((s) => s.name === sheetName).rows.slice(1)) {
    const cell = (col) => row.cells[col + row.row] ?? "";
    if (!/^\d+$/.test(cell("A"))) continue;
    const number = +cell("A");
    const sourceNumber =
      key === "schools" ? (number === 53 ? 54 : number) : number >= 54 ? number + 1 : number;
    const sourceSection = key === "schools" && number !== 53 ? "Мектеп" : "Бакча";
    const matched = originals.filter(
      (r) => r.cells["A" + r.row] === sourceSection && +r.cells["B" + r.row] === sourceNumber,
    );
    assert.equal(matched.length, 1, `Original provenance is not unique: ${key}/${number}`);
    const original = matched[0];
    const source = {
      source_file: plan.source_file,
      source_sha256: sha256,
      source_sheet: sheetName,
      source_row: row.row,
      excel_number: number,
      original_source_sheet: "Баштапкы маалымат",
      original_source_row: original.row,
      original_name: original.cells["D" + original.row],
      original_address: original.cells["E" + original.row],
      original_source_territory: original.cells["C" + original.row],
    };
    const info = {
      name_kg: cell("F"),
      name_ru: cell("H"),
      name_en: cell("J"),
      address_kg: cell("G"),
      address_ru: cell("I"),
      address_en: cell("K"),
    };
    Object.assign(
      info,
      prepareInstitutionLocation(cell("B"), cell("G").split(" айылы")[0], source),
    );
    const type = (key === "schools" ? schoolTypes : kindergartenTypes)[cell("C")];
    assert.ok(type, `Unknown source type ${key}/${number}`);
    info[key === "schools" ? "school_type" : "type"] = type;
    for (const lang of ["kg", "ru", "en"]) {
      const full = info[`name_${lang}`];
      assert.ok(
        full && info[`address_${lang}`],
        `Missing localized field ${key}/${number}/${lang}`,
      );
      const short = (key === "schools" ? schoolShortName : kindergartenShortName)(
        full,
        lang,
        number,
      );
      assert.ok(
        short && short.length <= 120 && short.length < full.length,
        `Invalid short name ${key}/${number}/${lang}`,
      );
      info[`short_name_${lang}`] = short;
    }
    const record = { number, info };
    if (key === "schools" && number === 1)
      Object.assign(record, {
        existing_id: "5f36794c-a680-4b93-9bb0-873538f54dbb",
        existing_slug: "zhiyde",
        expected_revision: 3,
      });
    if (key === "schools" && number === 12)
      Object.assign(record, {
        existing_id: "13e261af-16f4-4455-9873-fcc06e44b14d",
        existing_slug: "b-eshmanbetov-atyndagy-orto-mektebi",
        expected_revision: 8,
      });
    plan[key].push(record);
  }
  assert.equal(plan[key].length, expected);
  assert.equal(new Set(plan[key].map((r) => r.number)).size, expected);
  assert.equal(
    new Set(
      plan[key].map(
        (r) =>
          r.info.name_kg.toLowerCase() + "/" + r.info.territory_slug + "/" + r.info.village_slug,
      ),
    ).size,
    expected,
  );
}
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(plan, null, 2));
fs.writeFileSync(path.join(outputDir, "import.sql"), institutionImportSql(plan));
const rows = ["catalog,excel_number,full_kg,short_kg,short_ru,short_en,territory,village"];
for (const key of ["schools", "kindergartens"])
  for (const { number, info } of plan[key])
    rows.push(
      [
        key,
        number,
        info.name_kg,
        info.short_name_kg,
        info.short_name_ru,
        info.short_name_en,
        info.territory_slug,
        info.village_slug,
      ]
        .map((v) => '"' + String(v).replaceAll('"', '""') + '"')
        .join(","),
    );
fs.writeFileSync(path.join(outputDir, "catalog-names.csv"), "\ufeff" + rows.join("\n"));
console.log(
  JSON.stringify({
    outputDir,
    sha256,
    schools: plan.schools.length,
    kindergartens: plan.kindergartens.length,
    existingUpdates: plan.schools.filter((r) => r.existing_id).length,
    publish: plan.publish,
  }),
);
