const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('clipboard-image-mac.js','utf8');
function test(input='/tmp/CopyFreedom-clipboard-123-456.png',failure=''){
 const trace={formats:[]};
 function wrap(value){return {value,get stringByStandardizingPath(){return this;},get stringByResolvingSymlinksInPath(){return this;},get lastPathComponent(){return wrap(value.split('/').pop());},get stringByDeletingLastPathComponent(){return wrap(value.slice(0,value.lastIndexOf('/')));},writeToFileAtomicallyEncodingError:(p)=>{trace.receipt=p.value;trace.result=JSON.parse(value);return true;}};}
 const $=value=>wrap(value);$.NSTemporaryDirectory=()=>wrap('/tmp');$.NSUTF8StringEncoding=4;
 $.NSData={dataWithContentsOfFile:()=>failure==='read'?null:{length:16}};
 $.NSBitmapImageRep={imageRepWithData:()=>failure==='image'?null:{TIFFRepresentation:{length:20}}};
 $.NSPasteboardItem={alloc:{init:{setDataForType:(data,type)=>{trace.formats.push(type.value);return failure!=='prepare';}}}};
 $.NSPasteboard={generalPasteboard:{get clearContents(){trace.cleared=true;return 1;},writeObjects:()=>{trace.written=true;return failure!=='write';}}};
 $.NSFileManager={defaultManager:{removeItemAtPathError:p=>{trace.removed=p.value;return true;}}};
 const context={$ ,ObjC:{import:()=>{},unwrap:v=>v.value}};vm.runInNewContext(code,context);let error;try{context.run([input]);}catch(e){error=e;}return {trace,error};
}
let a=test();assert.equal(a.error,undefined);assert.deepEqual(a.trace.formats,['public.png','public.tiff']);assert.equal(a.trace.written,true);assert.equal(a.trace.result.ok,true);assert.equal(a.trace.receipt,'/tmp/CopyFreedom-clipboard-123-456.png.json');assert.equal(a.trace.removed,'/tmp/CopyFreedom-clipboard-123-456.png');
for(const failure of ['read','image','prepare','write']){a=test(undefined,failure);assert.equal(a.trace.result.ok,false);if(failure!=='write')assert.equal(a.trace.cleared,undefined);}
for(const invalid of ['/Users/test/client.png','/Users/test/CopyFreedom-clipboard-123-456.png','/tmp/other.png']){a=test(invalid);assert.ok(a.error);assert.equal(a.trace.removed,undefined);assert.equal(a.trace.receipt,undefined);assert.equal(a.trace.cleared,undefined);}
console.log('PASS: Mac clipboard PNG/TIFF publication, safe temp path validation, preparation errors preserve clipboard, failure receipts and scratch cleanup (platform mocks)');
