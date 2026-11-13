// Read-only public snapshot enumeration. Never uses an Admin session or service key.
export async function publishedSchoolRoutes({ url, publicKey, fetchImpl = fetch }) {
  if (!url || !publicKey) return [];
  const routes = new Set();
  for (let offset = 0; ; offset += 1000) {
    const endpoint = new URL("/rest/v1/school_publications", url);
    endpoint.search = new URLSearchParams({
      select: "slug",
      is_published: "eq.true",
      order: "slug.asc",
      limit: "1000",
      offset: String(offset),
    });
    const response = await fetchImpl(endpoint, {
      headers: { apikey: publicKey },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Public school enumeration failed (${response.status})`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Invalid public school response");
    for (const row of rows) {
      if (typeof row.slug === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(row.slug))
        routes.add(`/schools/${row.slug}`);
    }
    if (rows.length < 1000) return [...routes];
  }
}
