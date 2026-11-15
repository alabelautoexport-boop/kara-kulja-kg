import sanitizeHtml from "sanitize-html";

// Deterministic public rendering during SSR and hydration. Admin sanitizer is unchanged.
export function sanitizePublicNewsHtml(html: string | null | undefined) {
  return sanitizeHtml(html ?? "", {
    allowedTags: ["p", "h2", "h3", "strong", "em", "ul", "ol", "li", "blockquote", "a", "br"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
  });
}
