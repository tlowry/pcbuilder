// Listen for relevant messages from background page
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "context.menu.forum.onclick") {
            gotoMerchant();
        }
    }
);

// Create the context menu, background ignores if already created
chrome.runtime.sendMessage({
    action: "createForumContextMenu",
    body: {
        title: 'Start build',
    }
});


// Open a new tab with the  users favourite merchant
var gotoMerchant = function() {
    chrome.runtime.sendMessage({
        action: "openFaveTab"
    });
}
