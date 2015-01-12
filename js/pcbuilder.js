var pcbuilder = pcbuilder || {};

/* Logging package */
pcbuilder.logLevels = {
    TRACE: 3,
    INFO: 2,
    ERROR: 1,
    OFF: 0
}

pcbuilder.logLevel = pcbuilder.logLevels.TRACE;

pcbuilder.getCallerLine = function() {

    var err = new Error();

    // Get the calling function from 2 calls up (logger call is 1 up, call to logger is 2)
    caller_line = err.stack.split("\n")[3];

    // Get the function.name part
    start = caller_line.indexOf("at ") + 3;
    end = caller_line.indexOf("(", start);
    str = caller_line.slice(start, end);

    return str;
};

pcbuilder.trace = function(message) {
    if (pcbuilder.logLevel === pcbuilder.logLevels.TRACE) {
        console.log(pcbuilder.getCallerLine() + message);
    }
};

pcbuilder.info = function(message) {
    if (pcbuilder.logLevel > pcbuilder.logLevels.ERROR) {
        console.log(pcbuilder.getCallerLine() + message);
    }
};

pcbuilder.err = function(e) {
    if (pcbuilder.logLevel > pcbuilder.logLevels.OFF) {
        console.log("Hit an exception :" + e.stack);
    }
};

pcbuilder.warn = function(message) {
	if (pcbuilder.logLevel > pcbuilder.logLevels.WARN) {
		console.log(pcbuilder.getCallerLine() + message);
	}
};
/* End Logging package */

/* some common utils */
pcbuilder.util = {};

// trim excess space at ends of string and remove duplicate spaces
pcbuilder.util.sanitize = function(string) {
    ret = string.trim().replace(/\s+/g, " ");
    return ret;
};

pcbuilder.util.escapeHtml = function(string) {
    return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

pcbuilder.util.unEscapeHtml = function(string) {
    return string.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
};

/* end common utils */

// Options provides a cahced interface to the extension settings and can load/save them from persistence
pcbuilder.Options = function() {
    this.config = {
        "pcbuilder.faveMerchantUrl": {
            name: "pcbuilder.faveMerchantUrl",
            defaultVal: "http://www.hardwareversand.de",
            desc: "Url opened when \"Start build\" button is clicked in forum",
			validate : /.*?:\/\/.*?/,
            attrs: {
                type: "text",
                value: "http://www.hardwareversand.de"
            },
			visible : true
        },
        "pcbuilder.trimToLength": {
            name: "pcbuilder.trimToLength",
            defaultVal: 60,
            desc: "Truncate long product Names, 0 means don't truncate, greater than 0 means the max length",
			validate : /[0-9]+/,
            attrs: {
                type: "number",
                min: 0,
                value: 60
            },
			visible : true
        },
        "pcbuilder.lastFormatter": {
            name: "pcbuilder.lastFormatter",
            defaultVal: "boards.ie",
            desc: "Last formatter tab opened",
            attrs: {
                type : "text",
                value : "boards.ie"
            },
			visible : false
        }
    }
	
	this.loadCallback = null;
	this.size = 0;
};

pcbuilder.Options.prototype = Object.create(pcbuilder.Options.prototype);
pcbuilder.Options.prototype.constructor = pcbuilder.Options;

// Populate the cached options in this callback
pcbuilder.Options.prototype.onLoad = function(obj) {
    if (chrome.runtime.error) {
        pcbuilder.trace("Runtime error when retrieving options :"+chrome.runtime.error);
    }
	this.size =0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            option = this.config[key];
			option.attrs["value"] = obj[key];
			this.size++;
        }
    }
};

// Read a single option matching the provided key
pcbuilder.Options.prototype.getOption = function(key){
	ret = null;
	if(this.config.hasOwnProperty(key)){
		ret = this.config[key];
	}
	return ret;
};

// Locally set a single option, call save to persist to memory
pcbuilder.Options.prototype.setOption = function(key,val){

	if(this.config.hasOwnProperty(key)){
		option = this.config[key];
		option.attrs["value"] = val;
	}
};

/* Load the options from chrome persistence*/
pcbuilder.Options.prototype.load = function(callback) {

	req = [];
	index = 0;
    for (var key in this.config) {
        if (this.config.hasOwnProperty(key)) {
            option = this.config[key];
			key = option.name;
			val = option.defaultVal;
            req.push(key);
			index++;
        }
    }
	if(index > 0){
		_options = this;
		chrome.storage.sync.get(req, function(obj){
			try{
				_options.onLoad(obj);
				callback();
			}catch(e){
				pcbuilder.err(e);
			}
			
		});
		
	}else{
		callback();
	}
};

