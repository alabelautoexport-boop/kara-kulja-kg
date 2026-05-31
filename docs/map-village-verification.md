# Kara-Kulja Map Village Verification

Source files:
- Official site villages: `src/lib/territories-data.ts`
- OSM coordinate source: `public/data/kara-kulja-places.geojson`

## Map Naming Rule

OpenStreetMap is used only as the coordinate/source layer. Village labels on the map must come from the existing site data:
- KG: `name`
- RU: `nameRu`
- EN: `nameEn`

The map should keep only the official 55 villages currently present in `OFFICIAL_VILLAGES`. Extra OSM places are hidden.

## Summary

- Official villages in current site data: 55
- Official villages displayed on map: 50
- Official villages with matched OSM coordinates: 45
- Manually verified villages displayed: 5
- Official villages missing coordinates: 5
- Extra OSM place features hidden: 11

## Phase 5 Manual Verified Coordinates

These official villages are now shown on the map using manually verified coordinates. They are not OSM-derived points.

| Village | Slug | Latitude | Longitude | Source |
|---|---|---:|---:|---|
| Бий-Мырза / Biy-Myrza | `biy-myrza` | 40.635082 | 73.571576 | 2GIS verified |
| Күйөө-Таш / Kuyoo-Tash | `kuyotash` | 40.319857 | 74.239662 | 2GIS verified |
| Кан-Коргон / Kan-Korgon | `kan-korgon` | 40.267859 | 74.312366 | 2GIS verified |
| Шаркыратма / Sharkyratma | `sharkyratma` | 40.540790 | 73.647869 | 2GIS verified |
| Кызыл-Булак / Kyzyl-Bulak | `kyzyl-bulak` | 40.442670 | 73.594760 | 2GIS verified |

## Official Villages In Current Site Data

### kara-kulja

- Кара-Кулжа / Кара-Кульджа / Kara-Kulja
- Бий-Мырза / Бий-Мырза / Biy-Myrza
- Биринчи Май / Биринчи Май / Birinchi May
- Сары-Камыш / Сары-Камыш / Sary-Kamysh

### alaikuu

- Кызыл-Жар / Кызыл-Жар / Kyzyl-Jar
- Кайын-Талаа / Кайын-Талаа / Kaiyn-Talaa
- Коо-Чаты / Коо-Чаты / Koo-Chaty
- Терек / Терек / Terek
- Чычырканак / Чычырканак / Chychyrkanak
- Күйөө-Таш / Күйөө-Таш / Kuyoo-Tash
- Көк-Арт / Көк-Арт / Kok-Art
- Кан-Коргон / Кан-Коргон / Kan-Korgon
- Сайталаа / Сайталаа / Saitalaa
- Ара-Булак / Ара-Булак / Ara-Bulak
- Бөрү-Токой / Бөрү-Токой / Boru-Tokoy
- Желе-Дөбө / Желе-Дөбө / Jele-Dobo

### kara-guz

- Жаңы-Талаа / Жаңы-Талаа / Jany-Talaa
- Алтын-Күрөк / Алтын-Күрөк / Altyn-Kurok
- Жетим-Дөбө / Жетим-Дөбө / Jetim-Dobo
- Калматай / Калматай / Kalmatay
- Кара-Жыгач / Кара-Жыгач / Kara-Jygach
- Насирдин / Насирдин / Nasirdin
- Кеңеш / Кеңеш / Kenesh
- Пор / Пор / Por

### kara-kochkor

- Кара-Кочкор / Кара-Кочкор / Kara-Kochkor
- Ак-Кыя / Ак-Кыя / Ak-Kyya
- Кашка-Жол / Кашка-Жол / Kashka-Jol
- Сары-Булак / Сары-Булак / Sary-Bulak (`sary-bulak-kara-kochkor`)
- Жаңы-Талап / Жаңы-Талап / Jany-Talap
- Жийде / Жийде / Jiide
- Октябрь / Октябрь / Oktyabr
- Тоготой / Тоготой / Togotoy
- Ынтымак / Ынтымак / Yntymak

