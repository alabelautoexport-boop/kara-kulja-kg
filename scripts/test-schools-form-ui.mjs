// Isolated browser fixture: real SchoolForm + translations, in-memory RPC stubs.
// No Supabase client, credentials, Auth or production records are imported.
// Run after build: node scripts/test-schools-form-ui.mjs
import { build } from "esbuild";
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const root = process.cwd();
const stub = `
  export const supabase={functions:{invoke:async()=>({data:null,error:new Error("Fixture")})}};
  export const calls = [];
  export let fail = false;
  export function setFailure(value) { fail = value; }
  export async function saveSchoolDraft(id, revision, draft, submit) {
    if (fail) throw new Error('Недостаточно прав. Войдите заново или обратитесь к администратору.');
    calls.push({id, revision, draft, submit});
  }
  export async function reviewSchool() {}
  export async function archiveSchool() {}
  export async function permanentlyDeleteSchool() {}
`;
const isolatePlugin = {
  name: "isolate-schools-rpc",
  setup(plugin) {
    plugin.onResolve({ filter: /^@\/lib\/(schools-data|supabase)$/ }, () => ({
      path: "schools-stub",
      namespace: "fixture",
    }));
    plugin.onResolve({ filter: /^@\/lib\/territories-data$/ }, () => ({
      path: "territories-stub",
      namespace: "fixture",
    }));
    plugin.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
      contents:
        args.path === "schools-stub"
          ? stub
          : "export const TERRITORIES=[{slug:'ylai-talaa',villages:[{slug:'ylai-talaa'}]}]; export const displayTerritoryName=()=>''; export const displayVillageName=()=>'';",
      loader: "js",
    }));
  },
};
const ssr = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
    import React from 'react'; import { renderToStaticMarkup } from 'react-dom/server';
    import { SchoolForm } from './src/components/admin/SchoolForm';
    import { SchoolIdentityFields } from './src/components/admin/SchoolIdentityFields';
    import { schoolStatus, validSchoolIdentity } from './src/lib/school-admin';
    import { SchoolAdminList, SchoolStatusBadge } from './src/components/admin/SchoolAdminList';
    import { filterSchools } from './src/lib/school-admin';
    const info={slug:'fixture',name_kg:'Fixture',name_ru:'',name_en:'',territory_slug:'',village_slug:'',director_name:'',director_phone:'',office_phone:'',address_kg:'',address_ru:'',address_en:'',current_academic_year:''};
    export const editor=renderToStaticMarkup(<SchoolForm admin={false} record={{...info,id:'fixture',status:'draft',revision:0,review_note:null}} initial={{info,stats:[],ort:[],achievements:[],resources:[]}} onSaved={async()=>{}}/>);
    export const admin=renderToStaticMarkup(<SchoolForm admin={true} record={{...info,id:'fixture',status:'review',revision:0,review_note:null}} initial={{info:{...info,director_name:'Preserved director'},stats:[],ort:[{year:2026,academic_year:'2025-2026',scores:[142,156,203]}],achievements:[],resources:[]}} onSaved={async()=>{}}/>);
    export const creation=renderToStaticMarkup(<SchoolIdentityFields value={info} onChange={()=>{}}/>);
    export const validIdentity=validSchoolIdentity({...info,territory_slug:'ylai-talaa',village_slug:'ylai-talaa',current_academic_year:'2026-2027'});
    export const validWithoutYear=validSchoolIdentity({...info,territory_slug:'ylai-talaa',village_slug:'ylai-talaa',current_academic_year:''});
    export const invalidIdentity=[info,{...info,name_kg:'',current_academic_year:'2026-2027'},{...info,current_academic_year:'invalid'}].map(validSchoolIdentity);
    export const statuses=['draft','review','published'].map(status=>schoolStatus({status,review_note:null}));
    export const returned=schoolStatus({status:'draft',review_note:'Please correct'});
    const schools=['draft','review','published','draft','draft'].map((status,index)=>({...info,id:'private-id-'+index,name_kg:'Школа '+index,status,review_note:index===3?'Correct':null,is_archived:index===4}));
    export const list=renderToStaticMarkup(<SchoolAdminList schools={schools} onOpen={()=>{}} onLifecycleChange={async()=>{}}/>);
    export const badges=schools.map(record=>renderToStaticMarkup(<SchoolStatusBadge record={record}/>));
    export const filters=['all','draft','review','published','archived'].map(filter=>filterSchools(schools,filter,'').map(s=>s.id));
    export const search=filterSchools(schools,'all',' ШКОЛА 2 ').map(s=>s.id);
  `,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  plugins: [isolatePlugin],
});
const rendered = { exports: {} };
new Function("require", "module", "exports", ssr.outputFiles[0].text)(
  createRequire(import.meta.url),
  rendered,
  rendered.exports,
);
for (const html of [rendered.exports.editor, rendered.exports.admin])
  for (const label of ["Основные показатели", "Достижения", "Подготовка к ОРТ"])
    assert.ok(!html.includes(label), label);
for (const label of [
  "Slug",
  "Айыл аймак",
  "Село",
  "Название школы RU",
  "Название школы EN",
  "Проверка и публикация",
])
  assert.ok(!rendered.exports.editor.includes(label), label);
for (const label of [
  "Директор",
  "Рабочий телефон директора",
  "Телефон приёмной",
  "Текущий учебный год",
  "Результаты ОРТ",
  "Сохранить черновик",
  "Отправить на проверку",
])
  assert.ok(rendered.exports.editor.includes(label), label);
assert.ok(rendered.exports.admin.includes("Slug"));
assert.ok(rendered.exports.admin.includes("Проверка и публикация"));
assert.ok(rendered.exports.admin.includes("Ожидает проверки"));
assert.ok(rendered.exports.admin.includes("Preserved director"));
assert.ok(rendered.exports.admin.includes("Посмотреть введённые баллы"));
assert.ok(rendered.exports.admin.includes("142, 156, 203"));
assert.ok(rendered.exports.admin.includes("167")); // Average of the actual scores.
assert.ok(rendered.exports.admin.includes("Медиана"));
assert.ok(rendered.exports.admin.includes("Распределение баллов"));
assert.ok(!rendered.exports.admin.includes("Добавить результаты ОРТ"));
assert.ok(!rendered.exports.admin.includes("Отправить на проверку"));
assert.equal((rendered.exports.admin.match(/<textarea/g) ?? []).length, 1); // Admin note only.
assert.match(rendered.exports.admin, /<details[^>]*>[\s\S]*Дополнительные данные[\s\S]*Slug/);
assert.equal((rendered.exports.creation.match(/required=""/g) ?? []).length, 3);
assert.match(rendered.exports.creation, /Необязательно/);
assert.doesNotMatch(rendered.exports.creation, /placeholder="2026-2027"/);
assert.ok(!rendered.exports.creation.includes("Slug"));
assert.ok(!rendered.exports.creation.includes("Директор"));
assert.equal(rendered.exports.validIdentity, true);
assert.equal(rendered.exports.validWithoutYear, true);
for (const html of [rendered.exports.admin, rendered.exports.editor]) {
  for (const heading of html.matchAll(/<h[234][^>]*class="([^"]*)"/g)) {
    assert.ok(heading[1].includes("font-sans"), heading[0]);
    assert.ok(!heading[1].includes("font-display"), heading[0]);
  }
}
assert.deepEqual(rendered.exports.invalidIdentity, [false, false, false]);
assert.deepEqual(rendered.exports.statuses, ["Черновик", "Ожидает проверки", "Опубликовано"]);
assert.equal(rendered.exports.returned, "На исправлении");
assert.equal((rendered.exports.list.match(/<li /g) ?? []).length, 4);
assert.equal((rendered.exports.list.match(/<h3 /g) ?? []).length, 4);
assert.ok(!rendered.exports.list.includes("Учебный год не указан"));
assert.ok(!rendered.exports.list.includes("Удалить навсегда"));
assert.ok(!rendered.exports.list.includes("<form"));
assert.ok(!rendered.exports.list.includes("private-id-"));
for (const section of ["Основное", "Редактор школы", "Проверка и публикация", "Управление"])
  assert.ok(!rendered.exports.list.includes(`>${section}<`));
for (const [index, label] of [
  "Черновик",
  "Ожидает проверки",
  "Опубликовано",
  "На исправлении",
  "В архиве",
].entries())
  assert.ok(rendered.exports.badges[index].includes(label));
assert.deepEqual(rendered.exports.filters, [
  ["private-id-0", "private-id-1", "private-id-2", "private-id-3"],
  ["private-id-0", "private-id-3"],
  ["private-id-1"],
  ["private-id-2"],
  ["private-id-4"],
]);
assert.deepEqual(rendered.exports.search, ["private-id-2"]);
console.log(
  "School UI tests passed: compact sans-serif working headings, optional academic year with three required creation fields, list/status/filter isolation, read-only Admin ORT and unchanged editor scope",
);
if (!process.argv.includes("--serve")) process.exit(0);
const result = await build({
  stdin: {
    resolveDir: root,
    loader: "tsx",
    contents: `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import { SchoolForm } from './src/components/admin/SchoolForm';
      import { SchoolLifecycleActions } from './src/components/admin/SchoolLifecycleActions';
      import { setAdminLocale, useAdminI18n } from './src/lib/admin-i18n';
      import { calls, setFailure } from '@/lib/schools-data';
      const info = { slug:'isolated-school', name_kg:'Изолированный пример', name_ru:'', name_en:'',
        territory_slug:'', village_slug:'', director_name:'', director_phone:'', office_phone:'',
        address_kg:'', address_ru:'', address_en:'', current_academic_year:'' };
      function Fixture() {
        const { t } = useAdminI18n();
        const [record, setRecord] = useState({id:'isolated-id', ...info, revision:0, status:'draft', review_note:null, is_archived:false});
        const [deleted, setDeleted] = useState(false);
        const [draft, setDraft] = useState({info, stats:[], ort:[], achievements:[], resources:[]});
        const [admin, setAdmin] = useState(false);
        const [notice, setNotice] = useState('');
        const [failure, setFailureState] = useState(false);
        return <main className="mx-auto max-w-[1200px] px-5 py-8">
          <h1>Изолированная проверка SchoolForm</h1>
          <div className="flex gap-4 py-4">
            <button onClick={()=>setAdminLocale('ru')}>Язык RU</button>
            <button onClick={()=>setAdminLocale('kg')}>Язык KG</button>
            <button onClick={()=>{setFailure(!failure);setFailureState(!failure);}}>Сбой RPC: {failure?'да':'нет'}</button>
            <button onClick={()=>setAdmin(!admin)}>Режим: {admin?'Admin':'School Editor'}</button>
          </div>
          <p role="status">{t(notice)}</p>
          <output>RPC: {calls.length}; revision: {record.revision}; status: {record.status}</output>
          <pre className="overflow-auto" data-testid="payload">{JSON.stringify(calls.at(-1)?.draft ?? null)}</pre>
          {!deleted && <SchoolForm key={record.revision} record={record} initial={draft} admin={admin} onSaved={async (message)=>{
            const last = calls.at(-1);
            setDraft({...draft,...last.draft});
            setRecord({...record, revision:record.revision+1, status:last.submit?'review':'draft'});
            setNotice(message);
          }}/>}
          {!deleted && admin && <SchoolLifecycleActions key={'lifecycle-'+record.revision} record={record} onChanged={async (removed,message)=>{
            setDeleted(removed); setNotice(message);
            setRecord({...record, is_archived:!record.is_archived, revision:record.revision+1, status:'draft'});
          }}/>}
        </main>;
      }
      createRoot(document.getElementById('root')).render(<Fixture/>);
    `,
  },
  bundle: true,
  write: false,
  format: "esm",
  jsx: "automatic",
  plugins: [
    {
      name: "isolate-schools-rpc",
      setup(plugin) {
        plugin.onResolve({ filter: /^@\/lib\/(schools-data|supabase)$/ }, () => ({
          path: "schools-stub",
          namespace: "fixture",
        }));
        plugin.onResolve({ filter: /^@\/lib\/territories-data$/ }, () => ({
          path: "territories-stub",
          namespace: "fixture",
        }));
        plugin.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          contents:
            args.path === "schools-stub"
              ? stub
              : "export const TERRITORIES=[{slug:'ylai-talaa',villages:[{slug:'ylai-talaa'}]}]; export const displayTerritoryName=()=>''; export const displayVillageName=()=>'';",
          loader: "js",
        }));
      },
    },
  ],
});
const css = fs.readdirSync("dist/assets").find((file) => /^styles-.*\.css$/.test(file));
if (!css) throw new Error("Run npm.cmd run build first");
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/${css}"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`;
createServer((req, res) => {
  if (req.url === "/fixture.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(result.outputFiles[0].text);
    return;
  }
  if (req.url?.startsWith("/assets/")) {
    const file = path.resolve(root, "dist", `.${req.url}`);
    if (!file.startsWith(path.join(root, "dist", "assets") + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    if (file.endsWith(".css")) res.setHeader("Content-Type", "text/css");
    res.end(fs.readFileSync(file));
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}).listen(8082, "127.0.0.1", () =>
  console.log("Isolated Schools form fixture: http://127.0.0.1:8082 (no remote database)"),
);