/* Save the options to chrome persistence*/
pcbuilder.Options.prototype.save = function(callback) {

	index = 0;
	errors = [];
    for (var key in this.config) {
        if (this.config.hasOwnProperty(key)) {
            option = this.config[key];
			req = null;
			
			val = option.attrs["value"];
			if(option.validate){
				matches = option.validate.exec(val);
				if(matches){
					req = {};
					key = option.name;
					req[key]=val;
				}else{
					errors.push(option);
				}
				
			}else{
				req = {};
				key = option.name;

				req[key]=val;
			}
			
			index++;
			if(req){
				if(index == this.size){
				chrome.storage.sync.set(req,function(){
					callback(errors);
				});
				
				}else{
					chrome.storage.sync.set(req);
				}
			}
        }	
    }
	if(index < 1){
		callback(errors);
	}
};

// LineItem is a single product in a basket
pcbuilder.lineItem = function(name, url, qty, price) {
    this.name = name;
    this.url = url;
    this.quantity = qty;
    this.price = price;
};

// The basket is a site agnostic container for products
pcbuilder.Basket = function() {
    this.header = [
        []
    ];
    this.body = [
        []
    ];
    this.total = 0.00;
    this.headIndex = 0;
    this.bodyIndex = 0;
    this.error = null;
    this.currency = "€";
};

// Add a line item to the basket (expects the price is for full line quantity)
pcbuilder.Basket.prototype.addLine = function(name, url, quantity, price) {
    pcbuilder.trace("name=" + name + " url=" + url + " qty=" + quantity + " price=" + price);
	
    this.body[this.bodyIndex] = new pcbuilder.lineItem(name, url, quantity, price);
    this.bodyIndex++;
    this.total += price;
    pcbuilder.trace("Result " + this.total);
};

pcbuilder.Basket.prototype.getLine = function(i) {
    return this.body[i];
};

pcbuilder.Basket.prototype.size = function() {
    return this.bodyIndex;
};

pcbuilder.Basket.prototype.truncate = function(maxLen){
	for(i = 0; i < this.size(); i++){
		name = this.body[i].name;
		if(name.length > maxLen){
			pcbuilder.trace("Truncating "+name);
			name = name.substring(0,maxLen);
			this.body[i].name = name;
		}else{
			pcbuilder.trace("Not truncating "+name);
		}
	}
};

pcbuilder.app = function(url) {
	this.currentUrl = url;
}

pcbuilder.app.prototype.createButtons = function() {
    this.buttonDiv.addClass("pcbuilderuiDialogButtons");

	_this = this;
    // Unlink button // TODO call common method in _this to refresh content
    this.unLinkButton = new pcbuilderui.Button("unlink", function() {
        if (_this.haveLinks) {
            content = _this.formatter.render(_this.basket, false, _this.tableText);
            _this.unLinkButton.setLabel("link");
            _this.haveLinks = false;
        } else {
            content = _this.formatter.render(_this.basket, true, _this.tableText);
            _this.unLinkButton.setLabel("unlink");
            _this.haveLinks = true;
        }
    });

    this.unLinkButton.setId("unlink");
    this.unLinkButton.attachTo(this.buttonDiv);

    // Copy Button
	_this = this;
    this.copyButton = new pcbuilderui.Button("copy", function() {

        chrome.runtime.sendMessage({
            action: "copyToClip",
            text: _this.formatter.renderToClipBoard(_this.basket, _this.tableText)
        });
    });

    this.copyButton.setId("copyDialog");
    this.copyButton.attachTo(this.buttonDiv);

    // Home button
    this.homeButton = new pcbuilderui.Button("home", function() {

        chrome.runtime.sendMessage({
            action: "openHomeTab",
            pattern: _this.formatter.HomeUrlPattern,
            url: _this.formatter.HomeUrl
        });

        _this.dialog.toggle();
    });

    this.homeButton.setId("toHome");
    this.homeButton.attachTo(this.buttonDiv);
};

