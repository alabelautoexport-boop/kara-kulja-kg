// Real React workspace with in-memory APIs and a temporary jsdom installation.
// Never imports a Supabase client or connects to production.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { tmpdir } from "node:os";

const { JSDOM } = await import(
  pathToFileURL(
    process.argv[2] ??
      path.join(tmpdir(), "kara-kulja-schools-ui-tests/node_modules/jsdom/lib/api.js"),
  )
);
const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/admin/schools" });
for (const name of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "MutationObserver",
  "Event",
  "MouseEvent",
  "PopStateEvent",
])
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.confirm = () => true;
dom.window.localStorage.setItem("kara-kulja-admin-language", "ru");
const modelSource = `
  const blank={slug:'school',name_kg:'',name_ru:'',name_en:'',territory_slug:'ylai-talaa',village_slug:'ylai-talaa',current_academic_year:'2026-2027',director_name:'Director',director_phone:'',office_phone:'',address_kg:'',address_ru:'',address_en:''};
  const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
  export const records=ids.map((id,i)=>({...blank,id,name_kg:'School '+(i+1),slug:'school-'+(i+1),status:'draft',revision:0,review_note:null,is_archived:false}));
  export let holdNext=false; export const pending=[];
  export function hold(){holdNext=true;}
  export async function getEditableSchools(){return structuredClone(records);}
  export async function loadSchoolDraft(id){
    const record=structuredClone(records.find(r=>r.id===id));
    const result={record,draft:{info:{...record},ort:[{year:2026,academic_year:'2025-2026',scores:[142,156,203]}],stats:[],achievements:[],resources:[]}};
    if(holdNext){holdNext=false;return new Promise(resolve=>pending.push(()=>resolve(result)));} return result;
  }
  export async function createSchool(name){const id='33333333-3333-4333-8333-333333333333';records.push({...blank,id,name_kg:name,slug:'new-school',status:'draft',revision:0,review_note:null,is_archived:false});return id;}
  export async function saveSchoolDraft(id,revision,draft){const record=records.find(r=>r.id===id);Object.assign(record,draft.info,{revision:record.revision+1,status:'draft',review_note:null});}
  export async function reviewSchool(id,revision,action,note){const record=records.find(r=>r.id===id);Object.assign(record,{revision:record.revision+1,status:action==='publish'?'published':'draft',review_note:action==='return'?note:null});}
  export async function archiveSchool(id,revision,archived){const record=records.find(r=>r.id===id);Object.assign(record,{revision:record.revision+1,is_archived:archived,status:'draft',review_note:null});}
  export async function permanentlyDeleteSchool(id){records.splice(records.findIndex(r=>r.id===id),1);}
`;
const sources = {
  "@/lib/schools-data": modelSource,
  "@/lib/admin-auth":
    "export const getCurrentUser=async()=>({id:'admin'});export const isCurrentUserAdmin=async()=>true;export const logoutAdmin=async()=>{};",
  "@/lib/supabase":
    "export const supabase={auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}};",
  "@tanstack/react-router":
    "import React from 'react';export const Link=({to,children,...props})=>React.createElement('a',{...props,href:to},children);",
};
const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
    import React,{act,useSyncExternalStore} from 'react';import{createRoot}from'react-dom/client';
    import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
    import{SchoolWorkspace}from'./src/components/admin/SchoolWorkspace';
    import * as models from '@/lib/schools-data';export{models,act};
    const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
    const subscribe=(fn)=>{window.addEventListener('popstate',fn);return()=>window.removeEventListener('popstate',fn);};
    function App(){const search=useSyncExternalStore(subscribe,()=>window.location.search);return <QueryClientProvider client={client}><SchoolWorkspace admin adminSchoolId={new URLSearchParams(search).get('school')??undefined} onSelectSchool={id=>{window.history.pushState(null,'',id?'?school='+id:'/admin/schools');window.dispatchEvent(new PopStateEvent('popstate'));}}/></QueryClientProvider>;}
    export const root=createRoot(document.getElementById('root'));export const render=()=>root.render(<App/>);
  `,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  packages: "external",
  plugins: [
    {
      name: "isolated-services",
      setup(plugin) {
        plugin.onResolve(
          { filter: /^(@\/lib\/(schools-data|admin-auth|supabase)|@tanstack\/react-router)$/ },
          (args) => ({ path: args.path, namespace: "fixture" }),
        );
        plugin.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          contents: sources[args.path],
          resolveDir: process.cwd(),
          loader: "js",
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
const { root, act, models, render } = mod.exports;
const flush = async () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 15));
  });
const click = async (label) => {
  const button = [...document.querySelectorAll("button")].find(
    (b) => b.getAttribute("aria-label") === label || b.textContent.trim() === label,
  );
  assert.ok(button, `Missing button: ${label}`);
  assert.ok(!button.disabled, `Disabled: ${label}`);
  await act(async () => button.click());
  await flush();
};
const count = (text) =>
  [...document.querySelectorAll("h2")].filter((el) => el.textContent === text).length;
const listOnly = () => {
  assert.equal(count("Список школ"), 1);
  assert.equal(count("Основное"), 0);
  assert.equal(count("Управление"), 0);
  assert.equal(document.querySelectorAll('input:not([type="search"])').length, 0);
};
const editOnly = () => {
  assert.equal(count("Список школ"), 0);
  assert.equal(count("Основное"), 1);
  assert.equal(count("Управление"), 1);
};
const published = () => {
  editOnly();
  assert.match(document.querySelector("main").textContent, /Опубликовано/);
  assert.ok(!document.querySelector("main").textContent.includes("Черновик"));
};
try {
  await act(async () => render());
  await flush();
  listOnly();
  await click("Открыть: School 1");
  editOnly();
  assert.equal(document.querySelector("h1").textContent, "School 1");
  await click("Опубликовать");
  published();
  await click("К списку школ");
  listOnly();
  assert.equal(window.location.search, "");
  await click("Открыть: School 1");
  published();
  await click("Снять с публикации");
  editOnly();
  assert.match(document.querySelector("main").textContent, /Черновик/);
  await click("Вернуть на исправление");
  assert.match(document.querySelector("main").textContent, /На исправлении/);
  await click("В архив");
  editOnly();
  assert.match(document.querySelector("main").textContent, /В архиве/);
  await click("Восстановить");
  editOnly();
  assert.match(document.querySelector("main").textContent, /Черновик/);
  // A delayed load cannot resurrect the selected workspace after Back to list.
  await click("К списку школ");
  models.hold();
  await click("Открыть: School 2");
  await click("К списку школ");
  listOnly();
  await act(async () => models.pending.shift()());
  await flush();
  listOnly();
  // Same race for a mutation refresh, after its first RPC completed.
  await click("Открыть: School 1");
  models.hold();
  await click("Опубликовать");
  await click("К списку школ");
  listOnly();
  await act(async () => models.pending.shift()());
  await flush();
  listOnly();
  await click("Открыть: School 1");
  published();
  await act(async () => {
    window.history.back();
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
  await flush();
  listOnly();
  await click("Создать школу");
  assert.equal(count("Список школ"), 0);
  assert.equal(count("Основное"), 0);
  assert.equal(document.querySelectorAll("input[required],select[required]").length, 4);
  await click("Отмена");
  listOnly();
  await click("Создать школу");
  const change = async (element, value) => {
    const prototype =
      element.tagName === "SELECT"
        ? dom.window.HTMLSelectElement.prototype
        : dom.window.HTMLInputElement.prototype;
    await act(async () => {
      Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
      element.dispatchEvent(
        new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }),
      );
    });
  };
  const inputFor = (text) =>
    [...document.querySelectorAll("label")]
      .find((label) => label.textContent.includes(text))
      ?.querySelector("input,select");
  await change(inputFor("Название школы KG"), "Created school");
  await change(inputFor("Айыл аймак"), "ylai-talaa");
  await change(inputFor("Село"), "ylai-talaa");
  await change(inputFor("Текущий учебный год"), "2026-2027");
  await click("Создать");
  editOnly();
  assert.equal(document.querySelector("h1").textContent, "Created school");
  await change(inputFor("Название школы KG"), "Saved school");
  await click("Сохранить");
  editOnly();
  assert.equal(document.querySelector("h1").textContent, "Saved school");
  await click("К списку школ");
  listOnly();
  assert.ok(document.body.textContent.includes("Saved school"));
  console.log(
    "React workspace navigation tests passed: list/edit isolation, query clearing, Back, canonical publish/unpublish/return/archive/restore status, delayed-load and mutation races, creation/cancel",
  );
} finally {
  await act(async () => root.unmount());
  dom.window.close();
}
