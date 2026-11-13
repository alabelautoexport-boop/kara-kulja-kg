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
for (const name of ["window", "document", "HTMLElement", "Event", "MouseEvent", "localStorage"])
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const stub = `
  export const requests=[];
  const doc={info:{name_kg:'Public KG',name_ru:'Public RU',name_en:'Public EN',territory_slug:'ylai-talaa',village_slug:'ylai-talaa',current_academic_year:'2026-2027',director_name:'Public director',director_phone:'12345',office_phone:'',address_kg:'Address KG',address_ru:'Address RU',address_en:'Address EN',review_note:'PRIVATE_NOTE'},stats:[],ort:[{year:2026,academic_year:'2025-2026',scores:['RAW_SCORES_SENTINEL'],summary:{participants:3,average:167,median:156,minimum:142,maximum:203,over200:1,distribution:[0,0,1,1,0,0,1]}}],achievements:[],resources:[]};
  export const rows=[{school_id:'PRIVATE_UUID',slug:'published-school',is_published:true,document:doc},{school_id:'hidden',slug:'draft-school',is_published:false,document:{...doc,info:{...doc.info,name_kg:'DRAFT_ONLY_NAME'}}}];
  export const supabase={from(table){if(table!=='school_publications')throw Error('Internal table queried publicly');const filters=[];const request={table,filters};requests.push(request);
    const result=()=>({data:rows.filter(row=>filters.every(([key,value])=>row[key]===value)),error:null});
    const query={select(fields){request.fields=fields;return query;},eq(key,value){filters.push([key,value]);return query;},order(){return query;},then(resolve){return Promise.resolve(result()).then(resolve);},async maybeSingle(){const value=result();return {...value,data:value.data[0]??null};}};return query;}};
`;
const sources = {
  "@/lib/supabase": stub,
  "@tanstack/react-router":
    "import React from 'react';export const Link=({to,params,activeProps,children,...props})=>React.createElement('a',{...props,href:to.replace('$slug',params?.slug??'')},children);",
  "@/components/site/Layout":
    "import React from 'react';export const SiteLayout=({children})=>React.createElement('main',null,children);",
};
const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
    import React,{act}from'react';import{createRoot}from'react-dom/client';
    import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
    import{SchoolsList,SchoolPublicPage}from'./src/components/site/Schools';
    import{Header}from'./src/components/site/Header';import{Footer}from'./src/components/site/Footer';
    import{I18nProvider}from'./src/lib/i18n';import * as api from '@/lib/supabase';
    export {api,act};export const root=createRoot(document.getElementById('root'));
    export const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
    export function render(mode,lang='kg',slug='published-school'){localStorage.setItem('kk-lang',lang);root.render(<QueryClientProvider client={client}><I18nProvider key={lang+mode+slug}>{mode==='list'?<SchoolsList/>:mode==='nav'?<><Header/><Footer/></>:<SchoolPublicPage slug={slug}/>}</I18nProvider></QueryClientProvider>);}
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
const { root, act, api, client, render } = mod.exports;
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
const mount = async (mode, lang = "kg", slug) => {
  await act(async () => render(mode, lang, slug));
  await flush();
};
try {
  for (const [lang, name, more, nav] of [
    ["kg", "Public KG", "Толук маалымат", "Мектептер"],
    ["ru", "Public RU", "Подробнее", "Школы"],
    ["en", "Public EN", "Learn more", "Schools"],
  ]) {
    await mount("list", lang);
    assert.ok(document.body.textContent.includes(name));
    assert.ok(document.body.textContent.includes("Public director"));
    assert.ok(document.body.textContent.includes(more));
    assert.equal(document.querySelectorAll('a[href="/schools/published-school"]').length, 1);
    await mount("detail", lang);
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
    assert.equal(document.querySelectorAll('a[href="/schools"]').length, 2);
    for (const link of document.querySelectorAll('a[href="/schools"]'))
      assert.equal(link.textContent.trim(), nav);
    await act(async () => document.querySelector('button[aria-label="Menu"]').click());
    assert.equal(document.querySelectorAll('a[href="/schools"]').length, 3);
  }
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
