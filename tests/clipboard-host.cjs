const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('host/clipboard.jsx','utf8');
function test(mode,selected=[2],failSave=false,hasSelection=true){
  const unit=n=>({as:()=>n}),bounds=a=>a.map(unit),trace={};
  const doc={id:10,typename:'Document',width:unit(1000),height:unit(800)};
  doc.activeChannels=['original'];doc.componentChannels=['RGB'];
  doc.selection={copy:merged=>{if(doc.activeLayer!==board&&!selected.length)throw new Error('No active layer');trace.copyMerged=merged;},get bounds(){if(!hasSelection)throw new Error('No selection');return bounds([150,250,210,330]);}};
  const board={id:1,name:'A',typename:'LayerSet',visible:true,parent:doc};
  const layer={id:2,name:'Logo',typename:'ArtLayer',visible:true,parent:board,bounds:bounds([120,230,170,280])};
  const other={id:3,name:'Background',typename:'ArtLayer',visible:true,parent:board,bounds:bounds([100,200,500,700])};
  board.layers=[layer,other];doc.layers=[board];doc.activeLayer=layer;
  const cloned={typename:'LayerSet',visible:true,layers:[{typename:'ArtLayer',visible:true},{typename:'ArtLayer',visible:true}]};
  const copy={id:11,layers:[cloned],mode:'RGB',bitsPerChannel:8,crop:b=>{trace.crop=b.map(v=>v.as('px'));},saveAs:()=>{if(failSave)throw new Error('Disk unavailable');trace.saved=true;},close:()=>{trace.closed=true;}};
  copy.selection={copy:merged=>{if(!selected.length&&merged)throw new Error('Copy Merged unavailable');if(!copy.activeLayer)throw new Error('No active temporary layer');trace.copyMerged=merged;}};copy.paste=()=>{trace.pasted=true;};
  doc.duplicate=(name,merged)=>{trace.fullDuplicate=true;trace.mergedSnapshot=merged;return copy;};
  layer.duplicate=()=>{trace.layerDuplicate=true;return {visible:false,allLocked:true,bounds:bounds([500,600,550,650]),translate:(x,y)=>{trace.offset=[x.as('px'),y.as('px')];}};};
  const documents=[doc];documents.add=(width,height)=>{trace.newSize=[width,height];return copy;};
  function ref(){this.putProperty=()=>{};this.putEnumerated=()=>{};this.putIdentifier=(type,id)=>{this.id=id;};}
  const context={$:{global:{},getenv:()=> 'C:/Windows'},app:{documents,activeDocument:doc,displayDialogs:1},stringIDToTypeID:s=>s,ActionReference:ref,ActionDescriptor:function(){this.putReference=()=>{};},executeAction:name=>{trace.clearedLayers=name==='selectNoLayers';},
    executeActionGet:r=>r.id===undefined?{getList:()=>({count:selected.length,getReference:i=>({getIdentifier:()=>selected[i]})})}:{hasKey:()=>true,getBoolean:()=>true,getObjectValue:()=>({getObjectValue:()=>({getDouble:k=>({left:100,top:200,right:500,bottom:700})[k]})})},
    NewDocumentMode:{RGB:'RGB'},DocumentFill:{TRANSPARENT:'transparent'},ElementPlacement:{PLACEATBEGINNING:0},UnitValue:(n)=>unit(n),DocumentMode:{RGB:'RGB'},BitsPerChannelType:{EIGHT:8},DialogModes:{NO:0},SaveOptions:{DONOTSAVECHANGES:0},Extension:{LOWERCASE:0},Folder:{temp:{fsName:'C:/Temp'}},PNGSaveOptions:function(){},File:function(path){this.fsName=path;this.exists=true;this.remove=()=>{trace.removed=true;};}};
  vm.runInNewContext(code,context);
  const result=JSON.parse(context.$.global.CopyFreedomHost(mode));
  assert.equal(context.app.activeDocument,doc);assert.equal(context.app.displayDialogs,1);
  assert.equal(layer.visible,true);assert.equal(other.visible,true);assert.deepEqual(doc.activeChannels,['original']);
  return {result,trace,cloned};
}
let a=test('layer');assert.equal(a.result.ok,true);assert.deepEqual(a.trace.newSize,[50,50]);assert.deepEqual(a.trace.offset,[-500,-600]);assert.equal(a.trace.layerDuplicate,true);assert.equal(a.trace.fullDuplicate,undefined);assert.equal(a.trace.crop,undefined);assert.equal(a.trace.closed,true);
a=test('canvas');assert.equal(a.result.ok,true);assert.deepEqual(Array.from(a.trace.crop),[100,200,500,700]);assert.equal(a.cloned.layers[1].visible,true);
a=test('area',[]);assert.equal(a.result.ok,true);assert.deepEqual(a.trace.newSize,[60,80]);assert.equal(a.trace.fullDuplicate,undefined);assert.equal(a.trace.copyMerged,true);assert.equal(a.trace.clearedLayers,true);assert.equal(a.trace.pasted,true);assert.equal(a.trace.crop,undefined);
a=test('area',[],false,false);assert.equal(a.result.ok,false);assert.match(a.result.error,/Draw a selection/);assert.equal(a.trace.fullDuplicate,undefined);
a=test('layer',[]);assert.equal(a.result.ok,false);assert.match(a.result.error,/Select an image layer/);assert.equal(a.trace.saved,undefined);
a=test('layer',[2],true);assert.equal(a.result.ok,false);assert.equal(a.trace.closed,true);assert.equal(a.trace.removed,true);
console.log('PASS: plain layer canvas with exact pixel bounds, coordinate correction, exact artboard crop, source preservation, area copy with zero selected layers, empty selection and failed render cleanup');

