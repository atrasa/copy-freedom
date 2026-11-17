/* Run in Photoshop. Creates only a disposable test document; never saves user documents. */
(function(){
 $.evalFile(new File('D:/Reach/codex/Copy Freedom/host/clipboard.jsx'));
 $.evalFile(new File('D:/Reach/codex/Copy Freedom/host/layer.jsx'));
 var previous=app.documents.length?app.activeDocument:null,doc=null,render=null,results=[];
 function parse(raw){return eval('('+raw+')');}
 function check(value,message){if(!value)throw Error(message);}
 function rect(){doc.selection.select([[20,30],[80,30],[80,70],[20,70]]);}
 try{
  doc=app.documents.add(120,100,72,'Copy Freedom disposable QA',NewDocumentMode.RGB,DocumentFill.WHITE);
  var layer=doc.artLayers.add();layer.name='Red';rect();var color=new SolidColor();color.rgb.red=255;color.rgb.green=0;color.rgb.blue=0;doc.selection.fill(color);doc.selection.deselect();
  var modes=['layer','canvas','area'];
  for(var i=0;i<modes.length;i++){
   if(modes[i]==='area')rect();
   var history=doc.activeHistoryState,count=doc.layers.length,reply=parse(CopyFreedomHost(modes[i]));check(reply.ok,reply.error);
   check(app.activeDocument.id===doc.id&&doc.activeHistoryState===history&&doc.layers.length===count,'Source changed');
   render=app.open(new File(reply.path));var w=modes[i]==='canvas'?120:60,h=modes[i]==='canvas'?100:40;
   check(render.width.as('px')===w&&render.height.as('px')===h,'Wrong '+modes[i]+' dimensions');
   render.close(SaveOptions.DONOTSAVECHANGES);render=null;new File(reply.path).remove();results.push(modes[i]+' pixels/source preserved');
  }
  app.activeDocument=doc;rect();var before=doc.activeHistoryState,oldCount=doc.layers.length,anchor=doc.activeLayer.id,plan=parse(CopyFreedomLayer('preview'));check(plan.ok,plan.error);
  check(!parse(CopyFreedomLayer('apply','stale')).ok,'Stale plan accepted');
  var made=parse(CopyFreedomLayer('apply',plan.key));check(made.ok,made.error);check(doc.layers.length===oldCount+1,'Missing new layer');
  check(doc.layers[0].id===doc.activeLayer.id&&doc.layers[1].id===anchor,'Wrong placement');
  var ref=new ActionReference(),s=stringIDToTypeID;ref.putIdentifier(s('layer'),doc.activeLayer.id);check(executeActionGet(ref).getBoolean(s('hasUserMask')),'Missing selection mask');
  var b=doc.activeLayer.bounds;check(b[0].as('px')===20&&b[1].as('px')===30&&b[2].as('px')===80&&b[3].as('px')===70,'Wrong mask bounds');
  doc.activeHistoryState=before;check(doc.layers.length===oldCount,'Undo failed');doc.selection.deselect();check(!parse(CopyFreedomHost('area')).ok,'Missing marquee accepted');
  results.push('masked layer placement, selection bounds, stale rejection and one-step undo');return 'PASS: '+results.join('; ');
 }finally{if(render)render.close(SaveOptions.DONOTSAVECHANGES);if(doc)doc.close(SaveOptions.DONOTSAVECHANGES);if(previous)app.activeDocument=previous;}
})();
