// Global context menu id
var merchCmId = null;
var forumCmId = null;
var merchSrcId = "1";
var forumSrcId = "2";

tabMap = {};

// Handle requests from content scripts running on shop pages
chrome.runtime.onMessage.addListener(function onRequest(request, sender, callback) {
    if (request.action == 'createMerchantContextMenu') {
        if (merchCmId === null) {
			pcbuilder.trace("creating merchant link");
            var manifest = chrome.runtime.getManifest();
            urls = manifest.content_scripts[0].matches;
            request.body.documentUrlPatterns = urls;
			request.body.id = merchSrcId;
            merchCmId = chrome.contextMenus.create(request.body,function(){
				
				if(chrome.runtime.lastError){
					pcbuilder.trace(chrome.runtime.lastError);
				}
			});
        }else{
			pcbuilder.trace("Already created merchant link");
		}
    } else if (request.action == 'createForumContextMenu') {
        if (forumCmId === null) {
            var manifest = chrome.runtime.getManifest();
			console.log(manifest.content_scripts);
			
			// Get the list of forum urls from the manifest
            urls = manifest.content_scripts[1].matches;
            request.body.documentUrlPatterns = urls;
			request.body.id = forumSrcId;
            forumCmId = chrome.contextMenus.create(request.body);
        }
    } else if (request.action == 'removeContextMenuItem') {
        if (merchCmId !== null) {
            merchCmId = chrome.contextMenus.remove(merchCmId);
        }
    } else if (request.action == "openTab") {
        openTab(request.url);

    } else if (request.action == "openFaveTab") {
        req = {};
        req["pcbuilder.faveMerchantUrl"] = "http://www.hardwareversand.de/";
        chrome.storage.sync.get(req, function(items) {
            chrome.tabs.query({
                currentWindow: true,
                active: true
            }, function(tabs) {
                var sourceTab = tabs[0];
                openTab(items["pcbuilder.faveMerchantUrl"], function(tab) {
                    // Link the calling tab to the newly opened tab so the home button can find it's source
                    tabMap[tab.id] = {
                        id: sourceTab.id,
                        url: sourceTab.url
                    };
                });
            });
        });
    } else if (request.action == "openHomeTab") {
        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function(tabs) {
            currentTabId = tabs[0].id;
            if (tabMap[currentTabId]) {

                chrome.tabs.update(tabMap[currentTabId].id, {
                    selected: true
                });

                // trim the value from the map
                delete tabMap[currentTabId];
            } else {
                chrome.tabs.query({
                    url: request.pattern
                }, function(tabs) {
                    if (tabs.length > 0) {
                        chrome.tabs.update(tabs[0].id, {
                            selected: true
                        });
                    } else {
                        openTab(request.url);
                    }
                });
            }
        });

    } else if (request.action == "copyToClip") {

        var textArea = document.createElement("textarea");
        textArea.style.cssText = "position:absolute;left:-100%";

        document.body.appendChild(textArea);

        textArea.value = request.text.replace(/<br\s*[\/]?>/gi, "\n");
        textArea.select();
        document.execCommand("copy");

        document.body.removeChild(textArea);
    }
});


var openTab = function(url, callback) {
    // Todo callback
    chrome.tabs.create({
        url: url
    }, callback);
}

chrome.contextMenus.onClicked.addListener(function(info, tabs) {
	console.log(info);
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
		console.log(info.menuItemId+":"+merchCmId);
        if (info.menuItemId == merchCmId) {
			pcbuilder.trace("Sending click to merchant script");
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "context.menu.merch.onclick"
            });
        } else {
			pcbuilder.trace("Sending click to forum script");
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "context.menu.forum.onclick"
            });
        }
    });
});
