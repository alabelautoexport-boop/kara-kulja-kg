# School identity and academic years

The public `/schools` route is a school directory. One `schools.id` and one slug identify
an institution across years. Its filters are name, territory and village; cards contain
the school name, location and detail link, plus an optional published cover. There is no
academic-year filter or duplication of schools per period.

## Existing compatible data

- School identity, location, addresses and current contacts remain in the existing school record.
- `school_year_stats` already has the composite key `(school_id, academic_year)`.
- `school_ort_years` already references `school_id` and records `academic_year`; public
  snapshots contain only computed ORT summaries, never individual scores.
- `school-academic-years.ts` groups those actual published records into
  `PublishedSchoolAcademicYear` entries linked to the same `school_id`, newest first.
- A `current_academic_year` label alone does not create an available/archive period.
  Empty annual statistics likewise do not manufacture a selectable year. Actual zero
  counts are retained. The school detail view uses the latest available period for
  its annual indicators and keeps existing public ORT history.

No schema migration, data conversion, additional school or new route is introduced here.
Existing current-year/contact fields remain compatible with Admin and publication RPCs.

## Future annual archive

The future `Окуу жылдары` block belongs only on `/schools/:slug`. It should use real,
published annual entries, select the newest available period by default and show only
that period's records when switching. Do not generate empty 2026-2027/2025-2026/etc. options.

When annual director/staff/class counts, achievements, events, media or documents become
available, introduce a dedicated year parent keyed uniquely by `(school_id, academic_year)`
and attach those records to that parent, not to a newly created school. Extend the reviewed
publication snapshot with an explicit public year projection in the same separately reviewed
migration. Do not expose raw ORT scores or editor-only fields.

Permanent institution history, location, address, general contacts and other permanent information
stay school-scoped. A director's historical tenure and annual media cannot be inferred from
today's flat `director_name` or school-wide gallery: retain those legacy current fields until
an explicit migration and verified annual data exist. Never copy today's director or photos
into every historical year. A period-specific contact may be added later without replacing
the institution's permanent reception contact.

The large archive selector/editor UI is intentionally deferred until those annual records
exist. The grouping adapter prepares that extension without inventing data or changing
the current directory, routes, authorization or stored publications.