### oy-tal

- Сары-Бээ / Сары-Бээ / Sary-Bee
- Кара-Таш / Кара-Таш / Kara-Tash
- Терек-Суу / Терек-Суу / Terek-Suu
- Ничке-Суу / Ничке-Суу / Nichke-Suu
- Ой-Тал / Ой-Тал / Oi-Tal
- Көңдүк / Көңдүк / Konduk

### ryspai-abdykadyrov

- Сары-Булак / Сары-Булак / Sary-Bulak (`sary-bulak`)
- Кара-Булак / Кара-Булак / Kara-Bulak
- Конокбай-Талаа / Конокбай-Талаа / Konokbay-Talaa
- Кызыл-Булак / Кызыл-Булак / Kyzyl-Bulak
- Сары-Күңгөй / Сары-Күңгөй / Sary-Kungoy
- Тегерек-Саз / Тегерек-Саз / Tegerek-Saz
- Тогуз-Булак / Тогуз-Булак / Toguz-Bulak

### ylai-talaa

- Токбай-Талаа / Токбай-Талаа / Tokbay-Talaa
- Буйга / Буйга / Buyga
- Беш-Кемпир / Беш-Кемпир / Besh-Kempir
- Орто-Талаа / Орто-Талаа / Orto-Talaa
- Ылай-Талаа / Ылай-Талаа / Ylai-Talaa
- Сай / Сай / Sai
- Шаркыратма / Шаркыратма / Sharkyratma
- Жылкол / Жылкол / Jylkol
- Сарыташ / Сарыташ / Sarytash

## Official Villages Found On Map

These official villages currently have matched OSM coordinates or verified manual coordinates:

- Кара-Кулжа / Кара-Кульджа / Kara-Kulja
- Бий-Мырза / Бий-Мырза / Biy-Myrza (`2GIS verified`)
- Биринчи Май / Биринчи Май / Birinchi May
- Сары-Камыш / Сары-Камыш / Sary-Kamysh
- Кызыл-Жар / Кызыл-Жар / Kyzyl-Jar
- Кайын-Талаа / Кайын-Талаа / Kaiyn-Talaa
- Коо-Чаты / Коо-Чаты / Koo-Chaty
- Терек / Терек / Terek
- Күйөө-Таш / Күйөө-Таш / Kuyoo-Tash (`2GIS verified`)
- Көк-Арт / Көк-Арт / Kok-Art
- Кан-Коргон / Кан-Коргон / Kan-Korgon (`2GIS verified`)
- Сайталаа / Сайталаа / Saitalaa
- Бөрү-Токой / Бөрү-Токой / Boru-Tokoy
- Жаңы-Талаа / Жаңы-Талаа / Jany-Talaa
- Алтын-Күрөк / Алтын-Күрөк / Altyn-Kurok
- Жетим-Дөбө / Жетим-Дөбө / Jetim-Dobo
- Калматай / Калматай / Kalmatay
- Кара-Жыгач / Кара-Жыгач / Kara-Jygach
- Насирдин / Насирдин / Nasirdin
- Кеңеш / Кеңеш / Kenesh
- Пор / Пор / Por
- Кара-Кочкор / Кара-Кочкор / Kara-Kochkor
- Ак-Кыя / Ак-Кыя / Ak-Kyya
- Кашка-Жол / Кашка-Жол / Kashka-Jol
- Сары-Булак / Сары-Булак / Sary-Bulak (`sary-bulak-kara-kochkor`)
- Жаңы-Талап / Жаңы-Талап / Jany-Talap
- Жийде / Жийде / Jiide
- Октябрь / Октябрь / Oktyabr
- Тоготой / Тоготой / Togotoy
- Ынтымак / Ынтымак / Yntymak
- Сары-Бээ / Сары-Бээ / Sary-Bee
- Кара-Таш / Кара-Таш / Kara-Tash
- Терек-Суу / Терек-Суу / Terek-Suu
- Ничке-Суу / Ничке-Суу / Nichke-Suu
- Ой-Тал / Ой-Тал / Oi-Tal
- Көңдүк / Көңдүк / Konduk
- Сары-Булак / Сары-Булак / Sary-Bulak (`sary-bulak`)
- Кара-Булак / Кара-Булак / Kara-Bulak
- Конокбай-Талаа / Конокбай-Талаа / Konokbay-Talaa
- Кызыл-Булак / Кызыл-Булак / Kyzyl-Bulak (`2GIS verified`)
- Сары-Күңгөй / Сары-Күңгөй / Sary-Kungoy
- Тегерек-Саз / Тегерек-Саз / Tegerek-Saz
- Тогуз-Булак / Тогуз-Булак / Toguz-Bulak
- Токбай-Талаа / Токбай-Талаа / Tokbay-Talaa
- Буйга / Буйга / Buyga
- Ылай-Талаа / Ылай-Талаа / Ylai-Talaa
- Сай / Сай / Sai
- Шаркыратма / Шаркыратма / Sharkyratma (`2GIS verified`)
- Жылкол / Жылкол / Jylkol
- Сарыташ / Сарыташ / Sarytash

