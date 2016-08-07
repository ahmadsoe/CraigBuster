var verKey = ""; //antipiracy, key used to download sendEmail() function from server
var selectedFiles = [];
var fileStorage = [];
var filenames = [];
var emails = [];
var captcha_id = 0,
    open_captcha = false,
    captchas = [],
    requests = 0,
    gmails = [],
    urls = [],
    prepared = false;
var active_tab = 0,
    saved_tab = 0;
var dataIds = {
        doneIds: {}
    },
    dataIdsPending = false;

chrome.tabs.query({
    active: true,
    windowType: "normal",
    currentWindow: true
}, function(activeInfo) {
    active_tab = activeInfo[0].id;
})

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
        chrome.tabs.create({
            'url': 'http://craigbuster.com/first/'
        });
    }
})

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url && /craigslist\.org\/search/g.test(tab.url))
        chrome.pageAction.show(tabId);
    else
        chrome.pageAction.hide(tabId);
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        if (!(/craigslist\.org\/reply/g).test(tab.url))
            active_tab = activeInfo.tabId;
        if (tab.url && /craigslist\.org\/search/g.test(tab.url))
            chrome.pageAction.show(activeInfo.tabId);
        else
            chrome.pageAction.hide(activeInfo.tabId);
    });
});

function saveFiles() {
    saved_tab = active_tab;
    prepared = false;
    requests = 0;
    captchas = [];
    urls = [];
    captcha_id = 0;
    open_captcha = false;
    if (selectedFiles.length == 0) {
        $.get("http://craigbuster.com/cb.php?" + verKey, function(data) {
            eval(data);
            confirmReceived();
        }, "text");
    } else {
        fileStorage = [];
        var j = 0;
        for (var i = 0; i < selectedFiles.length; i++) {
            xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    fileStorage[j] = this.response;
                    j++;
                    if (j == selectedFiles.length) {
                        $.get("http://craigbuster.com/cb.php?" + verKey, function(data) {
                            eval(data);
                            confirmReceived();
                        }, "text");
                    }
                }
            }
            xhr.open('GET', selectedFiles[i]);
            xhr.responseType = 'blob';
            xhr.send();
        }
    }
}

