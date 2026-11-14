# Final institution import, 2026-11-14

The user approved importing and immediately publishing all institutions. Import completed:

| Catalog | Updated existing | Created | Total | Published |
| --- | ---: | ---: | ---: | ---: |
| Schools | 2 | 51 | 53 | 53 |
| Kindergartens | 0 | 56 | 56 | 56 |

The workbook is `Kara-Kulja_mektep_bakcha_FINAL_KG_RU_EN_v3 (1).xlsx`, SHA-256
`612ff3f714072358ffb8b99e810f0ffa9b1f25a2d2acab121f70be40a2c475a4`.
Only final sheets `Мектептер` / `Бакчалар` supply public names, addresses and explicit types.
`Баштапкы маалымат` supplies internal original text/provenance, not display values.
All 109 records and publication snapshots were compared field-by-field with the manifest.

## Minimal short-name extension

Migration `20261114210052_institution_short_names.sql` adds only `short_name_kg`,
`short_name_ru`, `short_name_en` to each existing institution table, and extends the
existing save/publication whitelists. No RLS, routes, yearly architecture or new catalog
tables were changed. The original CLI filename was aligned byte-for-byte with Supabase history.

Catalog cards use stored short names through `catalogInstitutionName`. Detail pages use
the full official `name_*` fields. Admin forms expose the full and short names separately.
Catalog search matches both. Missing legacy short values fall back to full names; no
names are dynamically abbreviated while rendering. School editors cannot change short names.

Short names were prepared once from the already localized Excel values and stored:

- Баки Эшмамбетов атындагы жалпы билим берүү мектеби -> Б. Эшмамбетов.
- Токторбай Кулмаматов атындагы Жаңы-Талап жалпы билим берүү мектеби -> Т. Кулмаматов.
- Ибраимов Жаркынбай -> Ж. Ибраимов; Чаргынов Каримжан -> К. Чаргынов.
- Mononyms and Kyrgyz `уулу` names retain a meaningful proper name.
- Жийде / Ынтымак / Айдын-Көл retain the institution's own name.
- Kindergarten own names retain their identity and existing quotes where applicable.
- No prepared full name, address or translation was replaced by a newly translated value.

## Transaction and preservation

`prepare-institution-import.mjs` checks the approved workbook hash, extracts XLSX read-only
with Python's standard library, validates 53/56 rows, resolves approved existing locations,
and writes a manifest, catalog-name review CSV and SQL outside the repository. It never
connects to a database. `institution-import-sql.mjs` generates the separately executed DML.

The import takes a transaction/advisory lock, checks the exact two existing IDs/slugs and
expected revisions, inserts only 51/56 new records and publishes safe explicit snapshots.
Existing publication timestamps, contacts, academic-year labels and all other publication
sections remain unchanged. No save RPC that replaces ORT collections is used for the import.

The two preserved school identities are:

- `5f36794c-a680-4b93-9bb0-873538f54dbb`, slug `zhiyde`.
- `13e261af-16f4-4455-9873-fcc06e44b14d`, slug `b-eshmanbetov-atyndagy-orto-mektebi`.

All 51 new schools have NULL `current_academic_year`. No annual, ORT, achievement,
resource, media, editor-assignment, profile or Auth account records were created/changed.
Protected collection hashes are checked within the transaction, with additional remote
before/after verification for annual/ORT/media/editor/profile/account identities.

Exact normalized name/location, slug and source-file/sheet/number duplicate checks all
returned zero for each catalog. A complete identical rerun is a no-op. Partial state,
changed reviewed records or missing publications fail closed instead of overwriting data.
The exact SQL was tested twice locally with seeded annual, ORT, media and editor data.

Kindergarten source rows 41-44 use `ryspai-abdykadyrov`; source metadata retains
`Сары-Булак`. The moved Kaiyn-Talaa school links to its actual original source row 55.

## Verification and deployment

- Full migration replay (10 migrations), existing Schools security tests, exact import
  replay, short-name publication validation and KG/RU/EN public catalog/detail tests pass.
- `tsc --noEmit` retains the three previously documented errors in unchanged map/village
  files. No new type errors were introduced.
- Public data is already published in Supabase. The new catalog short-name rendering
  requires deploying the newly built static `dist` to Fornex. No frontend deployment,
  Git commit or push is performed by this task.
