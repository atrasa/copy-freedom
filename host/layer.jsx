/* Independent Copy Freedom helpers. Adds only a new masked composite layer. */
$.global.CopyFreedomLayer=function(action,expected){
 function quote(v){return '"'+String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/[\x00-\x1f]/g,function(c){return '\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4);})+'"';}
 var doc=null,history=null;
 try{
  if(!app.documents.length)throw Error('Open a Photoshop document first.');
  doc=app.activeDocument;var s=stringIDToTypeID,ref=new ActionReference();ref.putProperty(s('property'),s('targetLayersIDs'));ref.putEnumerated(s('document'),s('ordinal'),s('targetEnum'));var ids=executeActionGet(ref).getList(s('targetLayersIDs'));
  if(action==='snapshot')return '{"ok":true,"name":'+quote(doc.name+'  •  '+doc.width.as('px')+' × '+doc.height.as('px')+' px')+',"count":'+ids.count+'}';
  if(action!=='preview'&&action!=='apply')throw Error('Unknown action.');
  if(ids.count>1)throw Error('Select exactly one current layer for the new layer placement.');
  var anchor=doc.activeLayer,r=new ActionReference();r.putIdentifier(s('layer'),anchor.id);var info=executeActionGet(r);
  if(info.hasKey(s('artboardEnabled'))&&info.getBoolean(s('artboardEnabled')))throw Error('Select a layer inside the artboard first.');
  var b;try{b=doc.selection.bounds;}catch(e){throw Error('Draw a selection in Photoshop first.');}
  var key=[doc.id,anchor.id,ids.count,doc.historyStates.length,doc.activeHistoryState.name];for(var i=0;i<4;i++)key.push(b[i].as('px'));key=key.join('|');
  if(action==='preview')return '{"ok":true,"key":'+quote(key)+'}';
  if(expected!==key)throw Error('Document or selection changed. Try again.');
  history=doc.activeHistoryState;
  $.global.CopyFreedomStamp=function(){
   var target=doc.artLayers.add();if(target.id!==doc.layers[0].id)target.move(doc.layers[0],ElementPlacement.PLACEBEFORE);
   var stamp=new ActionDescriptor();stamp.putBoolean(s('duplicate'),true);executeAction(s('mergeVisible'),stamp,DialogModes.NO);doc.activeLayer.name='New Layer on Selected';
   var c=charIDToTypeID,mask=new ActionDescriptor(),channel=new ActionReference();mask.putClass(c('Nw  '),c('Chnl'));channel.putEnumerated(c('Chnl'),c('Chnl'),c('Msk '));mask.putReference(c('At  '),channel);mask.putEnumerated(c('Usng'),c('UsrM'),c('RvlS'));executeAction(c('Mk  '),mask,DialogModes.NO);doc.activeLayer.move(anchor,ElementPlacement.PLACEBEFORE);
  };
  doc.suspendHistory('Copy Freedom — New layer area','CopyFreedomStamp()');return '{"ok":true}';
 }catch(e){if(doc&&history)try{doc.activeHistoryState=history;}catch(ignored){}return '{"ok":false,"error":'+quote(e.message)+'}';}
 finally{$.global.CopyFreedomStamp=undefined;}
};