# Schools and kindergarten catalog architecture

Migration: `20261114201024_institution_catalog_architecture.sql`. Applied to the existing
Kara-Kulja Supabase project on 2026-11-14. The CLI-created local filename was aligned
byte-for-byte with the version assigned by Supabase. There is one new migration.

## Scope and import boundary

This stage creates the architecture, not the Excel institution import. Production still
contains two schools and zero kindergartens. No 51-school or 56-kindergarten insertion
was performed. The approved final workbook has 53 schools and 56 kindergartens.
Its original sheet has 52 school / 57 kindergarten entries: the agreed Kaiyn-Talaa
reclassification must not be undone by importing that source sheet.

The only targeted data alignment in this migration is `general` for the two explicitly
approved existing schools, plus the approved KG display name for Baki Eshmambetov.
Existing IDs and slugs remain:

- Zhiyde: `5f36794c-a680-4b93-9bb0-873538f54dbb`, `zhiyde`.
- Baki Eshmambetov: `13e261af-16f4-4455-9873-fcc06e44b14d`,
  `b-eshmanbetov-atyndagy-orto-mektebi`.

The two publication rows remain published, with unchanged relationships and timestamps.
Only the whitelisted `info.school_type` / approved `info.name_kg` snapshot fields change.
No academic-year, ORT, achievement, resource, media, editor-assignment or Auth records
are inserted, deleted or rewritten by the migration. Before/after checksums of the
six associated collections, and existing IDs/slugs, were verified identical remotely.

## Schema and contracts

- `schools.school_type`: nullable while a draft is being prepared, constrained to
  `general`, `secondary`, `basic`, `primary`, `boarding`, `school`. Publication requires
  an explicit type. The type is not inferred from a name. Existing clients omitting
  the field preserve its current value; editors cannot change it.
- `schools.source_metadata`: validated JSON object, default `{}`.
- `kindergartens`: UUID, unique immutable slug, `type` (`kindergarten` or
  `school_preschool`), KG/RU/EN names and addresses, territory/village slugs, draft or
  published status, revision, timestamps, validated source metadata.
- `kindergarten_publications`: one snapshot per kindergarten UUID, unique slug,
  explicit public document, publication flag and timestamp. Source metadata is excluded.
- `valid_institution_location`: validates the 55 canonical village/territory pairs from
  the existing static territory directory. There is no extra Sary-Bulak territory.
- `valid_institution_source`: bounds JSON size and requires provenance keys for a
  non-empty source object. A new manually created draft may have `{}`.

Non-empty source metadata includes `source_file`, `source_sheet`, `source_row`,
`excel_number`, `original_name`, `original_address`. Optional fields include
`original_territory`, `source_sha256`, `original_source_sheet`, `original_source_row`.
Use the normalized final columns as public data. Original official names such as
MCHBBU belong only in this internal provenance, never as the main public display name.

`save_school_draft` wraps the existing protected save stack; it does not replace the
frozen collections or media/ORT contracts. The shared internal media publication
entry adds the explicit type after the existing authorization/revision/media checks.
Public type propagation therefore works for both media-free and R2 publication.
Private previous implementations have no client EXECUTE grant.

Kindergarten RPCs:

- `create_kindergarten(p_payload, p_publish=false)` generates a unique slug and saves
  the whitelisted permanent fields atomically. No academic-year/teacher data is created.
- `save_kindergarten(p_id, p_revision, p_payload, p_publish=false)` locks the row,
  validates data and optimistic revision, and preserves the existing slug/provenance
  when not explicitly supplied. Saving a draft leaves the previous public snapshot intact.
- `unpublish_kindergarten(p_id, p_revision)` hides the public snapshot and advances
  the draft revision. No hard-delete workflow or new kindergarten editor accounts
  are introduced in this stage.

## RLS and publishing

Both kindergarten tables have RLS. Anonymous users cannot read working records.
Authenticated users can read working records only when existing `is_admin()` allows it.
Neither anon nor authenticated clients have direct write grants on either table.
Only published snapshots are publicly readable; all mutation RPCs explicitly require
the existing Admin role and use a pinned search path. School and News editors gain
no kindergarten management rights. Existing profile and News policies are unchanged.

