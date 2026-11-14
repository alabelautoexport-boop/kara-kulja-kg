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
  export{act};export const root=createRoot(document.getElementById('root'));export const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
  export function render(mode,lang='kg'){localStorage.setItem('kk-lang',lang);root.render(<QueryClientProvider client={client}><I18nProvider key={lang}>{mode==='list'?<KindergartensList/>:mode==='detail'?<KindergartenPublicPage slug='garden'/>:<SchoolIdentityFields value={{...EMPTY_SCHOOL_INFO,school_type:'general'}} onChange={()=>{}}/>}</I18nProvider></QueryClientProvider>)}
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
} = mod.exports;
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
const mount = async (mode, lang) => {
  await act(async () => render(mode, lang));
  await flush();
};
try {
  for (const [lang, title, name, address, type] of [
    ["kg", "Бала бакчалар", "Бала бакча KG", "Дарек KG", "Бала бакча"],
    ["ru", "Детские сады", "Сад RU", "Адрес RU", "Детский сад"],
    ["en", "Kindergartens", "Garden EN", "Address EN", "Kindergarten"],
  ]) {
    await mount("list", lang);
    assert.equal(document.querySelector("h1").textContent, title);
    assert.equal(
      document.querySelector('a[href="/kindergartens/garden"] h2').textContent,
      lang === "en" ? "Yryskan apa" : "«Ырыскан апа»",
    );
    assert.ok(
      !document.querySelector('a[href="/kindergartens/garden"]').textContent.includes(name),
    );
    assert.equal(document.querySelectorAll('a[href^="/kindergartens/"]').length, 2);
    assert.ok(!document.body.textContent.includes("HIDDEN_DRAFT"));
    assert.equal(document.querySelectorAll("select").length, 3);
    const typeSelect = document.querySelectorAll("select")[2];
    await act(async () => {
      typeSelect.value = "school_preschool";
      typeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(document.querySelectorAll('a[href^="/kindergartens/"]').length, 1);
    assert.equal(
      document.querySelector('a[href^="/kindergartens/"]').getAttribute("href"),
      "/kindergartens/unit",
    );
    await mount("detail", lang);
    assert.equal(document.querySelector("h1").textContent, name);
    assert.ok(document.body.textContent.includes(address));
    assert.ok(document.body.textContent.includes(type));
    assert.ok(!document.body.textContent.includes("private-id"));
  }
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
    "Institution public UI passed: KG/RU/EN catalogs/details/addresses, type filter, safe snapshot queries, draft exclusion, Admin type options, approved aliases with source preservation, safe sitemap routes",
  );
} finally {
  await act(async () => root.unmount());
  client.clear();
  dom.window.close();
}

// The bundled React scheduler retains MessagePorts after jsdom teardown. All assertions and cleanup completed.
process.exit(0);
