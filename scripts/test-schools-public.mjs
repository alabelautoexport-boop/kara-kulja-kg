// Real public components and snapshot queries, isolated from Supabase/network.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { tmpdir } from "node:os";
import { publishedSchoolRoutes } from "./school-publication-routes.mjs";

const { JSDOM } = await import(
  pathToFileURL(
    process.argv[2] ??
      path.join(tmpdir(), "kara-kulja-schools-ui-tests/node_modules/jsdom/lib/api.js"),
  )
);
const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/schools" });
for (const name of [
  "window",
  "document",
  "HTMLElement",
  "Event",
  "MouseEvent",
  "localStorage",
  "MutationObserver",
  "Node",
  "NodeFilter",
  "Element",
  "DocumentFragment",
  "CustomEvent",
  "HTMLInputElement",
  "HTMLDetailsElement",
])
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const stub = `
  export const requests=[];
  const doc={info:{short_name_kg:'Б. Эшмамбетов',short_name_ru:'Б. Эшмамбетов',short_name_en:'B. Eshmambetov',school_type:'general',name_kg:'Public KG',name_ru:'Public RU',name_en:'Public EN',territory_slug:'ylai-talaa',village_slug:'ylai-talaa',current_academic_year:'2026-2027',director_name:'Public director',director_phone:'12345',office_phone:'',address_kg:'Address KG',address_ru:'Address RU',address_en:'Address EN',review_note:'PRIVATE_NOTE'},stats:[],ort:[{year:2026,academic_year:'2025-2026',scores:['RAW_SCORES_SENTINEL'],summary:{participants:3,average:167,median:156,minimum:142,maximum:203,over200:1,distribution:[0,0,1,1,0,0,1]}}],achievements:[],resources:[]};
  doc.media={cover:{asset_id:'22222222-2222-4222-8222-222222222222',kind:'cover',main_key:'schools/11111111-1111-4111-8111-111111111111/cover/22222222-2222-4222-8222-222222222222/main.webp',thumb_key:'schools/11111111-1111-4111-8111-111111111111/cover/22222222-2222-4222-8222-222222222222/card.webp',width:1600,height:1200,thumb_width:960,thumb_height:720},gallery:[{asset_id:'33333333-3333-4333-8333-333333333333',kind:'gallery',main_key:'schools/11111111-1111-4111-8111-111111111111/gallery/33333333-3333-4333-8333-333333333333/image.webp',thumb_key:'schools/11111111-1111-4111-8111-111111111111/gallery/33333333-3333-4333-8333-333333333333/thumb.webp',width:1600,height:1200,thumb_width:480,thumb_height:360}]};
  export const rows=[{school_id:'PRIVATE_UUID',slug:'published-school',is_published:true,document:doc},{school_id:'hidden',slug:'draft-school',is_published:false,document:{...doc,info:{...doc.info,name_kg:'DRAFT_ONLY_NAME'}}}];
  export const supabase={from(table){if(table!=='school_publications')throw Error('Internal table queried publicly');const filters=[];const request={table,filters};requests.push(request);
    const result=()=>({data:rows.filter(row=>filters.every(([key,value])=>row[key]===value)),error:null});
    const query={select(fields){request.fields=fields;return query;},eq(key,value){filters.push([key,value]);return query;},order(){return query;},then(resolve){return Promise.resolve(result()).then(resolve);},async maybeSingle(){const value=result();return {...value,data:value.data[0]??null};}};return query;}};
`;
const sources = {
  "@/lib/supabase": stub,
  "@tanstack/react-router":
    "import React from 'react';export const createFileRoute=()=>options=>options;export const Link=({to,params,hash,activeProps,children,...props})=>React.createElement('a',{...props,href:to.replace('$slug',params?.slug??'')+(hash?'#'+hash:'')},children);",
  "@/components/site/Layout":
    "import React from 'react';export const SiteLayout=({children})=>React.createElement('main',null,children);export const PageHero=({title})=>React.createElement('h1',null,title);",
};
const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
    import React,{act}from'react';import{createRoot}from'react-dom/client';
    import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
    import{SchoolsList,SchoolPublicPage}from'./src/components/site/Schools';
    import{Route as AboutRoute}from'./src/routes/about';import{Header}from'./src/components/site/Header';import{Footer}from'./src/components/site/Footer';
    import{I18nProvider}from'./src/lib/i18n';import * as api from '@/lib/supabase';
    export{TERRITORIES}from'./src/lib/territories-data';
    export{getPublishedSchoolAcademicYears}from'./src/lib/school-academic-years';
    export {api,act};export const root=createRoot(document.getElementById('root'));
    export const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
    export function render(mode,lang='kg',slug='published-school'){localStorage.setItem('kk-lang',lang);root.render(<QueryClientProvider client={client}><I18nProvider key={lang+mode+slug}>{mode==='list'?<SchoolsList/>:mode==='nav'?<><Header/><Footer/></>:mode==='about'?<AboutRoute.component/>:<SchoolPublicPage slug={slug}/>}</I18nProvider></QueryClientProvider>);}
  `,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  packages: "external",
  loader: { ".jpg": "dataurl" },
  plugins: [
    {
      name: "isolated-public",
      setup(plugin) {
        plugin.onResolve(
          { filter: /^(@\/lib\/supabase|@tanstack\/react-router|@\/components\/site\/Layout)$/ },
          (args) => ({ path: args.path, namespace: "fixture" }),
        );
        plugin.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          contents: sources[args.path],
          loader: "js",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const mod = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(
  createRequire(import.meta.url),
  mod,
  mod.exports,
);
const { root, act, api, client, render, TERRITORIES, getPublishedSchoolAcademicYears } =
  mod.exports;
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
const mount = async (mode, lang = "kg", slug) => {
  await act(async () => render(mode, lang, slug));
  await flush();
};
try {
  const initialYears = getPublishedSchoolAcademicYears(api.rows[0]);
  assert.deepEqual(
    initialYears.map((period) => period.academic_year),
    ["2025-2026"],
  );
  assert.equal(initialYears[0].school_id, api.rows[0].school_id);
  assert.equal(initialYears[0].ort[0].scores, undefined);
  const annualFixture = structuredClone(api.rows[0]);
  annualFixture.document.stats = [
    { academic_year: "2024-2025", total_students: 100, total_teachers: 12, grade11_graduates: 0 },
    {
      academic_year: "2026-2027",
      total_students: null,
      total_teachers: null,
      grade11_graduates: null,
    },
  ];
  assert.deepEqual(
    getPublishedSchoolAcademicYears(annualFixture).map((period) => period.academic_year),
    ["2025-2026", "2024-2025"],
  );
  annualFixture.document.stats[1].total_students = 120;
  assert.deepEqual(
    getPublishedSchoolAcademicYears(annualFixture).map((period) => period.academic_year),
    ["2026-2027", "2025-2026", "2024-2025"],
  );
  assert.deepEqual(
    getPublishedSchoolAcademicYears({
      ...annualFixture,
      document: { ...annualFixture.document, stats: [], ort: [] },
    }),
    [],
  );
  for (const [lang, name, more, nav] of [
    ["kg", "Public KG", "Толук маалымат", "Мектептер"],
    ["ru", "Public RU", "Подробнее", "Школы"],
    ["en", "Public EN", "More details", "Schools"],
  ]) {
    await mount("list", lang);
    assert.equal(
      document.querySelector('a[href="/schools/published-school"] h2').textContent,
      name,
    );
    assert.ok(
      !document
        .querySelector('a[href="/schools/published-school"]')
        .textContent.includes(
          { kg: "Б. Эшмамбетов", ru: "Б. Эшмамбетов", en: "B. Eshmambetov" }[lang],
        ),
    );
    assert.ok(!document.body.textContent.includes("Public director"));
    assert.equal(
      document.querySelector("h1").textContent,
      { kg: "Мектептер", ru: "Школы", en: "Schools" }[lang],
    );
    assert.equal(
      document.querySelector('a[href="/about#social-infrastructure"]').textContent.trim(),
      {
        kg: "Коомдук инфраструктура",
        ru: "Общественная инфраструктура",
        en: "Public infrastructure",
      }[lang],
    );
    assert.ok(!document.body.textContent.includes("2026-2027"));
    assert.equal(document.querySelectorAll("select").length, 2);
    assert.equal(document.querySelectorAll('input[type="search"]').length, 1);
    assert.ok(
      document
        .querySelector('input[type="search"]')
        .closest("div")
        .classList.contains("md:grid-cols-3"),
    );
    assert.equal(document.querySelectorAll('a[href="/schools/published-school"] p').length, 1);
    const schoolTypeLabel = { kg: "Мектептин түрү", ru: "Тип школы", en: "School type" }[lang];
    assert.ok(!document.body.textContent.includes(schoolTypeLabel));
    assert.ok(document.body.textContent.includes(more));
    assert.equal(document.querySelectorAll('a[href="/schools/published-school"]').length, 1);
    assert.equal(document.querySelectorAll('img[src$="/card.webp"][loading="lazy"]').length, 1);
    await mount("detail", lang);
    assert.equal(document.querySelector("h1").textContent, name);
    assert.ok(!document.body.textContent.includes(schoolTypeLabel));
    assert.ok(document.body.textContent.includes("Public director"));
    const indicators = document.querySelector(
      'section[aria-labelledby="school-indicators-heading"]',
    );
    assert.ok(indicators);
    const headings = [...document.querySelectorAll("h2")].map((h) => h.textContent);
    const generalSection = [...document.querySelectorAll("section")].find(
      (section) =>
        section.querySelector("h2")?.textContent ===
        { kg: "Жалпы маалымат", ru: "Общая информация", en: "General information" }[lang],
    );
    assert.ok(!generalSection.textContent.includes("2026-2027"));
    assert.equal(generalSection.querySelectorAll("dt").length, 5);
    assert.ok(
      generalSection.textContent.includes(
        { kg: "Address KG", ru: "Address RU", en: "Address EN" }[lang],
      ),
    );
    assert.ok(
      ![...generalSection.querySelectorAll("dt")].some(
        (dt) =>
          dt.textContent === { kg: "Окуу жылы", ru: "Учебный год", en: "Academic year" }[lang],
      ),
    );
    const indicatorTitle = {
      kg: "Мектептин көрсөткүчтөрү",
      ru: "Показатели школы",
      en: "School indicators",
    }[lang];
    assert.equal(indicators.querySelector("h2").textContent, indicatorTitle);
    assert.ok(
      headings.indexOf(indicatorTitle) >
        headings.indexOf(
          { kg: "Жалпы маалымат", ru: "Общая информация", en: "General information" }[lang],
        ),
    );
    assert.ok(
      headings.indexOf(indicatorTitle) <
        headings.indexOf({ kg: "ЖРТ жыйынтыктары", ru: "Результаты ОРТ", en: "ORT results" }[lang]),
    );
    assert.deepEqual(
      [...indicators.querySelectorAll("dd")].map((dd) => dd.textContent),
      Array(3).fill({ kg: "Такталууда", ru: "Уточняется", en: "To be confirmed" }[lang]),
    );
    assert.equal(indicators.querySelectorAll("h3").length, 2);
    for (const group of indicators.querySelectorAll("h3"))
      assert.ok(group.classList.contains("font-sans"));
    if (lang === "kg")
      assert.ok(
        indicators.textContent.includes("Бүтүрүүчүлөр") &&
          !indicators.textContent.includes("БҮТҮРҮҮЧҮЛӨР"),
      );
    assert.ok(indicators.textContent.includes("2025-2026"));
    assert.equal(document.querySelectorAll('img[src$="/main.webp"]').length, 1);
    assert.equal(document.querySelectorAll('img[src$="/thumb.webp"][loading="lazy"]').length, 1);
    assert.equal(document.querySelectorAll('img[src$="/image.webp"]').length, 0);
    await act(async () => document.querySelector('button[aria-label$=": 1"]').click());
    await flush();
    assert.equal(document.querySelectorAll('img[src$="/image.webp"]').length, 1);
    assert.ok(document.body.textContent.includes(name));
    assert.ok(document.body.textContent.includes("142"));
    for (const privateValue of [
      "RAW_SCORES_SENTINEL",
      "PRIVATE_NOTE",
      "PRIVATE_UUID",
      "DRAFT_ONLY_NAME",
    ])
      assert.ok(!document.body.textContent.includes(privateValue));
    await mount("nav", lang);
    assert.equal(document.querySelectorAll('a[href="/schools"]').length, 1);
    assert.equal(document.querySelectorAll('header a[href="/schools"]').length, 0);
    for (const link of document.querySelectorAll('a[href="/schools"]'))
      assert.equal(link.textContent.trim(), nav);
    await act(async () => document.querySelector('button[aria-label="Menu"]').click());
    assert.equal(document.querySelectorAll('a[href="/schools"]').length, 1);
    await mount("about", lang);
    assert.equal(document.querySelectorAll('a[href="/schools"]').length, 1);
    assert.ok(
      document
        .querySelector("#education")
        .textContent.includes({ kg: "Мектептер", ru: "Школы", en: "Schools" }[lang]),
    );
    assert.equal(document.querySelectorAll("#social-infrastructure li").length, 7);
  }
  const originalStats = api.rows[0].document.stats;
  api.rows[0].document.stats = [
    {
      academic_year: "2024-2025",
      total_students: 999,
      total_teachers: 999,
      grade11_graduates: 999,
    },
    { academic_year: "2026-2027", total_students: 120, total_teachers: 30, grade11_graduates: 0 },
  ];
  await act(async () => client.invalidateQueries({ queryKey: ["schools", "published"] }));
  await mount("detail", "kg");
  const indicatorSection = () =>
    document.querySelector('section[aria-labelledby="school-indicators-heading"]');
  assert.deepEqual(
    [...indicatorSection().querySelectorAll("dd")].map((dd) => dd.textContent),
    ["120", "0", "30"],
  );
  assert.ok(indicatorSection().textContent.includes("2026-2027"));
  api.rows[0].document.stats = [
    { academic_year: "2025-2026", total_students: 55, total_teachers: 4, grade11_graduates: null },
  ];
  await act(async () => client.invalidateQueries({ queryKey: ["schools", "published"] }));
  await mount("list", "kg");
  await mount("detail", "kg");
  assert.deepEqual(
    [...indicatorSection().querySelectorAll("dd")].map((dd) => dd.textContent),
    ["55", "Такталууда", "4"],
  );
  assert.ok(indicatorSection().textContent.includes("2025-2026"));
  assert.ok(!indicatorSection().textContent.includes("2026-2027"));
  api.rows[0].document.stats = originalStats;
  const originalOrt = api.rows[0].document.ort;
  api.rows[0].document.ort = [];
  for (const lang of ["kg", "ru", "en"]) {
    await act(async () => client.invalidateQueries({ queryKey: ["schools", "published"] }));
    await mount("detail", lang);
    const emptySection = indicatorSection();
    assert.equal(emptySection.querySelectorAll("dd").length, 0);
    const message = {
      kg: "Маалымат азырынча киргизиле элек.",
      ru: "Данные пока не добавлены.",
      en: "No data has been added yet.",
    }[lang];
    assert.ok(emptySection.textContent.includes(message));
    assert.ok(emptySection.nextElementSibling.textContent.includes(message));
    assert.ok(!document.body.textContent.includes("2026-2027"));
  }
  api.rows[0].document.ort = originalOrt;
  const second = structuredClone(api.rows[0]);
  const secondTerritory = TERRITORIES.find((t) => t.slug !== "ylai-talaa" && t.villages.length);
  second.school_id = "SECOND_UUID";
  second.slug = "second-school";
  Object.assign(second.document.info, {
    name_kg: "Second school",
    name_ru: "Second school",
    name_en: "Second school",
    territory_slug: secondTerritory.slug,
    village_slug: secondTerritory.villages[0].slug,
  });
  api.rows.push(second);
  await act(async () => client.invalidateQueries({ queryKey: ["schools", "published"] }));
  await mount("list", "kg");
  assert.equal(document.querySelectorAll('a[href^="/schools/"]').length, 2);
  const [territorySelect, villageSelect] = document.querySelectorAll("select");
  await act(async () => {
    villageSelect.value = "ylai-talaa";
    villageSelect.dispatchEvent(new Event("change", { bubbles: true }));
  });
  assert.equal(document.querySelectorAll('a[href^="/schools/"]').length, 1);
  await act(async () => {
    territorySelect.value = secondTerritory.slug;
    territorySelect.dispatchEvent(new Event("change", { bubbles: true }));
  });
  assert.equal(villageSelect.value, "");
  assert.ok(document.querySelector('a[href="/schools/second-school"]'));
  assert.ok(!document.querySelector('a[href="/schools/published-school"]'));
  await act(async () => {
    const input = document.querySelector('input[type="search"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
      input,
      "not-a-school",
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.equal(document.querySelectorAll('a[href^="/schools/"]').length, 0);
  api.rows.pop();
  window.history.replaceState(null, "", "/about#social-infrastructure");
  await mount("about", "kg");
  assert.equal(document.querySelector("#social-infrastructure").open, true);
  assert.ok(
    document.querySelector("#social-infrastructure").textContent.includes("Башка мекемелер"),
  );
  assert.ok(
    !document.querySelector("#social-infrastructure").textContent.includes("Спорттук объект"),
  );
  window.history.replaceState(null, "", "/schools");
  api.rows[0].document.media = undefined;
  await act(async () => client.invalidateQueries({ queryKey: ["schools", "published"] }));
  await mount("list", "ru");
  assert.equal(document.querySelectorAll('img[src$="/card.webp"]').length, 0);
  await mount("detail", "ru", "draft-school");
  assert.ok(document.body.textContent.includes("Школа не найдена."));
  await mount("list", "ru");
  await act(async () => {
    api.rows[0].is_published = false;
    await client.invalidateQueries({ queryKey: ["schools", "published"] });
  });
  await flush();
  assert.ok(!document.body.textContent.includes("Public RU"));
  await mount("detail", "ru");
  assert.ok(document.body.textContent.includes("Школа не найдена."));
  for (const request of api.requests) {
    assert.equal(request.table, "school_publications");
    assert.ok(request.filters.some(([key, value]) => key === "is_published" && value === true));
  }
  let count = 0;
  const routes = await publishedSchoolRoutes({
    url: "https://fixture.invalid",
    publicKey: "public-test-only",
    fetchImpl: async (url, options) => {
      count++;
      assert.equal(url.pathname, "/rest/v1/school_publications");
      assert.equal(url.searchParams.get("is_published"), "eq.true");
      assert.equal(url.searchParams.get("select"), "slug");
      assert.deepEqual(options.headers, { apikey: "public-test-only" });
      return {
        ok: true,
        json: async () =>
          count === 1
            ? Array.from({ length: 1000 }, () => ({ slug: "published-school" }))
            : [{ slug: "another-school" }, { slug: "../unsafe" }],
      };
    },
  });
  assert.equal(count, 2);
  assert.deepEqual(routes, ["/schools/published-school", "/schools/another-school"]);
  await assert.rejects(() =>
    publishedSchoolRoutes({
      url: "https://fixture.invalid",
      publicKey: "public-test-only",
      fetchImpl: async () => ({ ok: false, status: 403 }),
    }),
  );
  console.log(
    "Public Schools tests passed: KG/RU/EN index/detail, snapshot-only queries, hidden drafts/raw scores/notes/UUID, unpublish refresh, desktop/mobile navigation, safe paginated sitemap enumeration",
  );
} finally {
  await act(async () => root.unmount());
  client.clear();
  dom.window.close();
}
