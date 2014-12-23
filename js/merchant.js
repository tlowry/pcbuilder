// Listen for relevant messages from background page
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "context.menu.merch.onclick") {
            runPcBuilder();
        }
    }
);

var matchPlugin = pcbuilder.pluginForUrl(window.location.host);
requestData = {};

if (matchPlugin != null) {
	pcbuilder.trace("Matched a plugin for "+window.location.host);
    // Create the context menu, background ignores if already created
    chrome.runtime.sendMessage({
        action: "createMerchantContextMenu",
        body: {
            title: 'Build basket table',
            contexts: ["all"]
        }

    });
}else{
	// Shouldn't happen unless the sites in manifest don't match the expressions in lookup
	pcbuilder.trace("Failed to match a plugin for "+window.location.host);
}

// Run the app on this page
var runPcBuilder = function() {
    if (window.jQuery) {
		
        try {
			if(this.app){
				
			}else{
				this.app = new pcbuilder.app(window.location.host);
			}
            
            this.app.run();

        } catch (e) {
            pcbuilder.err(e);
        }

    } else {
        pcbuilder.trace("Failed to load jquery");
    }
}