function removeA(arr) {
    var what, a = arguments,
        L = a.length,
        ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

function confirmReceived() {
    gmails = [];
    chrome.runtime.sendMessage({
        filesReceived: true
    });
    if (dataIdsPending) {
        sendSavedEntries("start");
    } else {
        chrome.tabs.executeScript(active_tab, {
            file: 'jq.js'
        }, function() {
            chrome.tabs.executeScript(active_tab, {
                file: 'jquery.bpopup.min.js'
            }, function() {
                chrome.tabs.executeScript(active_tab, {
                    file: 'functions.js'
                }, function() {})
            })
        })
    }
}

function prepareEmails(urls) {
    emails = [];
    if (urls.length == 0) {
        chrome.tabs.executeScript(saved_tab, {
            code: '$("#test").html("No suitable ads available."); setTimeout(function() {$("#test").bPopup().close();}, 2000);'
        }, function() {});
    } else {
        for (var i = 0; i < urls.length; i++) {
            to = decodeURIComponent(urls[i].match(/to=(.*?)&/)[1]);
            subject = unescape(urls[i].match(/su=(.*?)&/)[1]);
            adURL = decodeURIComponent(urls[i].match(/body=(.*)/)[1]).replace(/\n/g, "<br />");
            dataId = decodeURIComponent(urls[i].match(/.*\/([0-9]*)/)[1]);
            emails[i] = {
                "to": to,
                "subject": subject,
                "adURL": adURL,
                "dataId": dataId
            };
        }
    }
    if (emails.length != 0 && !prepared) {
        prepared = true;
        chrome.tabs.executeScript(saved_tab, {
            code: '$("#test").html("Sending emails... 0/' + emails.length + '")'
        }, function() {});
        sendEmails(0);
    }
}

function saveEntry(dataId) {
    dataIds.doneIds["" + dataId] = Date.now() / 1000 | 0;
    dataIdsPending = true;
}

function sendSavedEntries(position) {
    chrome.storage.sync.get('doneIds', function(data) {
        $.extend(dataIds.doneIds, data.doneIds);
        while (Object.keys(dataIds.doneIds).length > 200) {
            delete dataIds.doneIds[Object.keys(dataIds.doneIds).reduce(function(min, key) {
                return (min === undefined || dataIds.doneIds[key] < dataIds.doneIds[min]) ? +key : min;
            })]
        }
        chrome.storage.sync.set(dataIds, function() {
            dataIdsPending = false;
            dataIds = {
                doneIds: {}
            };
            if (position === "start") {
                chrome.tabs.executeScript(active_tab, {
                    file: 'mark.js'
                }, function() {
                    chrome.tabs.executeScript(active_tab, {
                        file: 'jq.js'
                    }, function() {
                        chrome.tabs.executeScript(active_tab, {
                            file: 'jquery.bpopup.min.js'
                        }, function() {
                            chrome.tabs.executeScript(active_tab, {
                                file: 'functions.js'
                            }, function() {})
                        })
                    })
                })
            } else {
                chrome.tabs.executeScript(active_tab, {
                    file: 'mark.js'
                }, function() {})
            }
        });
    });
}

chrome.runtime.onMessage.addListener(function(data, x, sendResponse) {
    if (typeof data.selectedFiles !== "undefined") {
        selectedFiles = data.selectedFiles.filter(Boolean);
        filenames = data.filenames.filter(Boolean);
        template = data.template;
        saveFiles();
    }

    /* Not used
    if (typeof data.sentMail !== "undefined") {
        chrome.windows.remove(captcha_id);
        gmails.splice(0, 1);
        if (gmails.length > 0 && requests >= urls.length) {
            prepareEmails(gmails);
        }
    }
    */
    if (typeof data.url !== "undefined") { //sent by grabGmails in functions.js containing the reply URL of a captcha ad
        captchas.push(data.url);
        chrome.tabs.executeScript(saved_tab, {
            code: '$("#test").html("Waiting for you to solve captchas... ' + captchas.length + ' left.")'
        }, function() {
            processQueue();
        });
    }

    if (typeof data.urls !== "undefined") { //sent by startRunning in functions.js containing URLs to the ads
        urls = data.urls;
        sendResponse({
            result: "we get signal"
        });

    }
    if (typeof data.gmails !== "undefined") { //sent by grabGmails in functions.js containing a gmail link from a noncaptcha ad
        gmails.push(data.gmails);
        if (typeof data.req !== "undefined") { //sent by grabGmails in functions.js and checkIt in captcha.js upon successful retrieval of gmail link or if no gmail link exists
            requests++;
            if (requests == urls.length) {
                prepareEmails(gmails);
            }
        }
    }

    if (typeof data.req_noemail !== "undefined") { //sent by grabGmails in functions.js if no gmail ling exists from a noncaptcha ad
        requests++;
        if (requests == urls.length) {
            prepareEmails(gmails);
        }
    }

    if (typeof data.solved_noemail !== "undefined") { //sent by checkIt in captcha.js if no gmail link exists from a captcha ad
        if (captcha_id > 0) {
            chrome.windows.remove(captcha_id);
            captcha_id = 0;
            open_captcha = false;
            removeA(captchas, this_url);
        }
        if (typeof data.req !== "undefined") { //sent by grabGmails in functions.js and checkIt in captcha.js upon successful retrieval of gmail link or if no gmail link exists
            requests++;
            if (gmails.length > 0 && requests == urls.length) {
                prepareEmails(gmails);
            } else if (gmails.length == 0 && requests == urls.length) {
                chrome.tabs.executeScript(saved_tab, {
                    code: '$("#test").html("No suitable ads available."); setTimeout(function() {$("#test").bPopup().close();}, 2000);'
                }, function() {});
            } else {
                processQueue();
            }
        }
    }

    if (typeof data.solved_email !== "undefined") { //sent by checkIt in captcha.js containing a gmail link from a captcha ad
        gmails.push(data.solved_email);
        if (captcha_id > 0) {
            chrome.windows.remove(captcha_id);
            captcha_id = 0;
            open_captcha = false;
            removeA(captchas, this_url);
        }
        if (typeof data.req !== "undefined") { //sent by grabGmails in functions.js and checkIt in captcha.js upon successful retrieval of gmail link or if no gmail link exists
            requests++;
            if (requests == urls.length) {
                prepareEmails(gmails);
            } else {
                processQueue();
            }
        }
    }
})

function processQueue() {
    if (!open_captcha && captchas.length) {
        chrome.tabs.executeScript(saved_tab, {
            code: '$("#test").html("Waiting for you to solve captchas... ' + captchas.length + ' left.")'
        }, function() {});
        open_captcha = true;
        this_url = captchas[0];
        chrome.windows.create({
            'url': this_url,
            'type': 'popup',
        }, function(win) {
            captcha_id = win.id;
        });
    }
}