## Missing Coordinates / Pending Manual Verification

These official villages are retained in the site data, but no verified coordinate is currently available. They should not be placed until coordinates are verified:

- Чычырканак / Чычырканак / Chychyrkanak
- Ара-Булак / Ара-Булак / Ara-Bulak
- Желе-Дөбө / Желе-Дөбө / Jele-Dobo
- Беш-Кемпир / Беш-Кемпир / Besh-Kempir
- Орто-Талаа / Орто-Талаа / Orto-Talaa

Required data for each missing village:
- verified latitude
- verified longitude
- source or confirmation note

## Hidden Extra OSM Place Features

These OSM place features are not part of the current official 55-village site list, or are duplicate/problematic coordinates, so they are hidden:

- Alaykuu Range
- Карасу / Karasu
- Кара-Таш duplicate
- Ачык-Таш / Achyk-Tash
- Казан-Булак / Kazan-Bulak
- Узун Айрык / Uzun Ayryk
- Саз жайлоосу / Saz Jayloo
- Зардобука / Zardobuka
- Актакыр / Aktakyr
- Кыдыруу жайлоосу / Kydyruu Jayloo
- Бөдөнө / Bödönö

## Duplicate / Problematic Names

- `Сары-Булак` appears twice in official site data:
  - `sary-bulak-kara-kochkor`
  - `sary-bulak`
- OSM also has two `Сары-Булак` place points. Both should be manually verified against their territory before finalizing.
- `Кара-Таш` appears once in official site data, but OSM has two `Кара-Таш` points. The current map uses one matched point and hides the other as a duplicate until manually verified.

## Name Overrides Used For Coordinate Matching Only

These overrides are used only to match OSM coordinate points to official site villages. They are not used as label text.

- Биринчи Май: `Первое Мая`, `Pervoye Maya`
- Жаңы-Талап: `Жаны-Талап`
- Жаңы-Талаа: `Жаны-Талаа`
- Алтын-Күрөк: `Алтын-Кюрек`
- Жетим-Дөбө: `Жетим-Дебе`
- Кеңеш: `Кенеш`
- Сайталаа: `Сай талаа`, `Say-Talaa`
- Бөрү-Токой: `Бору-Токой`, `Bory-Tokoy`
- Кайын-Талаа: `Кайың-Талаа`, `Kaying-Talaa`
- Көңдүк: `Көндүк`, `Köndük`, `Кондук`
- Конокбай-Талаа: `Конобай-Талаа`
- Сарыташ: `Сары-Таш`
