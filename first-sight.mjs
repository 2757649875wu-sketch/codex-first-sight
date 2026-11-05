import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const html=await fs.readFile(path.join(dir,'夜景微笑戒指-启动动画预览.html'),'utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
const body=html.match(/<body[^>]*>([\s\S]*?)<script>/)[1];
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let page;
for(let i=0;i<200;i++){
 try {
  const pages=await fetch('http://127.0.0.1:9335/json/list',{signal:AbortSignal.timeout(500)}).then(r=>r.json());
  page=pages.find(p=>p.type==='page' && p.url==='app://-/index.html');
  if(page)break;
 }catch{}
 await wait(100);
}
if(!page)throw Error('Codex main window interface unavailable');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
let sequence=0;
const pending=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
function call(method,params){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
try {
 // A listed target can still be navigating during a cold start.
 let ready=false;
 for(let attempt=0;attempt<150;attempt++){
  try {
   const status=await call('Runtime.evaluate',{expression:"document.readyState === 'complete' && !!document.body && document.body.children.length > 0",returnByValue:true});
   if(status.result?.value===true){ready=true;break;}
  }catch{}
  await wait(200);
 }
 if(!ready)throw Error('Codex document did not become ready');
 const runtime=await call('Runtime.evaluate',{expression:`(()=>{
 const realDocument=globalThis.document;
 if(realDocument.getElementById('first-sight-host'))return 'already playing';
 const host=realDocument.createElement('div');host.id='first-sight-host';
 globalThis.__firstSightResult=null;
 setTimeout(()=>{if(host.isConnected){host.remove();globalThis.__firstSightResult={state:'timeout'};}},25000);
 host.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#08060d;overflow:hidden';
 realDocument.documentElement.append(host);
 const shadow=host.attachShadow({mode:'open'});
 const shell=realDocument.createElement('div');shell.className='native';
 shell.innerHTML=${JSON.stringify(body)};
 const style=realDocument.createElement('style');
 style.textContent=${JSON.stringify(css)}+' :host{display:block} .native,.preview,.window{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;padding:0!important;border:0!important;border-radius:0!important}.preview-heading,.controls,.preview-note,.traffic,#image-settings,.end-screen{display:none!important}.scene{transform:none!important}.artwork{transform:none!important;filter:none!important}';
 shadow.append(style,shell);
 const document=new Proxy(realDocument,{get(t,k){
  if(k==='body')return shell;if(k==='title')return '';
  if(k==='querySelector'||k==='querySelectorAll')return shadow[k].bind(shadow);
  const v=t[k];return typeof v==='function'?v.bind(t):v;
 },set(t,k,v){if(k==='title')return true;return Reflect.set(t,k,v)}});
 ${scripts[0]}
 ${scripts[1]}
 ${scripts[2]}
 return 'playing';
 })()`,returnByValue:true});
 if(runtime.exceptionDetails)throw Error(runtime.exceptionDetails.text+': '+runtime.exceptionDetails.exception?.description);
 console.log(JSON.stringify(runtime.result));
 await wait(17000);
 const result=await call('Runtime.evaluate',{expression:"JSON.stringify(window.__firstSightResult||{state:'not-finished'})",returnByValue:true});
 console.log(result.result.value);
}finally{ws.close();}
