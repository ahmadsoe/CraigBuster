var checkIt = setInterval(function() {
    if (document.getElementsByClassName('gmail').length > 0 && document.getElementsByClassName('js-only').length == 0) {
        clearInterval(checkIt)
        chrome.runtime.sendMessage({
            solved_email: document.getElementsByClassName('gmail')[0].href.replace(/amp;/g, ''),
            req: true
        });
    }
    else if (document.getElementsByClassName('reply_options').length == 1 && document.getElementsByClassName('pad').length == 0 && document.getElementsByClassName('js-only').length == 0) {
        clearInterval(checkIt)
        chrome.runtime.sendMessage({
            solved_noemail: true,
            req: true
        });
    }
}, 1000)