Security Advisor has the pre-existing notices plus generic authenticated
SECURITY DEFINER notices for the three deliberately exposed, Admin-checked RPCs.
Those RPCs were tested with anon and school-editor identities and deny mutation.
No new anon-executable SECURITY DEFINER function was introduced. The pre-existing
`handle_new_user` advisory and leaked-password-protection setting were not changed.

Advisor references: [authenticated SECURITY DEFINER RPC review](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[pre-existing anonymous trigger-function notice](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[pre-existing password-protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Approved source mappings

`institution-import.ts` prepares relationships without writing to a database. All four
approved kindergarten rows map source territory `Сары-Булак` to `ryspai-abdykadyrov`:
41 -> `kyzyl-bulak`, 42 -> `kara-bulak`, 43 -> `tegerek-saz`, 44 -> `sary-kungoy`.
`prepareInstitutionLocation` preserves the exact original territory in source metadata.
The kindergarten dry-run is now 56 NEW / 0 CONFLICT, pending a separately approved import.

Village aliases reuse existing slugs; they never rewrite the prepared KG/RU/EN address.
For example `Күйөө-Таш` maps to `kuyotash`, and `1-Май` to `birinchi-may`.
Choose a village from the prepared address, not the institution name. Do not merge
co-located schools and preschool units or the two agreed Biymyrza kindergartens.

## UI

- `/schools`: Мектептер / Школы / Schools, compact search/territory/village/type filters.
- `/schools/:slug`: unchanged route and annual/ORT/media structure, explicit school type.
- Existing Main Admin school identity and creation form: school-type selector. All
  existing review/archive/restore/deletion and managed-editor mechanisms remain.
- `/kindergartens` and `/kindergartens/:slug`: localized public catalog/details, matching
  compact school styling, separate data, four filters, no invented photos or annual data.
- `/admin/kindergartens`: AdminGuard, list/create/edit, all three names and addresses,
  type/location, draft/publish/unpublish, source inspection. Existing Admin language
  preference is used. Public infrastructure and Main Admin link to the new catalog.
- Static export and sitemap enumerate published kindergarten slugs using only the
  public API, in addition to the existing school enumeration.

## Validation

- `scripts/test-migration-replay.mjs`: all nine migrations against a disposable PGlite
  database; includes `test-institution-catalog.mjs` for RLS, provenance isolation,
  optimistic revisions, draft snapshots, type/location validation and school compatibility.
- `scripts/test-institution-public.mjs`: KG/RU/EN public catalog/details, filtering,
  snapshot-only reads, private/draft exclusion and the four approved source aliases.
- Existing Schools security, public UI/navigation, media and editor suites remain relevant.
- `tsc --noEmit` has three unchanged baseline errors in `MapPoiLayers.tsx:381`,
  `VillageMapBlock.tsx:171`, `villages_.$slug.tsx:275`. Comparing the compiler diagnostics
  with HEAD confirmed no additional errors. These unrelated files were not modified.
- Legacy large translation dictionaries retain their prior formatting. Focused ESLint
  checks them with only the Prettier rule disabled to avoid unrelated whole-file churn;
  the other changed frontend files use the normal ESLint configuration.

## Next stage

Update: the separately approved import was completed on 2026-11-14. Production now
contains 53 published schools and 56 published kindergartens. See
[the import record](institution-import-v3.md) for the minimal short-name extension,
preserved identities, field-by-field verification and import safeguards. Earlier counts
and import restrictions in this document describe the architecture-only stage.

Import requires separate confirmation. Use the final workbook, exact two-school UUID
mapping, the approved location aliases and a reviewed idempotent transaction. Update
only permanent identity/address/type/source fields for existing records. Never send
empty annual/ORT/media collections as an import payload. Preserve the prepared names,
addresses and all language variants verbatim. Do not automatically publish or assign
editor accounts while creating the 51 new schools and 56 kindergarten records.