pcbuilder.app.prototype.createTabs = function() {
	
	_this = this;
    this.tabs = new pcbuilderui.Tabs({
        onTabChange: function(tab) {

            // detach the container with buttons,table etc and move to new tab
			if(_this.container.isAttachedTo(_this.currentTab)){
				_this.container.detachFrom(_this.currentTab);
			}
            
			// change to the appropriate formatter
            formatterClass = null;
			formatterClass = pcbuilder.formatters[tab.name];
			
			_this.currentTab = tab;

            if (formatterClass) {
                _this.formatter = new formatterClass();
                _this.formatter.render(_this.basket, _this.haveLinks, _this.tableText);
                _this.container.attachTo(_this.currentTab);
				
				// Move or hide the home button if necessary
                if (_this.homeButton) {
                    if (!_this.formatter.HomeUrlPattern && !_this.formatter.HomeUrl) {
						if(_this.homeButton.isAttachedTo(_this.buttonDiv)){
							_this.homeButton.detachFrom(_this.buttonDiv);
						}
                        
                    } else if (!_this.homeButton.isAttachedTo(_this.buttonDiv)) {
                        _this.homeButton.attachTo(_this.buttonDiv);
                    }
                }
            } else {
                pcbuilder.trace("No formatter found for " + tab.name);
            }
        }
    });
	
	
	this.currentTab = null;

	for(var key in pcbuilder.formatters){
		if(pcbuilder.formatters.hasOwnProperty(key)){

			newTab = new pcbuilderui.Tab({
				name: key
			});
			
			if(this.currentTab === null){
				this.currentTab = newTab;
			}

			this.tabs.addTab(newTab);

			lastTab = this.options.getOption("pcbuilder.lastFormatter").attrs["value"];
			if(lastTab === key){
				pcbuilder.trace("Resuming from previous tab :"+lastTab);
				this.tabs.makeselected(lastTab);
			}
		}
	}
	
	this.container.attachTo(this.currentTab)
    this.tabs.attachTo(this.dialog);
};
pcbuilder.app.prototype.createUi = function(){

	// Create a container for all common items in tab
	this.container = new pcbuilderui.Widget();
	this.container.addClass("myContainer");
	
	// This text will be the formatter output
	this.tableText = new pcbuilderui.Text();
	this.tableText.attachTo(this.container);
	
	this.dialog = new pcbuilderui.Dialog();
	
	this.container.attachTo(this.dialog);
	
	this.createTabs();
	
	// Create a panel for buttons
	this.buttonDiv = new pcbuilderui.Widget();
	this.createButtons();	
	this.buttonDiv.attachTo(this.dialog);
	
	// Dialog is now populated, add to document and display
	if(!this.dialog.isAttachedTo(document.body)){
		this.dialog.attachTo(document.body);
	}
}

pcbuilder.app.prototype.completeRun = function(){
	
	// Execute the plugin for this site
    plugin = pcbuilder.pluginForUrl(this.currentUrl);
	
	this.plugin = new plugin();
	this.plugin.parse(this.basket);
	
	truncateLenProp = this.options.getOption("pcbuilder.trimToLength");
	truncateLen = parseInt(truncateLenProp.attrs["value"]);
	
	if(truncateLen > 0){
		pcbuilder.trace("Truncating product names to "+truncateLen);
		this.basket.truncate(truncateLen);
	}
	
	// Initialise the ui if not already done
	if(!this.container){
		this.createUi();
		
		lastTab = this.options.getOption("pcbuilder.lastFormatter").attrs["value"];
		formatterClass = pcbuilder.formatters[lastTab];
		if(!formatterClass){
			formatterClass = pcbuilder.formatters["Boards.ie"];
		}
		this.formatter = new formatterClass();
	}
	
	formatted = this.formatter.parse(this.basket, true);
	
	// If there was an error show it, otherwise show the basket output
	if (this.basket.error === null) {
	
		// Hide the error dialog if visible
		if (this.errDialog && this.errDialog.visible()) {
			this.errDialog.toggle();
		}
		
		this.dialog.setTitle("Your Table");
		this.tableText.setText(formatted.result);
		
		if (!this.dialog.visible()) {
			this.dialog.toggle();
		}
		
	} else {
		
		// Hide the main dialog if open
		if (this.dialog.visible()) {
			this.dialog.toggle();
		}
		
		if(!this.errDialog){
			this.errDialog = new pcbuilderui.Dialog(this.basket.error.title);
			this.errText = new pcbuilderui.Text();
			this.errText.attachTo(this.errDialog);
			
			if(!this.errDialog.isAttachedTo(document.body)){
				this.errDialog.attachTo(document.body);
			}
		}
		
		if (!this.errDialog.visible()) {
			this.errDialog.toggle();
		}
		
		this.errDialog.setTitle(this.basket.error.title);
		this.errText.setText(this.basket.error.message);

	}

	// Callback to persist the users last used formatter
	_this = this;
	this.dialog.onClose(function(){
		_this.options.setOption("pcbuilder.lastFormatter", _this.formatter.name);
		_this.options.save(function(){
			pcbuilder.trace("Finished saving app details");
		})
	});
	
}

pcbuilder.app.prototype.run = function() {
    this.basket = new pcbuilder.Basket();
    this.haveLinks = true;
	
	this.options = new pcbuilder.Options();
    this.options.load(this.completeRun.bind(this));
}
