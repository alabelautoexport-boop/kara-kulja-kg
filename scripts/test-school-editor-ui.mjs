import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { tmpdir } from "node:os";
const { JSDOM } = await import(
  pathToFileURL(path.join(tmpdir(), "kara-kulja-schools-ui-tests/node_modules/jsdom/lib/api.js"))
);
const dom = new JSDOM('<div id="root"></div>', {
  url: "http://localhost:8080/school-admin?schoolId=untrusted-other-school",
});
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
Object.defineProperty(window, "innerWidth", { value: 375, configurable: true });
const source = `
export let account=null,session=false,allowed=true,version=0,status='draft';export const calls=[],saved=[];let callback=()=>{};
export const info={slug:'internal-school-slug',name_kg:'Assigned school',name_ru:'Secret identity RU',name_en:'Secret identity EN',territory_slug:'ylai-talaa',village_slug:'ylai-talaa',director_name:'Director',director_phone:'',office_phone:'',address_kg:'',address_ru:'',address_en:'',current_academic_year:'2026-2027'};
export const setStatus=value=>{status=value;version++;};export const setAllowed=value=>allowed=value;
export const supabase={auth:{onAuthStateChange:fn=>{callback=fn;return{data:{subscription:{unsubscribe(){callback=()=>{}}}}};},signOut:async()=>{session=false;callback('SIGNED_OUT',null);}}};
export async function resolveSchoolEditor(){return{user:session,userId:session?'assigned-user':null,schoolId:session&&allowed?'assigned-school-id':null};}
export async function loginSchoolEditor(name,pin){calls.push({name,pin});if(name!=='zhiyde'||pin!=='12345678')throw Error('generic');session=true;callback('SIGNED_IN',{user:{id:'assigned-user'}});}
export async function loadSchoolDraft(id){if(id!=='assigned-school-id')throw Error('IDOR');return{record:{...info,id,revision:version,status,is_archived:false,review_note:null},draft:{info:{...info},ort:[],stats:[],achievements:[],resources:[]}};}
export async function saveSchoolDraft(id,revision,draft,submit){saved.push({id,draft,submit});version++;if(submit)status='review';}
export async function manageSchoolAccess(id,action,username){calls.push({id,action,username});if(action==='status')return{account};if(action==='create'){account={username,is_active:true};return{username,pin:'12345678'};}if(action==='reset')return{username:account.username,pin:'87654321'};account={...account,is_active:action==='enable'};return{ok:true};}
export async function reviewSchool(){}export async function uploadSchoolImage(){}export async function previewSchoolImage(){};
`;
const result = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `import React,{act}from'react';import{createRoot}from'react-dom/client';import{SchoolEditorWorkspace}from'./src/components/admin/SchoolEditorWorkspace';import{SchoolEditorAccess}from'./src/components/admin/SchoolEditorAccess';import{setAdminLocale}from'./src/lib/admin-i18n';import * as api from '@/lib/school-editor-access';export{act,api,setAdminLocale};export const root=createRoot(document.getElementById('root'));let n=0;export const render=(admin=false)=>root.render(admin?<SchoolEditorAccess key={++n} schoolId='assigned-school-id' slug='zhiyde'/>:<SchoolEditorWorkspace key={++n}/>);`,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  packages: "external",
  plugins: [
    {
      name: "local-fixtures",
      setup(p) {
        p.onResolve(
          { filter: /^@\/lib\/(school-editor-access|schools-data|supabase|school-media)$/ },
          () => ({ path: "api", namespace: "fixture" }),
        );
        p.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents: source,
          loader: "js",
          resolveDir: process.cwd(),
        }));
        p.onResolve({ filter: /^@tanstack\/react-router$/ }, () => ({
          path: "router",
          namespace: "router-fixture",
        }));
        p.onLoad({ filter: /.*/, namespace: "router-fixture" }, () => ({
          contents:
            "import React from 'react';export const Link=({to,children,...p})=>React.createElement('a',{...p,href:to},children);",
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
const { root, act, api, render, setAdminLocale } = mod.exports;
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
const mount = async (admin) => {
  await act(async () => render(admin));
  await flush();
};
const button = (text) =>
  [...document.querySelectorAll("button")].find((b) => b.textContent === text);
const click = async (text) => {
  assert.ok(button(text), text);
  await act(async () => button(text).click());
  await flush();
};
const change = async (input, value) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const submit = async () => {
  await act(async () =>
    document
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  await flush();
};
try {
  await mount(false);
  assert.equal(document.querySelectorAll('input[type="email"]').length, 0);
  assert.ok(document.body.textContent.includes("PIN-код"));
  assert.equal(
    document.querySelector('input[type="password"]').getAttribute("inputmode"),
    "numeric",
  );
  await change(document.querySelector('input[autocomplete="username"]'), "zhiyde");
  await change(document.querySelector('input[type="password"]'), "12345678");
  await submit();
  assert.ok(document.body.textContent.includes("Assigned school"));
  assert.equal(document.querySelectorAll("select").length, 0);
  for (const hidden of [
    "assigned-school-id",
    "internal-school-slug",
    "Secret identity RU",
    "Secret identity EN",
    "Опубликовать",
    "Создать доступ",
    "Панель управления",
  ])
    assert.ok(!document.body.textContent.includes(hidden), hidden);
  await click("Отправить на проверку");
  assert.equal(api.saved.at(-1).id, "assigned-school-id");
  assert.equal(api.saved.at(-1).submit, true);
  assert.ok(document.querySelectorAll("fieldset:disabled").length > 0);
  api.setStatus("draft");
  await act(async () => window.dispatchEvent(new Event("focus")));
  await flush();
  assert.ok(button("Сохранить черновик"));
  assert.equal(button("Отправить на проверку").disabled, false);
  api.setAllowed(false);
  await act(async () => window.dispatchEvent(new Event("focus")));
  await flush();
  assert.ok(document.querySelector('[role="alert"]'));
  assert.ok(!document.body.textContent.includes("Assigned school"));
  await click("Выйти");
  assert.ok(document.querySelector('input[type="password"]'));
  await act(async () => setAdminLocale("kg"));
  assert.ok(button("Кирүү"));
  assert.ok(document.body.textContent.includes("Логин"));
  await act(async () => setAdminLocale("ru"));
  await mount(true);
  assert.equal(document.querySelector("input").value, "zhiyde");
  await submit();
  assert.ok(document.body.textContent.includes("12345678"));
  assert.ok(document.body.textContent.includes("больше не будет показан"));
  assert.ok(!localStorage.getItem("pin"));
  await click("Закрыть");
  assert.ok(!document.body.textContent.includes("12345678"));
  await click("Отключить доступ");
  assert.ok(document.body.textContent.includes("Отключен"));
  await click("Включить доступ");
  assert.ok(document.body.textContent.includes("Активен"));
  await click("Сбросить PIN");
  assert.ok(document.body.textContent.includes("87654321"));
  await mount(true);
  assert.ok(!document.body.textContent.includes("87654321"));
  console.log(
    "School Editor React tests passed: PIN-only KG/RU login, assigned-only resolution ignoring query, hidden identity/Admin controls, review lock/return, revoked access clearing, create/disable/enable/reset and ephemeral PIN",
  );
} finally {
  await act(async () => root.unmount());
  dom.window.close();
}
