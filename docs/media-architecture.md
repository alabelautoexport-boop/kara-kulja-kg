# Kara-Kulja Media Architecture

This document records the approved media storage architecture for the Kara-Kulja project.

## Hosting Responsibilities

Fornex stores only the built frontend and small static assets.

Fornex includes:
- `frontend/dist`
- favicon files
- OG image
- logos
- icons
- small UI assets

Cloudflare R2 stores the full major media archive.

R2 includes:
- hero images
- territory media
- village media
- general tourism documents and maps
- general history documents, maps, and archive media
- general investment presentations and documents
- Insandar photos, videos, and documents
- background and atmospheric assets
- future video and audio media

## Core Rule

Media files are stored once and displayed in multiple sections through metadata.

The same original asset should not be duplicated into multiple folders for different pages. Instead, page sections, cards, galleries, heroes, and related content should reference the same stored file through structured metadata.

## Approved Cloudflare R2 Folder Structure

```text
kara-kulja-media/
  territories/
    {aimakSlug}/
      general/
        photos/
        videos/
        documents/

      villages/
        {villageSlug}/
          photos/
          videos/
          documents/
          projects/

          stories/
            photos/
            videos/
            documents/

  general/
    tourism/
      documents/
      maps/

    history/
      documents/
      maps/
      archive/

    investments/
      presentations/
      documents/

    insandar/
      photos/
      videos/
      documents/

  site/
    hero/
      pages/
        home.jpg
        about.jpg
        territories.jpg
        tourism.jpg
        investments.jpg
        insandar.jpg
        history.jpg

      territories/
        {aimakSlug}/
          hero.jpg
          villages/
            {villageSlug}/
              hero.jpg

    backgrounds/
      clouds/
      fog/
      particles/
      overlays/
      mountains/
      ornaments/
      gradients/
```

## Hero Management Rules

Hero images use fixed `hero.jpg` filenames.

Approved hero paths:

```text
site/hero/pages/
site/hero/territories/{aimakSlug}/hero.jpg
site/hero/territories/{aimakSlug}/villages/{villageSlug}/hero.jpg
```

Page-level hero images live under `site/hero/pages/` as direct filenames.

Approved page-level hero filenames:

```text
site/hero/pages/home.jpg
site/hero/pages/about.jpg
site/hero/pages/territories.jpg
site/hero/pages/tourism.jpg
site/hero/pages/investments.jpg
site/hero/pages/insandar.jpg
site/hero/pages/history.jpg
```

Territory hero images live under:

```text
site/hero/territories/{aimakSlug}/hero.jpg
```

Village hero images live under their parent territory:

```text
site/hero/territories/{aimakSlug}/villages/{villageSlug}/hero.jpg
```

This keeps hero media predictable, stable, and easy to replace without changing frontend routes, slugs, or UI logic.

## Future Cinematic Backgrounds

The `site/backgrounds/` folder is reserved for future atmospheric effects and visual layers.

Approved future background categories include:
- clouds
- fog
- particles
- overlays
- mountains
- ornaments
- gradients

These assets should support the cinematic identity of the site without changing the core content architecture.

## Completed R2 Integrations

The following media sources are already connected in frontend code:

- Page heroes use `site/hero/pages/{pageSlug}.jpg`
- Territory heroes use `site/hero/territories/{aimakSlug}/hero.jpg`
- Village heroes use `site/hero/territories/{aimakSlug}/villages/{villageSlug}/hero.jpg`
- Main Insandar portraits use `general/insandar/photos/{filename}`

Current main Insandar portrait files:

```text
general/insandar/photos/Jusuev.jpg
general/insandar/photos/Abdykadyrov.jpg
general/insandar/photos/Akun-Toktosartov.jpg
general/insandar/photos/Jeenbekov.jpg
```
