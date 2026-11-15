// SSR -> hydration -> KG/RU/EN using the real public components. No remote writes.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const { JSDOM } = await import(pathToFileURL(process.argv[2]));
const info = {
  name_kg: "Жийде жалпы билим берүү мектеби",
  name_ru: "Общеобразовательная школа Жийде",
  name_en: "Zhiyde General Education School",
  territory_slug: "kara-kochkor",
  village_slug: "zhiyde",
  address_kg: "Жийде айылы, Токтосун Базаров көчөсү, 57а",
  address_ru: "с. Жийде, ул. Токтосун Базаров, 57а",
  address_en: "57a Toktosun Bazarov St., Zhiyde",
  director_name: "",
  director_phone: "",
  office_phone: "",
  current_academic_year: "",
  school_type: "general",
};
const school = {
  school_id: "fixture-school",
  slug: "zhiyde",
  document: {
    info,
    stats: [],
    ort: [],
    achievements: [],
    resources: [],
    media: { cover: null, gallery: [] },
  },
};
const garden = {
  kindergarten_id: "fixture-garden",
  slug: "a-kalmatov-mektep-aldyndagy-bala-bakcha",
  document: {
    info: {
      ...info,
      type: "school_preschool",
      name_kg: "А. Калматов мектеп алдындагы бала бакча",
      name_ru: "Дошкольное отделение при школе А. Калматов",
      name_en: "A. Kalmatov School Preschool Unit",
      territory_slug: "kara-guz",
      village_slug: "kalmatay",
    },
  },
};
const news = {
  id: "fixture-news",
  slug: "published-fixture",
  title_kg: "Жарыяланган кабар",
  title_ru: "Опубликованная новость",
  title_en: "Published news",
  excerpt_kg: "Кабардын кыскача мазмуну.",
  excerpt_ru: "Краткое содержание новости.",
  excerpt_en: "News summary.",
  body_kg: "<p>Кабардын <strong>мазмуну</strong>.</p>",
  body_ru: "<p>Содержание <strong>новости</strong>.</p>",
  body_en: "<p>News <strong>content</strong>.</p>",
  published_at: "2026-11-14T16:00:00Z",
  is_published: true,
  gallery_images: [],
  cover_image: null,
};
const fixtures = { school, garden, news };
const sources = {
  "@/lib/supabase": `export const fixture=${JSON.stringify(fixtures)};export const supabase={from(table){if(!['school_publications','kindergarten_publications','news'].includes(table))throw Error('Private query');const data=table==='school_publications'?fixture.school:table==='kindergarten_publications'?fixture.garden:fixture.news;const q={select(){return q},eq(){return q},not(){return q},order(){return q},async maybeSingle(){return {data,error:null}},then(resolve){return Promise.resolve({data:[data],error:null}).then(resolve)}};return q}};`,
  "@tanstack/react-router":
    "import React from 'react';import{fixture}from'@/lib/supabase';export const Link=({to,params,children,...props})=>React.createElement('a',{...props,href:to.replace('$slug',params?.slug??'')},children);export const notFound=()=>new Error('404');export const createFileRoute=()=>options=>({...options,useParams:()=>({slug:fixture.news.slug}),useLoaderData:()=>fixture.news});",
  "@/components/site/Layout":
    "import React from 'react';export const SiteLayout=({children})=>React.createElement('main',null,children);",
};
const bundled = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
import React,{act}from'react';import{renderToString}from'react-dom/server';import{hydrateRoot}from'react-dom/client';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
import{I18nProvider}from'./src/lib/i18n';import{SchoolPublicPage}from'./src/components/site/Schools';import{KindergartenPublicPage}from'./src/components/site/Kindergartens';import{Route as NewsRoute}from'./src/routes/news_.$slug';import{fixture}from'@/lib/supabase';
export{act,renderToString,hydrateRoot};export const client=()=>new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
export const view=(kind,queryClient)=><QueryClientProvider client={queryClient}><I18nProvider>{kind==='school'?<SchoolPublicPage slug={fixture.school.slug} initialData={fixture.school}/>:kind==='garden'?<KindergartenPublicPage slug={fixture.garden.slug} initialData={fixture.garden}/>:<NewsRoute.component/>}</I18nProvider></QueryClientProvider>;
`,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  packages: "external",
  jsx: "automatic",
  loader: { ".jpg": "dataurl" },
  define: { "import.meta.env": "{}" },
  plugins: [
    {
      name: "fixtures",
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
const module = { exports: {} };
new Function("require", "module", "exports", bundled.outputFiles[0].text)(
  createRequire(import.meta.url),
  module,
  module.exports,
);
const { act, renderToString, hydrateRoot, client, view } = module.exports;
const globalNames = [
  "window",
  "document",
  "HTMLElement",
  "Event",
  "MouseEvent",
  "localStorage",
  "MutationObserver",
  "Node",
  "Element",
  "DocumentFragment",
  "CustomEvent",
  "HTMLInputElement",
];
for (const kind of ["school", "garden", "news"]) {
  for (const name of globalNames) delete globalThis[name];
  const serverClient = client(),
    html = renderToString(view(kind, serverClient));
  serverClient.clear();
  assert.ok(
    html.includes(
      kind === "school" ? info.name_kg : kind === "garden" ? "Апыз Калматов" : news.title_kg,
    ),
  );
  if (kind === "news") assert.ok(html.includes("<strong>мазмуну</strong>"));
  for (const lang of ["kg", "ru", "en"]) {
    const dom = new JSDOM(
      '<html lang="ky"><head><meta name="description" content="initial"/></head><body><div id="root">' +
        html +
        "</div></body></html>",
      { url: "https://kara-kulja.kg/" },
    );
    dom.window.localStorage.setItem("kk-lang", lang);
    for (const name of globalNames)
      Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
    const errors = [],
      browserClient = client();
    let root;
    await act(async () => {
      root = hydrateRoot(document.getElementById("root"), view(kind, browserClient), {
        onRecoverableError: (e) => errors.push(e.message),
      });
      await new Promise((r) => setTimeout(r, 30));
    });
    assert.deepEqual(errors, [], kind + ": hydration mismatch");
    assert.equal(document.documentElement.lang, lang === "kg" ? "ky" : lang);
    const expected =
      kind === "school"
        ? info["name_" + lang]
        : kind === "garden"
          ? {
              kg: "Апыз Калматов мектеп алдындагы бала бакча",
              ru: "Дошкольное отделение при школе им. Апыза Калматова",
              en: "Apyz Kalmatov School Preschool Unit",
            }[lang]
          : news["title_" + lang];
    assert.equal(document.querySelector("h1").textContent, expected);
    assert.equal(document.title, expected + " | Kara-Kulja");
    if (kind !== "news") assert.ok(document.body.textContent.includes(info["address_" + lang]));
    await act(async () => root.unmount());
    browserClient.clear();
    dom.window.close();
  }
}
console.log(
  "SEO hydration tests passed: initial school/garden/news content, safe article HTML, no recoverable hydration errors, KG/RU/EN content and metadata, ky/ru/en language",
);
process.exit(0);
