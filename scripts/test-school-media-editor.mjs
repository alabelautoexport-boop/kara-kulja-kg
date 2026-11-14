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
const dom = new JSDOM('<div id="root"></div>', { url: "http://localhost/school-admin" });
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "Event",
  "MouseEvent",
  "MutationObserver",
  "Node",
  "NodeFilter",
  "Element",
  "DocumentFragment",
  "CustomEvent",
  "localStorage",
])
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
localStorage.setItem("kara-kulja-admin-language", "ru");
const api = `export const saves=[],reviews=[],pending=[],notifications=[];export let hold=false,fail=false,publicationFail=false;let seq=5;
export const setHold=value=>hold=value;export const setFail=value=>fail=value;
export const setPublicationFail=value=>publicationFail=value;
export function image(kind,n){const id='00000000-0000-4000-8000-'+String(n).padStart(12,'0');const prefix='schools/11111111-1111-4111-8111-111111111111/'+kind+'/'+id+'/';return{asset_id:id,kind,main_key:prefix+(kind==='cover'?'main':'image')+'.webp',thumb_key:prefix+(kind==='cover'?'card':'thumb')+'.webp',width:800,height:600,thumb_width:400,thumb_height:300};}
export async function uploadSchoolImage(id,kind){if(hold)await new Promise(resolve=>pending.push(resolve));if(fail)throw Error('Upload failed');return image(kind,++seq);}
export async function previewSchoolImage(){return new Blob(['fixture'],{type:'image/webp'});}
export async function optimizeSchoolImage(){return{main:new File(['x'],'main.webp',{type:'image/webp'}),thumb:new File(['x'],'thumb.webp',{type:'image/webp'})};}
export async function saveSchoolDraft(id,revision,draft,submit){saves.push({draft,submit});}
export async function reviewSchool(...args){reviews.push(args);if(publicationFail)throw Error('Не удалось опубликовать фотографии школы. Предыдущая опубликованная версия сохранена. Повторите попытку.');}
export async function manageSchoolAccess(){return{account:null};}
export async function archiveSchool(){}export async function permanentlyDeleteSchool(){}`;
const result = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
 import React,{act}from'react';import{createRoot}from'react-dom/client';import{SchoolForm}from'./src/components/admin/SchoolForm';import{setAdminLocale}from'./src/lib/admin-i18n';import * as api from '@/lib/school-media';export{act,api,setAdminLocale};
 export const root=createRoot(document.getElementById('root'));let generation=0;
 export function render(admin=false,count=2){const info={slug:'school',name_kg:'School',name_ru:'',name_en:'',territory_slug:'ylai-talaa',village_slug:'ylai-talaa',director_name:'',director_phone:'',office_phone:'',address_kg:'',address_ru:'',address_en:'',current_academic_year:'2026-2027'};root.render(<SchoolForm key={++generation} admin={admin} record={{...info,id:'11111111-1111-4111-8111-111111111111',revision:0,status:admin?'review':'draft',review_note:null}} initial={{info,ort:[],stats:[],achievements:[],resources:[],media:{cover:api.image('cover',1),gallery:Array.from({length:count},(_,i)=>api.image('gallery',i+2))}}} onSaved={async(message)=>{api.notifications.push(message)}}/>);}
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
      name: "isolate",
      setup(plugin) {
        plugin.onResolve(
          {
            filter:
              /^@\/lib\/(school-media|school-image-optimizer|schools-data|school-editor-access)$/,
          },
          () => ({ path: "api", namespace: "fixture" }),
        );
        plugin.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: api,
          loader: "js",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const mod = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(
  createRequire(import.meta.url),
  mod,
  mod.exports,
);
const { root, act, api: service, render, setAdminLocale } = mod.exports;
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 15));
  });
const mount = async (admin = false, count = 2) => {
  await act(async () => render(admin, count));
  await flush();
};
const buttons = (text) =>
  [...document.querySelectorAll("button")].filter((b) => b.textContent === text);
const click = async (text, index = 0) => {
  await act(async () => buttons(text)[index].click());
  await flush();
};
const file = async (label, count = 1) => {
  const input = document.querySelector('input[aria-label="' + label + '"]');
  Object.defineProperty(input, "files", {
    configurable: true,
    value: Array.from(
      { length: count },
      () => new File(["fixture"], "private-original.jpg", { type: "image/jpeg" }),
    ),
  });
  await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
  await flush();
};
try {
  await mount();
  service.setHold(true);
  await file("Загрузить главное фото");
  assert.ok(buttons("Отправить на проверку")[0].matches(":disabled"));
  assert.equal(service.saves.length, 0);
  await act(async () => {
    service.setHold(false);
    service.pending.shift()();
  });
  await flush();
  await click("Сохранить черновик");
  assert.notEqual(service.saves.at(-1).draft.media.cover, service.image("cover", 1).asset_id);
  const first = service.saves.at(-1).draft.media.cover;
  await file("Загрузить главное фото");
  await click("Сохранить черновик");
  assert.notEqual(service.saves.at(-1).draft.media.cover, first);
  await file("Добавить фотографии");
  await click("Сохранить черновик");
  assert.equal(service.saves.at(-1).draft.media.gallery.length, 3);
  const before = service.saves.at(-1).draft.media.gallery;
  await click("Позже");
  await click("Сохранить черновик");
  assert.deepEqual(service.saves.at(-1).draft.media.gallery, [before[1], before[0], before[2]]);
  await click("Удалить из черновика", 1);
  await click("Сохранить черновик");
  assert.equal(service.saves.at(-1).draft.media.gallery.length, 2);
  const saved = service.saves.at(-1).draft.media;
  service.setFail(true);
  await file("Загрузить главное фото");
  await click("Сохранить черновик");
  assert.deepEqual(service.saves.at(-1).draft.media, saved);
  service.setFail(false);
  await mount(false, 15);
  assert.ok(document.querySelector('input[aria-label="Добавить фотографии"]').disabled);
  await act(async () => setAdminLocale("kg"));
  assert.ok(document.body.textContent.includes("Мектептин негизги сүрөтү"));
  await act(async () => setAdminLocale("ru"));
  await mount(true);
  assert.equal(document.querySelectorAll('input[type="file"]').length, 0);
  assert.ok(document.querySelectorAll("img").length >= 3);
  await click("Опубликовать");
  assert.equal(service.reviews.at(-1)[2], "publish");
  assert.equal(service.reviews.at(-1)[4], true);
  await click("Вернуть на исправление");
  assert.equal(service.reviews.at(-1)[2], "return");
  service.setPublicationFail(true);
  const notifications = service.notifications.length;
  await click("Опубликовать");
  assert.ok(
    document
      .querySelector('[role="alert"]')
      .textContent.includes("Предыдущая опубликованная версия сохранена"),
  );
  assert.equal(service.notifications.length, notifications);
  await act(async () => setAdminLocale("kg"));
  await click("Жарыялоо");
  assert.ok(
    document
      .querySelector('[role="alert"]')
      .textContent.includes("Мурунку жарыяланган версия сакталды"),
  );
  assert.equal(service.notifications.length, notifications);
  console.log(
    "School media React tests passed: upload/replace, gallery add/remove/reorder/limit, pending submit lock, failure preserves selection, KG copy and read-only Admin publish/return",
  );
} finally {
  await act(async () => root.unmount());
  dom.window.close();
}
