(function(){
'use strict';
const native=window.__adobe_cep__,status=document.getElementById('status'),buttons=Array.from(document.querySelectorAll('button'));
let busy=false;
if(!native){status.textContent='Open Copy Freedom inside Photoshop on Windows.';buttons.forEach(b=>b.disabled=true);return;}
const root=decodeURI(native.getSystemPath('extension')).replace(/^file:\/\/\/(?=[A-Za-z]:)/,'').replace(/^file:\/\//,'').replace(/^\/([A-Za-z]:)/,'$1');
function call(expression){return new Promise((resolve,reject)=>native.evalScript('(function(){try{$.evalFile(new File('+JSON.stringify(root+'/host/clipboard.jsx')+'));$.evalFile(new File('+JSON.stringify(root+'/host/layer.jsx')+'));return '+expression+';}catch(e){return JSON.stringify({ok:false,error:e.message});}})()',raw=>{try{const r=JSON.parse(raw);if(!r.ok)throw Error(r.error);resolve(r);}catch(e){reject(Error(e.message==='Unexpected token E in JSON at position 0'?'Photoshop is busy. Finish the current dialog or transform.':e.message));}}));}
function clipboard(result){return new Promise((resolve,reject)=>{
 const fs=window.cep.fs,receipt=result.path+'.json';
 const launched=window.cep.process.createProcess(result.powershell,'-NoProfile','-NonInteractive','-STA','-WindowStyle','Hidden','-ExecutionPolicy','Bypass','-File',root+'/clipboard-image.ps1','-ImagePath',result.path);
 if(launched.err!==0){fs.deleteFile(result.path);reject(Error('Could not start clipboard helper ('+launched.err+').'));return;}
 const started=Date.now();
 function poll(){const read=fs.readFile(receipt);if(read.err===0){fs.deleteFile(receipt);try{const r=JSON.parse(read.data);if(!r.ok)throw Error(r.error);resolve();}catch(e){reject(e);}return;}if(Date.now()-started>20000){reject(Error('Clipboard helper timed out. Windows may have blocked it.'));return;}setTimeout(poll,100);}poll();
});}
async function refresh(){if(busy)return;try{const r=await call('CopyFreedomLayer("snapshot")');if(busy)return;document.getElementById('document').textContent=r.name;document.getElementById('selection').textContent=r.count+' selected';}catch(e){document.getElementById('document').textContent='Open a document in Photoshop';}}
async function run(mode){if(busy)return;if(!window.cep||!window.cep.fs||!window.cep.process){status.textContent='Windows CEP clipboard support is unavailable.';return;}busy=true;buttons.forEach(b=>b.disabled=true);status.textContent='Copying…';try{let plan;if(mode==='areaLayer')plan=await call('CopyFreedomLayer("preview")');await clipboard(await call('CopyFreedomHost('+JSON.stringify(mode==='areaLayer'?'area':mode)+')'));if(plan){try{await call('CopyFreedomLayer("apply",'+JSON.stringify(plan.key)+')');}catch(e){throw Error('Area copied, but new layer failed: '+e.message);}status.textContent='Area copied + masked composite layer created. Ctrl+Z to undo layer.';}else status.textContent='Image copied. Paste into GPT or Flow with Ctrl+V.';}catch(e){status.textContent=e.message;}finally{busy=false;buttons.forEach(b=>b.disabled=false);refresh();}}
buttons.forEach(b=>b.addEventListener('click',()=>run(b.id)));refresh();setInterval(refresh,2000);
})();