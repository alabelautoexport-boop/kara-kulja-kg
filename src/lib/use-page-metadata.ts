import { useEffect } from "react";

// Route head provides KG metadata in the initial HTML; language switches update it.
export function usePageMetadata(title: string | undefined, description: string | undefined) {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} | Kara-Kulja`;
    if (description) {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (meta) meta.content = description;
    }
  }, [title, description]);
}
