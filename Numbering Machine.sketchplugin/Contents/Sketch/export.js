SETTINGS_NAME_TO_REPLACE = 'replace';

SETTINGS_TEMPLATE = '0001-[*]';
SETTINGS_PAD_SIZE = 4;
SETTINGS_PAD_STRING = '0';
SETTINGS_NUMBER_FROM = 1;
SETTINGS_NUMBER_TO = 10000;
SETTINGS_NUMBER_STEP = 1;

function onRun(context) {

    var showMessage = context.document.showMessage;

    showMessage("Start Numbering Machine");

    // check selected dashboard

    var selection = context.selection;

    if (selection.count() <= 0) {
        context.document.showMessage("Please select any artboards to proceed");
        return
    }

    // get selected artboards

    var selectionLoop = selection.objectEnumerator();
    var selectedArtboards = NSMutableArray.array();

    while (layer = selectionLoop.nextObject()) {
        if (layer.isMemberOfClass(MSArtboardGroup)) {
            selectedArtboards.addObject(layer);
        } else {
            showMessage("Only artboards allowed to proceed PDF export");
            return
        }
    }

    showMessage("Selected " + selectedArtboards.count() + " artboards");

    // create temporary page

    var tempPage = MSPage.new();
    tempPage.setName("Numbering Machine");
    context.document.documentData().addPage(tempPage);

    // replace text

    var currentNumber = SETTINGS_NUMBER_FROM;
    while(currentNumber <= SETTINGS_NUMBER_TO) {
        showMessage("Generate page #" + currentNumber);
        var replacedArtboards = replaceArtboards(selectedArtboards, currentNumber);
        appendArtboards(tempPage, replacedArtboards);
        currentNumber += SETTINGS_NUMBER_STEP;
    }

    showMessage("Export");

    pageToPDF(tempPage);
    doc.documentData().removePage(tempPage);

    showMessage("Done");
}

function replaceArtboards(selectedArtboards, currentNumber) {
    var replacedArtboards = NSMutableArray.array();

    for(var i = 0; i < selectedArtboards.count(); i++) {
        var artboard = selectedArtboards[i].copy();

        var childrenLoop = artboard.children().objectEnumerator();
        while (child = childrenLoop.nextObject()) {
            if (child.isMemberOfClass(MSTextLayer)) {
                if(child.name() == SETTINGS_NAME_TO_REPLACE) {
                    child.setStringValue(generateNextNumber(currentNumber));
                }
            }
        }

        replacedArtboards.addObject(artboard);
    }

    return replacedArtboards;
}

function appendArtboards(page, artboards) {

    var page_artboards = page.artboards();
    var x = 0;
    var y = 0;
    var distance = 100;

    if (page_artboards.count() > 0) {
        var last_artboard = page_artboards[page_artboards.count()-1];
        x = last_artboard.frame().x() + last_artboard.frame().width() + distance;
    }

    for(var i = 0; i < artboards.count(); i++) {
        var artboard = artboards[i];
        artboard.frame().setX(x);
        artboard.frame().setY(y);

        x += artboard.frame().width() + distance;
    }

    page.addLayers(artboards);
}

function generateNextNumber(number) {
    var next_number = number.toString();
    if(next_number.length < SETTINGS_PAD_SIZE) {
        next_number = new Array(SETTINGS_PAD_SIZE - next_number.length + 1).join(SETTINGS_PAD_STRING) + next_number;
    }

    return SETTINGS_TEMPLATE.replace('[*]', next_number);
}

function pageToPDF(page) {
    var pageArray = [page];
    MSPDFBookExporter.exportPages_defaultFilename(pageArray, page.name() + ".pdf");
}
