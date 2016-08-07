urls = [];
$("#test").remove();
$("body").append("<div id='test' style='padding: 10px;border-radius: 3px;opacity: 1;background-color: white;width: 250px;'>Gathering URLs...</div>");
$("#test").bPopup({
    escClose: false,
    modal: true,
    modalClose: false
});


function grabGmail(lol) {
    pUrl = $('.user.post a').attr('href').replace(/https:\/\/post.craigslist.org\/c\//g, '');
    mUrl = lol.slice(0, -5).match(/\/([a-z]*\/)[a-z]*\/[0-9]*/)[1];
    nUrl = lol.slice(0, -5).replace(mUrl, '');
    console.log("https://" + window.location.hostname + '/reply/' + pUrl + nUrl);
    $.get("https://" + window.location.hostname + '/reply/' + pUrl + nUrl, function(data) {
        $("#test").html("Gathering URLs... " + (x++) + "/" + urls.length);
        if (/captcha/g.test(data)) {
            chrome.runtime.sendMessage({
                url: "https://" + window.location.hostname + '/reply/' + pUrl + nUrl
            });
        } else if (/mail.google.com/g.test(data)) {
            chrome.runtime.sendMessage({
                gmails: data.replace(/amp;/g, '').match(/https\:\/\/mail.google.com(.*?)\"/)[0].slice(0, -1),
                req: true
            });
        } else {
            chrome.runtime.sendMessage({
                req_noemail: true
            })
        }
    })
}

function startRunning() {
    $('.content .row:not(".banished") .pl [cbdone="false"]').each(function() {
        if (!(/craigslist/).test($(this).attr('href'))) {
            urls.push($(this).attr('href'));
        }
    })

    if (urls.length > 0) {
        chrome.runtime.sendMessage({
            urls: urls
        }, function(res) {
            $("#test").html("Gathering URLs... 0/" + urls.length);
            x = 1;
            for (v in urls) {
                grabGmail(urls[v])
            }

        });
    } else {
        $("#test").html("No ads available.");
        setTimeout(function() {
            $("#test").bPopup().close();
        }, 2000);
    }
}


$.ajax({
    url: 'https://mail.google.com/mail/u/0/h/?&cs=b&v=b',
    success: function(data) {
        if (/Do you really want to use HTML Gmail/g.test(data)) {
            atVal = data.match(/name="at" type="hidden" value="([a-zA-Z0-9_\-]*)"/)[1];
            action = data.match(/action="(.*?)"/)[1];
            $.post(action, {
                at: atVal
            }).done(function(data) {
                startRunning();
            });
        } else {
            startRunning();
        }
    },
    error: function(data) {
        $("#test").html("Error contacting gmail.<br />Make sure you are logged in.");
        setTimeout(function() {
            $("#test").bPopup().close();
        }, 5000);
    }
});