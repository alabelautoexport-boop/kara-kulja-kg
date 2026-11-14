// Real catalogs + forms with anonymous in-memory API fixtures. No live database writes.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { publishedKindergartenRoutes } from "./school-publication-routes.mjs";
const { JSDOM } = await import(pathToFileURL(process.argv[2]));
const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/kindergartens" });
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLSelectElement",
  "Event",
  "MouseEvent",
  "localStorage",
  "MutationObserver",
  "Node",
  "Element",
  "DocumentFragment",
  "CustomEvent",
])
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const sources = {
  "@/lib/supabase": `export const requests=[]; export const rows=[
    {kindergarten_id:'private-id',slug:'garden',is_published:true,document:{info:{short_name_kg:'«Ырыскан апа»',short_name_ru:'«Ырыскан апа»',short_name_en:'Yryskan apa',type:'kindergarten',name_kg:'Бала бакча KG',name_ru:'Сад RU',name_en:'Garden EN',address_kg:'Дарек KG',address_ru:'Адрес RU',address_en:'Address EN',territory_slug:'ryspai-abdykadyrov',village_slug:'kyzyl-bulak'}}},
    {kindergarten_id:'unit-id',slug:'unit',is_published:true,document:{info:{type:'school_preschool',name_kg:'Мектеп алдындагы бакча',name_ru:'Дошкольное отделение',name_en:'Preschool unit',address_kg:'KG',address_ru:'RU',address_en:'EN',territory_slug:'kara-kochkor',village_slug:'zhiyde'}}},
    {slug:'draft',is_published:false,document:{info:{name_kg:'HIDDEN_DRAFT'}}}];
    export const supabase={from(table){if(table!=='kindergarten_publications')throw Error('Private table queried');const filters=[];requests.push({table,filters});const result=()=>({data:rows.filter(r=>filters.every(([k,v])=>r[k]===v)),error:null});const q={select(){return q},eq(k,v){filters.push([k,v]);return q},order(){return q},then(resolve){return Promise.resolve(result()).then(resolve)},async maybeSingle(){return {...result(),data:result().data[0]??null}}};return q}};`,
  "@tanstack/react-router":
    "import React from 'react';export const Link=({to,params,hash,children,...props})=>React.createElement('a',{...props,href:to.replace('$slug',params?.slug??'')+(hash?'#'+hash:'')},children);",
  "@/components/site/Layout":
    "import React from 'react';export const SiteLayout=({children})=>React.createElement('main',null,children);",
};
const bundled = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
  import React,{act}from'react';import{createRoot}from'react-dom/client';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
  import{KindergartensList,KindergartenPublicPage}from'./src/components/site/Kindergartens';import{I18nProvider}from'./src/lib/i18n';
  import{SchoolIdentityFields}from'./src/components/admin/SchoolIdentityFields';import{EMPTY_SCHOOL_INFO}from'./src/lib/schools-data';
  export{prepareInstitutionLocation}from'./src/lib/institution-import';export{validKindergarten}from'./src/lib/kindergartens-data';
  export{isSchoolType,SCHOOL_TYPES}from'./src/lib/institution-types';export*as api from'@/lib/supabase';
  export{kindergartenDisplayName}from'./src/components/site/kindergarten-display-name';
  export{act};export const root=createRoot(document.getElementById('root'));export const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
  export function render(mode,lang='kg',slug='garden'){localStorage.setItem('kk-lang',lang);root.render(<QueryClientProvider client={client}><I18nProvider key={lang+slug}>{mode==='list'?<KindergartensList/>:mode==='detail'?<KindergartenPublicPage slug={slug}/>:<SchoolIdentityFields value={{...EMPTY_SCHOOL_INFO,school_type:'general'}} onChange={()=>{}}/>}</I18nProvider></QueryClientProvider>)}
