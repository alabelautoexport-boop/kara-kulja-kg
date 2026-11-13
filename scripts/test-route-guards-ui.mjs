// Real React guards and cache, with an in-memory Auth/RPC adapter. No network SDK.
import { build } from "esbuild";
import { createServer } from "node:http";
const rpc = `
  let role='news'; const listeners=new Set();
  const id=()=>role==='anonymous'?null:role==='disabled'?'news':role;
  export function setRole(value) { role=value; for(const listener of listeners) listener('TOKEN_REFRESHED',id()?{user:{id:id()}}:null); }
  export const supabase={
    auth:{getUser:async()=>({data:{user:id()?{id:id()}:null},error:null}),getSession:async()=>({data:{session:null},error:null}),
      onAuthStateChange:(listener)=>{listeners.add(listener);return {data:{subscription:{unsubscribe:()=>listeners.delete(listener)}}};},
      signOut:async()=>{setRole('anonymous');return {error:null};}},
    rpc:async(name)=>({data:name==='is_admin'?role==='admin':name==='can_manage_news'?(role==='news'||role==='admin'):false,error:null}),
    from:()=>({select:()=>({limit:async()=>({data:role==='school'||role==='admin'?[{id:'fixture-school'}]:[],error:null})})}),
    functions:{invoke:async()=>({data:null,error:new Error('Fixture never logs in')})}
  };
`;
const result = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
  import React,{useState} from 'react';import{createRoot}from'react-dom/client';
  import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
  import{AdminGuard}from'./src/components/admin/AdminGuard';
  import{EditorAreaGuard}from'./src/components/admin/EditorAreaGuard';
  import{setRole}from'@/lib/supabase';
  const client=new QueryClient();
  function Fixture(){const[role,update]=useState('news');return <>
    <h1>Isolated route authorization</h1>
    {['admin','news','school','disabled','anonymous'].map(value=><button key={value} onClick={()=>{setRole(value);update(value);}}>{value}</button>)}
    <p>Role: {role}</p>
    <h2>Main Admin</h2><AdminGuard><p>ADMIN PRIVATE CONTENT</p></AdminGuard>
    <h2>News area</h2><EditorAreaGuard area="news"><p>NEWS PRIVATE CONTENT</p></EditorAreaGuard>
    <h2>School area</h2><EditorAreaGuard area="school">{role==='anonymous'?<p>School login only</p>:<p>SCHOOL PRIVATE CONTENT</p>}</EditorAreaGuard>
  </>;}
  createRoot(document.getElementById('root')).render(<QueryClientProvider client={client}><Fixture/></QueryClientProvider>);
`,
  },
  bundle: true,
  write: false,
  format: "esm",
  jsx: "automatic",
  plugins: [
    {
      name: "local-auth-only",
      setup(plugin) {
        plugin.onResolve({ filter: /^@\/lib\/supabase$/ }, () => ({
          path: "auth-stub",
          namespace: "fixture",
        }));
        plugin.onResolve({ filter: /^@tanstack\/react-router$/ }, () => ({
          path: "router-stub",
          namespace: "fixture",
        }));
        plugin.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          resolveDir: process.cwd(),
          loader: "js",
          contents:
            args.path === "auth-stub"
              ? rpc
              : `import React from 'react';const navigate=async()=>{};export const useNavigate=()=>navigate;export const Link=({to,children,...props})=>React.createElement('a',{href:to,...props},children);`,
        }));
      },
    },
  ],
});
createServer((req, res) => {
  res.setHeader(
    "Content-Type",
    req.url === "/fixture.js" ? "text/javascript" : "text/html; charset=utf-8",
  );
  res.end(
    req.url === "/fixture.js"
      ? result.outputFiles[0].text
      : '<!doctype html><html><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
  );
}).listen(8083, "127.0.0.1", () =>
  console.log(
    "Isolated route guards: http://127.0.0.1:8083. No Supabase client or production requests.",
  ),
);
