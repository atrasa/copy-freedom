/* Render browser clipboard pixels in temporary documents; never edit the source. */
$.global.CopyFreedomHost = function(mode) {
    function quote(s){return '"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/[\x00-\x1f]/g,function(c){return '\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4);})+'"';}
    var source=null,copy=null,dialogs=app.displayDialogs,file=null;
    try {
        if(!app.documents.length)throw new Error('Open a Photoshop document first.');
        if(mode!=='layer'&&mode!=='canvas'&&mode!=='area')throw new Error('Choose layer, area or canvas.');
        source=app.activeDocument;
        var s=stringIDToTypeID,ref=new ActionReference(),ids=[],i;
        if(mode!=='area'){
            ref.putProperty(s('property'),s('targetLayersIDs'));ref.putEnumerated(s('document'),s('ordinal'),s('targetEnum'));
            var list=executeActionGet(ref).getList(s('targetLayersIDs'));
            for(i=0;i<list.count;i++)ids.push(list.getReference(i).getIdentifier());
        }
        if(mode==='layer'&&!ids.length)throw new Error('Select an image layer first.');
        function artboard(layer){
            while(layer&&layer.typename!=='Document'){
                if(layer.typename==='LayerSet'){
                    var r=new ActionReference();r.putIdentifier(s('layer'),layer.id);var d=executeActionGet(r);
                    if(d.hasKey(s('artboardEnabled'))&&d.getBoolean(s('artboardEnabled'))){
                        var b=d.getObjectValue(s('artboard')).getObjectValue(s('artboardRect'));
                        function n(k){try{return b.getDouble(s(k));}catch(e){return b.getUnitDoubleValue(s(k));}}
                        return [n('left'),n('top'),n('right'),n('bottom')];
                    }
                }
                layer=layer.parent;
            }
            return null;
        }
        var roots=[],paths=[],bounds=null,board=null;
        function collect(layers,path,covered){for(var j=0;j<layers.length;j++){
            var l=layers[j],p=path?path+'/'+j:String(j),picked=false;
            for(var k=0;k<ids.length;k++)if(l.id===ids[k])picked=true;
            if(picked&&!covered){roots.push(l);paths.push(p);}
            if(l.typename==='LayerSet')collect(l.layers,p,covered||picked);
        }}
        collect(source.layers,'',false);
        function keepsClippingBase(layer){
            if(!layer.grouped)return true;
            var siblings=layer.parent.layers,index=0;
            for(var j=0;j<siblings.length;j++)if(siblings[j].id===layer.id)index=j;
            while(++index<siblings.length){
                if(siblings[index].grouped)continue;
                for(var k=0;k<roots.length;k++)if(roots[k].id===siblings[index].id)return true;
                return false;
            }
            return false;
        }
        if(mode==='layer'){
            for(i=0;i<roots.length;i++){
                if(artboard(roots[i])&&roots[i].typename==='LayerSet'){
                    var check=new ActionReference();check.putIdentifier(s('layer'),roots[i].id);var desc=executeActionGet(check);
                    if(desc.hasKey(s('artboardEnabled'))&&desc.getBoolean(s('artboardEnabled')))throw new Error('Use Copy artboard / canvas for an artboard.');
                }
                var b=roots[i].bounds,r=[b[0].as('px'),b[1].as('px'),b[2].as('px'),b[3].as('px')];
                if(!bounds)bounds=r;else{bounds[0]=Math.min(bounds[0],r[0]);bounds[1]=Math.min(bounds[1],r[1]);bounds[2]=Math.max(bounds[2],r[2]);bounds[3]=Math.max(bounds[3],r[3]);}
            }
            if(!bounds||bounds[2]<=bounds[0]||bounds[3]<=bounds[1])throw new Error('Selected layers have no image pixels.');
        }else if(mode==='area'){
            try{var selectedBounds=source.selection.bounds;bounds=[];for(i=0;i<4;i++)bounds.push(selectedBounds[i].as('px'));}
            catch(noSelection){throw new Error('Draw a selection in Photoshop first.');}
            if(bounds[2]<=bounds[0]||bounds[3]<=bounds[1])throw new Error('Draw a selection with a visible area first.');
        }else{
            board=artboard(source.activeLayer);
            for(i=0;i<roots.length;i++){
                var other=artboard(roots[i]);
                if(String(other)!==String(board))throw new Error('Select layers in one artboard to copy that artboard.');
            }
            bounds=board||[0,0,source.width.as('px'),source.height.as('px')];
        }
        app.displayDialogs=DialogModes.NO;
        if(mode==='layer'){
            // A plain document avoids Photoshop retaining the artboard canvas after crop.
            var left=Math.floor(bounds[0]),top=Math.floor(bounds[1]);
            copy=app.documents.add(Math.ceil(bounds[2])-left,Math.ceil(bounds[3])-top,source.resolution,'Copy Freedom temporary',NewDocumentMode.RGB,DocumentFill.TRANSPARENT);
            for(i=roots.length-1;i>=0;i--){
                app.activeDocument=source;
                var original=roots[i].bounds,keepClip=keepsClippingBase(roots[i]),placed=roots[i].duplicate(copy,ElementPlacement.PLACEATBEGINNING);
                app.activeDocument=copy;if(!placed.visible)placed.visible=true;if(placed.allLocked)placed.allLocked=false;
                // A clipped layer without its selected base disappears against the empty scratch layer.
                if(placed.grouped&&!keepClip)placed.grouped=false;
                try{if(placed.positionLocked)placed.positionLocked=false;}catch(unused){}
                var current=placed.bounds;
                var dx=original[0].as('px')-left-current[0].as('px'),dy=original[1].as('px')-top-current[1].as('px');
                // Refresh the Smart Object even at zero offset so Smart Filter pixels remain accurate.
                placed.translate(UnitValue(dx,'px'),UnitValue(dy,'px'));
            }
        }else if(mode==='area'){
            // Duplicating a document drops its marquee. Copy the source composite instead.
            var selectionRef=new ActionReference();selectionRef.putProperty(s('property'),s('targetLayersIDs'));selectionRef.putEnumerated(s('document'),s('ordinal'),s('targetEnum'));
            var originalLayers=executeActionGet(selectionRef).getList(s('targetLayersIDs')),channels=source.activeChannels,temporaryLayer=false;
            try{
                if(!originalLayers.count){source.activeLayer=source.layers[0];temporaryLayer=true;}
                source.activeChannels=source.componentChannels;
                source.selection.copy(true);
            }finally{
                source.activeChannels=channels;
                if(temporaryLayer){var clear=new ActionDescriptor(),target=new ActionReference();target.putEnumerated(s('layer'),s('ordinal'),s('targetEnum'));clear.putReference(s('null'),target);executeAction(s('selectNoLayers'),clear,DialogModes.NO);}
            }
            copy=app.documents.add(Math.ceil(bounds[2])-Math.floor(bounds[0]),Math.ceil(bounds[3])-Math.floor(bounds[1]),source.resolution,'Copy Freedom temporary',NewDocumentMode.RGB,DocumentFill.TRANSPARENT);
            copy.paste();
        }else{
            copy=source.duplicate('Copy Freedom temporary',false);
            copy.crop([UnitValue(Math.floor(bounds[0]),'px'),UnitValue(Math.floor(bounds[1]),'px'),UnitValue(Math.ceil(bounds[2]),'px'),UnitValue(Math.ceil(bounds[3]),'px')]);
        }
        if(copy.mode!==DocumentMode.RGB)copy.changeMode(ChangeMode.RGB);
        if(copy.bitsPerChannel!==BitsPerChannelType.EIGHT)copy.bitsPerChannel=BitsPerChannelType.EIGHT;
        file=new File(Folder.temp.fsName+'/CopyFreedom-clipboard-'+new Date().getTime()+'-'+Math.floor(Math.random()*1000000000)+'.png');
        var options=new PNGSaveOptions();options.compression=0;copy.saveAs(file,options,true,Extension.LOWERCASE);
        return '{"ok":true,"path":'+quote(file.fsName)+',"powershell":'+quote($.getenv('SystemRoot')+'/System32/WindowsPowerShell/v1.0/powershell.exe')+'}';
    }catch(e){if(file&&file.exists)file.remove();return '{"ok":false,"error":'+quote(e.message)+'}';}
    finally{if(copy)try{copy.close(SaveOptions.DONOTSAVECHANGES);}catch(ignored){}app.displayDialogs=dialogs;if(source&&app.activeDocument.id!==source.id)app.activeDocument=source;}
};
