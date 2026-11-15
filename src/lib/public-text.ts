// Presentation only: call on public prose, never identifiers, URLs or source records.
// URLs embedded in prose are kept verbatim as well.
export function formatPublicText(text: string): string {
  return text.replace(/(?:https?:\/\/|\/\/|mailto:|tel:)[^\s<>"']+|[\u2013\u2014]/g, (part) =>
    part === "\u2013" || part === "\u2014" ? "-" : part,
  );
}
