var selectedFiles = [];
var filenames = [];

function removefile(event) {
    fileID = event.target.id.slice(1);
    selectedFiles[fileID] = "";
    filenames[fileID] = "";
    $("#e" + fileID).remove();
}

function prepareUpload(event) {
    files = event.target.files;
    currentFile = 0;
    x = selectedFiles.length;
    for (var i = x; i < files.length + x; i++) {
        $("#submittedfiles").append("<span id='e" + i + "'>" + files[currentFile].name + " <span id='f" + i + "'>X</span><br /></span>");
        $("#f" + i).on('click', removefile);
        selectedFiles[i] = URL.createObjectURL(files[currentFile]);
        filenames[i] = files[currentFile].name;
        currentFile++;
    }
}

function sendData(event) {
    $("#loading").show();
    chrome.runtime.sendMessage({
        selectedFiles: selectedFiles,
        filenames: filenames,
        template: tinyMCE.activeEditor.getContent()
    });
}

function saveData(event) {
    dataObj = {};
    dataObj[event.target.id + 'template'] = tinyMCE.activeEditor.getContent();
    chrome.storage.sync.set(dataObj, function() {});
}

function loadData(event) {
    chrome.storage.sync.get(event.target.id + 'template', function(data) {
        tinyMCE.activeEditor.setContent(data[event.target.id + 'template']);
    });
}

chrome.runtime.onMessage.addListener(function(data) {
    if (typeof data.filesReceived !== "undefined") {
        delete data;
        $("#progress").html("Files ready.");
        setTimeout(function() {
            window.close();
        }, 250);
    }
})

$('#upload').on('change', prepareUpload);
$('#run').on('click', sendData);
$('.save').on('click', saveData);
$('.load').on('click', loadData);