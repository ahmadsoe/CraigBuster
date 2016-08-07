chrome.storage.sync.get('doneIds', function(data) {
    $('.content .pl [href]').each(function() {
        if (typeof data.doneIds != "undefined") {
            if ($(this).attr('data-id') in data.doneIds) {
                $('.i' + $(this).attr('data-id')).length == 0 && ($(this).before("<img class='i" + $(this).attr('data-id') + "' src='" + chrome.extension.getURL("check.png") + "' />"));
                $(this).attr("cbdone", "true");
            } else {
                $(this).attr("cbdone", "false");
            }
        } else {
            $(this).attr("cbdone", "false");
        }
    })
});