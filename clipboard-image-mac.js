/* Run with macOS /usr/bin/osascript -l JavaScript. No downloads or developer tools. */
ObjC.import('AppKit');
ObjC.import('Foundation');
function run(argv) {
    if (argv.length !== 1) throw Error('Expected one clipboard scratch PNG.');
    var path = String(argv[0]);
    var canonical = $(path).stringByStandardizingPath.stringByResolvingSymlinksInPath;
    var temp = $.NSTemporaryDirectory().stringByStandardizingPath.stringByResolvingSymlinksInPath;
    if (!/^CopyFreedom-clipboard-[\d-]+\.png$/.test(ObjC.unwrap(canonical.lastPathComponent)) ||
        ObjC.unwrap(canonical.stringByDeletingLastPathComponent) !== ObjC.unwrap(temp)) {
        throw Error('Invalid clipboard scratch file.');
    }
    var result;
    try {
        var data = $.NSData.dataWithContentsOfFile(canonical);
        if (!data || !data.length) throw Error('Could not read clipboard PNG.');
        var image = $.NSBitmapImageRep.imageRepWithData(data);
        if (!image) throw Error('Invalid clipboard image.');
        var tiff = image.TIFFRepresentation;
        var item = $.NSPasteboardItem.alloc.init;
        if (!item.setDataForType(data, $('public.png'))) throw Error('Could not prepare PNG clipboard data.');
        if (tiff && !item.setDataForType(tiff, $('public.tiff'))) throw Error('Could not prepare TIFF clipboard data.');
        var board = $.NSPasteboard.generalPasteboard;
        board.clearContents;
        if (!board.writeObjects($([item]))) throw Error('macOS did not accept the clipboard image.');
        result = {ok:true};
    } catch (e) {
        result = {ok:false,error:String(e.message || e)};
    }
    // Only the validated, uniquely named scratch PNG can be removed.
    $.NSFileManager.defaultManager.removeItemAtPathError(canonical, null);
    if (!$(JSON.stringify(result)).writeToFileAtomicallyEncodingError($(path + '.json'), true, $.NSUTF8StringEncoding, null)) {
        throw Error('Could not write clipboard result.');
    }
}