`,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  logLevel: "error",
  define: { "import.meta.env": "{}" },
  loader: { ".jpg": "dataurl" },
  plugins: [
    {
      name: "public-fixture",
      setup(b) {
        b.onResolve(
          {
            filter:
              /^(@\/lib\/supabase|@tanstack\/react-router|@\/components\/site\/Layout|\.\/Layout|\.\/supabase)$/,
          },
          (a) => ({
            path:
              a.path === "./Layout"
                ? "@/components/site/Layout"
                : a.path === "./supabase"
                  ? "@/lib/supabase"
                  : a.path,
            namespace: "fixture",
          }),
        );
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          contents: sources[a.path],
          loader: "js",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const mod = { exports: {} };
new Function("require", "module", "exports", bundled.outputFiles[0].text)(
  createRequire(import.meta.url),
  mod,
  mod.exports,
);
const {
  act,
  render,
  root,
  client,
  api,
  prepareInstitutionLocation,
  validKindergarten,
  isSchoolType,
  SCHOOL_TYPES,
  kindergartenDisplayName,
} = mod.exports;
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
const mount = async (mode, lang, slug) => {
  await act(async () => render(mode, lang, slug));
  await flush();
};
try {
  for (const [lang, title, name, address] of [
    ["kg", "Бала бакчалар", "Бала бакча KG", "Дарек KG", "Бала бакча"],
    ["ru", "Детские сады", "Сад RU", "Адрес RU", "Детский сад"],
    ["en", "Kindergartens", "Garden EN", "Address EN", "Kindergarten"],
  ]) {
    await mount("list", lang);
    assert.equal(document.querySelector("h1").textContent, title);
    assert.equal(document.querySelector('a[href="/kindergartens/garden"] h2').textContent, name);
    assert.ok(
      !document
        .querySelector('a[href="/kindergartens/garden"]')
        .textContent.includes(lang === "en" ? "Yryskan apa" : "«Ырыскан апа»"),
    );
    assert.equal(document.querySelectorAll('a[href^="/kindergartens/"]').length, 2);
    assert.ok(!document.body.textContent.includes("HIDDEN_DRAFT"));
    assert.equal(document.querySelectorAll("select").length, 2);
    assert.equal(document.querySelectorAll('input[type="search"]').length, 1);
    assert.ok(
      document
        .querySelector('input[type="search"]')
        .closest("div")
        .classList.contains("md:grid-cols-3"),
    );
    assert.equal(document.querySelectorAll('a[href="/kindergartens/garden"] p').length, 1);
    await mount("detail", lang);
    assert.equal(document.querySelector("h1").textContent, name);
    assert.ok(document.body.textContent.includes(address));
    assert.equal(document.querySelectorAll("dt").length, 1);
    assert.equal(document.querySelector("dd").textContent.trim(), address);
    assert.ok(!document.body.textContent.includes("private-id"));
  }
  // Reviewed public snapshots: full/initial-only names and preschool units.
  const nameCases = [
    {
      slug: "5-balapan-bala-bakchasy",
      info: {
        name_kg: "№5 «Балапан» бала бакчасы",
        name_ru: "Детский сад №5 «Балапан»",
        name_en: "№5 «Balapan Kindergarten",
        short_name_kg: "№5 «Балапан»",
        short_name_ru: "№5 «Балапан»",
        short_name_en: "№5 «Balapan»",
        address_kg: "Кара-Жыгач айылы, Н. Эргешов көчөсү, номерсиз",
        address_ru: "с. Кара-Жыгач, ул. Н. Эргешов, без номера",
        address_en: "N. Ergeshov St., Kara-Zhygach (No street number)",
        territory_slug: "kara-guz",
        village_slug: "kara-zhygach",
        type: "kindergarten",
      },
      expected: {
        kg: "№5 «Балапан» бала бакчасы",
        ru: "Детский сад №5 «Балапан»",
        en: "No. 5 “Balapan” Kindergarten",
      },
    },
    {
      slug: "a-kalmatov-mektep-aldyndagy-bala-bakcha",
      info: {
        name_kg: "А. Калматов мектеп алдындагы бала бакча",
        name_ru: "Дошкольное отделение при школе А. Калматов",
        name_en: "A. Kalmatov School Preschool Unit",
        short_name_kg: "А. Калматов",
        short_name_ru: "А. Калматов",
        short_name_en: "A. Kalmatov",
        address_kg: "Калматай айылы, А. Ибраимов көчөсү, 1",
        address_ru: "с. Калматай, ул. А. Ибраимов, 1",
        address_en: "1 A. Ibraimov St., Kalmatay",
        territory_slug: "kara-guz",
        village_slug: "kalmatay",
        type: "school_preschool",
      },
      expected: {
        kg: "Апыз Калматов мектеп алдындагы бала бакча",
        ru: "Дошкольное отделение при школе им. Апыза Калматова",
        en: "Apyz Kalmatov School Preschool Unit",
      },
    },
    {
      slug: "a-karimov-atyndagy-bala-bakcha",
      info: {
        name_kg: "А. Каримов атындагы бала бакча",
        name_ru: "Детский сад им. А. Каримов",
        name_en: "A. Karimov Kindergarten",
        short_name_kg: "А. Каримов",
        short_name_ru: "А. Каримов",
        short_name_en: "A. Karimov",
        address_kg: "Кара-Кулжа айылы, К. Каратев көчөсү, 28",
        address_ru: "с. Кара-Кулжа, ул. К. Каратев, 28",
        address_en: "28 K. Karatev St., Kara-Kulzha",
        territory_slug: "kara-kulja",
        village_slug: "kara-kulja",
        type: "kindergarten",
      },
      expected: {
        kg: "А. Каримов атындагы бала бакча",
        ru: "Детский сад им. А. Каримова",
        en: "A. Karimov Kindergarten",
      },
    },
    {
      slug: "t-sydykov-mektep-aldyndagy-bala-bakcha",
      info: {
        name_kg: "Т. Сыдыков мектеп алдындагы бала бакча",
        name_ru: "Дошкольное отделение при школе Т. Сыдыков",
        name_en: "T. Sydykov School Preschool Unit",
        short_name_kg: "Т. Сыдыков",
        short_name_ru: "Т. Сыдыков",
        short_name_en: "T. Sydykov",
        address_kg: "Пор айылы, Жолдошев көчөсү, 98",
        address_ru: "с. Пор, ул. Жолдошев, 98",
        address_en: "98 Zholdoshev St., Por",
        territory_slug: "kara-guz",
        village_slug: "por",
        type: "school_preschool",
      },
      expected: {
        kg: "Токтор Сыдыков мектеп алдындагы бала бакча",
        ru: "Дошкольное отделение при школе им. Токтора Сыдыкова",
        en: "Toktor Sydykov School Preschool Unit",
      },
    },
    {
      slug: "zh-abidinov-mektep-aldyndagy-bala-bakcha",
      info: {
        name_kg: "Ж. Абидинов мектеп алдындагы бала бакча",
        name_ru: "Дошкольное отделение при школе Ж. Абидинов",
        name_en: "Zh. Abidinov School Preschool Unit",
        short_name_kg: "Ж. Абидинов",
        short_name_ru: "Ж. Абидинов",
        short_name_en: "Zh. Abidinov",
        address_kg: "Буйга айылы, Бешкемпир көчөсү, 13",
        address_ru: "с. Буйга, ул. Бешкемпир, 13",
        address_en: "13 Beshkempir St., Buyga",
        territory_slug: "ylai-talaa",
        village_slug: "buyga",
        type: "school_preschool",
      },
      expected: {
        kg: "Жумабай Абидинов мектеп алдындагы бала бакча",
        ru: "Дошкольное отделение при школе им. Жумабая Абидинова",
        en: "Zhumabay Abidinov School Preschool Unit",
      },
    },
    {
      slug: "sh-bokoeva-atyndagy-bala-bakcha",
      info: {
        name_kg: "Ш. Бокоева атындагы бала бакча",
        name_ru: "Детский сад им. Ш. Бокоева",
        name_en: "Sh. Bokoeva Kindergarten",
        short_name_kg: "Ш. Бокоева",
        short_name_ru: "Ш. Бокоева",
        short_name_en: "Sh. Bokoeva",
        address_kg: "Тоготой айылы, Р. Аликеев көчөсү, 16",
        address_ru: "с. Тоготой, ул. Р. Аликеев, 16",
        address_en: "16 R. Alikeev St., Togotoy",
        territory_slug: "kara-kochkor",
        village_slug: "togotoy",
        type: "kindergarten",
      },
      expected: {
        kg: "Ш. Бокоева атындагы бала бакча",
        ru: "Детский сад им. Ш. Бокоевой",
        en: "Sh. Bokoeva Kindergarten",
      },
    },
    {
      slug: "zh-mamyr-mektep-aldyndagy-bala-bakcha",
      info: {
        name_kg: "Ж Мамыр мектеп алдындагы бала бакча",
        name_ru: "Дошкольное отделение при школе Ж Мамыр",
        name_en: "Zh Mamyr School Preschool Unit",
        short_name_kg: "Ж. Мамыр",
        short_name_ru: "Ж. Мамыр",
        short_name_en: "Zh. Mamyr",
        address_kg: "Бөрү-Токой айылы, Бөрү-Токой көчөсү, 1",
        address_ru: "с. Бөрү-Токой, ул. Бөрү-Токой, 1",
        address_en: "1 Boru-Tokoy St., Boru-Tokoy",
        territory_slug: "alaikuu",
        village_slug: "boru-tokoy",
        type: "school_preschool",
      },
      expected: {
        kg: "Ж. Мамыр мектеп алдындагы бала бакча",
        ru: "Дошкольное отделение при школе им. Ж. Мамыра",
        en: "Zh. Mamyr School Preschool Unit",
      },
    },
    {
      slug: "g-ibraimova-atyndagy-bala-bakcha",
      info: {
        name_kg: "Г. Ибраимова атындагы бала бакча",
        name_ru: "Детский сад им. Г. Ибраимова",
        name_en: "G. Ibraimova Kindergarten",
        short_name_kg: "Г. Ибраимова",
        short_name_ru: "Г. Ибраимова",
        short_name_en: "G. Ibraimova",
        address_kg: "Кара-Кулжа айылы, М. Алиев көчөсү, 78",
        address_ru: "с. Кара-Кулжа, ул. М. Алиев, 78",
        address_en: "78 M. Aliev St., Kara-Kulzha",
        territory_slug: "kara-kulja",
        village_slug: "kara-kulja",
        type: "kindergarten",
      },
      expected: {
        kg: "Г. Ибраимова атындагы бала бакча",
        ru: "Детский сад им. Г. Ибраимовой",
        en: "G. Ibraimova Kindergarten",
      },
    },
  ];
  const sourcesBefore = JSON.stringify(nameCases);
  for (const [i, fixture] of nameCases.entries()) {
    api.rows.push({
      kindergarten_id: "name-case-" + i,
      slug: fixture.slug,
      is_published: true,
      document: { info: fixture.info },
    });
    for (const lang of ["kg", "ru", "en"]) {
      assert.equal(
        kindergartenDisplayName(fixture.info, fixture.slug, lang),
        fixture.expected[lang],
      );
      const edited = { ...fixture.info, ["name_" + lang]: "New approved full name" };
      assert.equal(kindergartenDisplayName(edited, fixture.slug, lang), "New approved full name");
      assert.equal(
        kindergartenDisplayName(fixture.info, "different-institution", lang),
        fixture.info["name_" + lang],
      );
    }
  }
  client.clear();
  for (const lang of ["kg", "ru", "en"]) {
    await mount("list", lang);
    assert.equal(document.querySelectorAll("select").length, 2);
    for (const fixture of nameCases) {
      const card = document.querySelector('a[href="/kindergartens/' + fixture.slug + '"]');
      assert.equal(card.querySelector("h2").textContent, fixture.expected[lang]);
      assert.equal(card.querySelectorAll("p").length, 1);
      assert.ok(card.querySelector("p").textContent.includes(" · "));
    }
    for (const fixture of nameCases) {
      await mount("detail", lang, fixture.slug);
      assert.equal(document.querySelector("h1").textContent, fixture.expected[lang]);
      assert.equal(document.querySelectorAll("dt").length, 1);
      assert.equal(
        document.querySelector("dd").textContent.trim(),
        fixture.info["address_" + lang],
      );
    }
  }
  assert.equal(JSON.stringify(nameCases), sourcesBefore);
  assert.ok(
    api.requests.every(
      (r) =>
        r.table === "kindergarten_publications" &&
        r.filters.some(([k, v]) => k === "is_published" && v === true),
    ),
  );
  await mount("admin");
  assert.equal(document.querySelector("select").querySelectorAll("option").length, 7);
  assert.ok(SCHOOL_TYPES.every(isSchoolType));
  assert.equal(isSchoolType("unknown"), false);
  for (const [no, village, slug] of [
    [41, "Кызыл-Булак", "kyzyl-bulak"],
    [42, "Кара-Булак", "kara-bulak"],
    [43, "Тегерек-Саз", "tegerek-saz"],
    [44, "Сары-Күнгөй", "sary-kungoy"],
  ]) {
    const prepared = prepareInstitutionLocation("Сары-Булак", village, {
      source_file: "FINAL.xlsx",
      source_sheet: "Бакчалар",
      source_row: no + 1,
      excel_number: no,
      original_name: "Original МЧББУ",
      original_address: "Original address",
    });
    assert.equal(prepared.territory_slug, "ryspai-abdykadyrov");
    assert.equal(prepared.village_slug, slug);
    assert.equal(prepared.source_metadata.original_territory, "Сары-Булак");
    assert.ok(validKindergarten({ ...api.rows[0].document.info, ...prepared }));
  }
  assert.throws(() => prepareInstitutionLocation("Сары-Булак", "Жийде", {}));
  assert.deepEqual(
    await publishedKindergartenRoutes({
      url: "https://example.invalid",
      publicKey: "fixture",
      fetchImpl: async (url) => {
        assert.equal(url.pathname, "/rest/v1/kindergarten_publications");
        assert.equal(url.searchParams.get("is_published"), "eq.true");
        return { ok: true, json: async () => [{ slug: "safe" }, { slug: "../unsafe" }] };
      },
    }),
    ["/kindergartens/safe"],
  );
  console.log(
    "Institution public UI passed: KG/RU/EN full names/addresses, confirmed-name expansion and retained initials, three catalog filters, no public type rows, safe snapshot queries, draft exclusion, unchanged Admin type options, safe sitemap routes",
  );
} finally {
  await act(async () => root.unmount());
  client.clear();
  dom.window.close();
}

// The bundled React scheduler retains MessagePorts after jsdom teardown. All assertions and cleanup completed.
process.exit(0);
