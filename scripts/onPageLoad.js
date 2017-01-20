var jenkinsEnabled
chrome.storage.local.get("APEX_Rally_Jenkins_Enabled_Flag", function(result) {
    jenkinsEnabled = result.APEX_Rally_Jenkins_Enabled_Flag;
});
var timeToWaitForCards = 4000
var cardMap = {};

//-- Start Up --
function checkForCards() {
    if ($(".rui-card-content").length > 0) {
        loadCardsIntoMap();
        addCopyIconToCards();
        checkForPullRequest();
        if (jenkinsEnabled == true) {
            addJenkinsIconToCards();
        }
    }
};

setTimeout(checkForCards, timeToWaitForCards);

function loadCardsIntoMap() {
    $('.rui-card-content').each(function() {
        var card = $(this)
        var id = card.find(".formatted-id-link").text()
        cardMap[id] = card
    });
}



//-- New functionality --

//------ COPY -------
function copyToClipboard(textToCopy) {
    var aux = document.createElement("input");
    aux.setAttribute("value", textToCopy);
    document.body.appendChild(aux);
    aux.select();
    document.execCommand("copy");
    document.body.removeChild(aux);
}


//------ JENKINS ------

function performJenkinsSearch(id) {
    var searchUrl = 'http://edcbuildserver:8090/search/?q=' + id
    var request = $.ajax({
        url: searchUrl,
        complete: function(data) {
            getJenkinsJob(id, data);
        },
    });
}

function getJenkinsJob(id, data) {
    var jenkinsUrl = "http://edcbuildserver:8090/job/"
    var jenkinsApiUrl = "/api/json"
    var jobName
    if (~data.responseText.indexOf("Nothing seems to match.")) {
        console.log("No Job Found for " + id);
    } else {
        var doc = document.createElement("html");
        doc.innerHTML = data.responseText;
        var links = doc.getElementsByTagName("a");

        for (var i = 0; i < links.length; i++) {
            if (~links[i].text.indexOf(id)) {
                jobName = links[i].text;
            }
        }
    }

    if (typeof jobName !== 'undefined') {
        var jobUrl = jenkinsUrl + jobName
        var jsonUrl = jobUrl + jenkinsApiUrl
        var jsonRequest = $.ajax({
            url: jsonUrl,
            complete: function(data) {
                addJenkinsStatusToCard(id, jobUrl, data)
            }
        });
    } else {
        return null
    }
}

//------ STASH -----
function checkForPullRequest() {
    var url = "https://stash.guidewire.com/rest/api/1.0/projects/EDC/repos/acc-ferrite/pull-requests?limit=100"
    var request = $.ajax({
        url: url,
        complete: function(data) {
            addStashStatusToCards($.parseJSON(data.responseText))
        }
    });
}

//-- Add Stuff To Cards --

//-- Copy Icon --
function addCopyIconToCards() {
    for (var id in cardMap) {
        var card = cardMap[id]
        var copyImg = "images/copy.png"
        var successImg = "images/success.png"
        var imgSrc = chrome.extension.getURL(copyImg)

        //-- Add copy icon --
        card.find(".id").append('&nbsp;<img class="apex-copy-btn" src="' + imgSrc + '" title="Copy ID">');
        (function(_id) {
            card.find(".apex-copy-btn").click(function() {
                var button = $(this)
                copyToClipboard(_id);
                replaceImgSrc(button, copyImg, successImg);
                setTimeout(function() {
                    replaceImgSrc(button, successImg, copyImg)
                }, 2000);
            });
        })(id)
    }
};

function replaceImgSrc(imageElement, oldSrc, newSrc) {
    var src = imageElement.attr("src").replace(oldSrc, newSrc);
    imageElement.attr("src", src);
}

// -- Stash Icon --
function addStashIconToCards() {
    for (var id in cardMap) {
        checkForPullRequest(id)
    }
}

function addStashStatusToCards(json) {
    for (var id in cardMap) {
        var url
        var noApprovals = 0
        $.each(json.values, function(i, pullRequest) {
            if (~pullRequest.title.indexOf(id)) {
                url = pullRequest.links.self[0].href
                $.each(pullRequest.reviewers, function(i, reviewer) {
                    if (reviewer.status === "APPROVED") {
                        noApprovals++
                    }
                });
                addStashStatusToCard(id, url, noApprovals);
            }
        });
    }
}

function addStashStatusToCard(id, url, approvals) {
    var card = cardMap[id]
    console.log("url: " + url)
    console.log("approvals: " + approvals)
    card.find(".id").append('&nbsp;<a href="' + url + '" target="_blank" title="Pull Request">' + approvals + '</a>');
}

//-- jenkins Icon --

function addJenkinsIconToCards() {
    for (var id in cardMap) {
        performJenkinsSearch(id)
    }
}

function addJenkinsStatusToCard(id, jobUrl, data) {
    var jobInfo = $.parseJSON(data.responseText)
    var status = jobInfo.color
    var statusIcon = chrome.extension.getURL("images/" + status + ".png")
    var card = cardMap[id]
    card.find(".id").append('&nbsp;<a href="' + jobUrl + '" target="_blank" title="Jenkins Job"><img class="apex-jenkins-status" src="' + statusIcon + '"></a>');
}
