var pcbuilderui = pcbuilderui || {};

// Widget - Base class for all widgets
pcbuilderui.Widget = function() {
    this.root = document.createElement('div');
    this.root.className = "pcbuilderuiWidget";
    this.attachPoint = this.root;
}

pcbuilderui.Widget.prototype.attachTo = function(target) {
    if (target) {
        isWidget = target instanceof pcbuilderui.Widget;
        if (isWidget) {
            target.attachPoint.appendChild(this.root);
        } else {
            target.appendChild(this.root);
        }
    }
}

pcbuilderui.Widget.prototype.detachFrom = function(target) {
    if (target) {
        isWidget = target instanceof pcbuilderui.Widget;
        if (isWidget) {
            target.attachPoint.removeChild(this.root);
        } else {
            target.removeChild(this.root);
        }
    }
}

pcbuilderui.Widget.prototype.isAttachedTo = function(target) {
    if (target) {
        isWidget = target instanceof pcbuilderui.Widget;
        if (isWidget) {
            return this.root.parentNode == target.attachPoint;
        } else {
            return this.root.parentNode == target;
        }
    }
}

pcbuilderui.removeClass = function(className, elem) {
    exp = new RegExp("[\\s+]?"+className);
    elem.className = elem.className.replace(exp, '');
}

pcbuilderui.addClass = function(className, elem) {
    pcbuilderui.removeClass(className,elem);
    elem.className += " " + className;
}

pcbuilderui.Widget.prototype.removeClass = function(className) {
   pcbuilderui.removeClass(className, this.root);
}

pcbuilderui.Widget.prototype.addClass = function(className) {
    pcbuilderui.removeClass(className, this.root);
    pcbuilderui.addClass(className, this.root);
}

pcbuilderui.Widget.prototype.setId = function(id) {
    this.root.id = id;
}

pcbuilderui.Widget.prototype.toggle = function() {
    this.root.style.display = this.root.style.display == "none" ? "block" : "none";
    return false;
}

pcbuilderui.Widget.prototype.visible = function() {
    return this.root.style.display == "none" ? false : true;
}

// Text is a simple text container
pcbuilderui.Text = function(props) {
    pcbuilderui.Widget.call(this);
    this.addClass("pcbuilderuiText pcbuilderuiBackground");
    this.text = document.createElement('div');
    this.root.appendChild(this.text);
}

pcbuilderui.Text.prototype = Object.create(pcbuilderui.Widget.prototype);
pcbuilderui.Text.prototype.constructor = pcbuilderui.Text;
pcbuilderui.Text.prototype.setText = function(txt) {
    this.text.innerHTML = txt;
}

pcbuilderui.Text.prototype.getText = function() {
    return this.text.innerHTML;
}

// HDivide is a horizontal separator
pcbuilderui.HDivide = function(props) {
    pcbuilderui.Widget.call(this);
    this.addClass(" pcbuilderuiHDivide");
}

pcbuilderui.HDivide.prototype = Object.create(pcbuilderui.Widget.prototype);
pcbuilderui.HDivide.prototype.constructor = pcbuilderui.HDivide;

// Button is a clickable button
pcbuilderui.Button = function(label, callback) {
    pcbuilderui.Widget.call(this);
    this.addClass("pcbuilderuiButton");
    this.root.addEventListener("click", callback)
    this.labelDiv = document.createElement('div');
    this.labelDiv.className = "pcbuilderuiButtonLabel";
    this.labelDiv.innerHTML = label;
    this.root.appendChild(this.labelDiv);
	this.pulsing = false;
}

pcbuilderui.Button.prototype = Object.create(pcbuilderui.Widget.prototype);
pcbuilderui.Button.prototype.constructor = pcbuilderui.Button;
pcbuilderui.Button.prototype.setLabel = function(label) {
    this.labelDiv.innerHTML = label;
}

pcbuilderui.Button.prototype.togglePulse = function(){
	
	if(this.pulsing){
		this.removeClass("pulse");
	}else{
		this.addClass("pulse");
	}
	
	this.pulsing = !this.pulsing;
}


// Dialog is a popup window
pcbuilderui.Dialog = function(title) {
    pcbuilderui.Widget.call(this);
    this.addClass("pcbuilderuiDialogContainer");
    this.headerDiv = document.createElement('div');
    this.headerDiv.className = "pcbuilderuiDialogHeader";

    // Window title
    this.titleDiv = document.createElement('div');
    this.titleDiv.innerHTML = title;
    this.titleDiv.className = "pcbuilderuiDialogTitle";
    this.headerDiv.appendChild(this.titleDiv);
	
	this.closeCallback = null;
    this.close = function() {
        this.toggle();
		
		if(this.closeCallback){
			this.closeCallback();
		}
    };

    // Close Button
    this.closeButton = new pcbuilderui.Button("x", this.close.bind(this));
    this.closeButton.attachTo(this.headerDiv);

    this.root.appendChild(this.headerDiv);

    this.headerDivide = new pcbuilderui.HDivide({});
    this.headerDivide.attachTo(this.root);
    this.contentDiv = document.createElement('div');
    this.contentDiv.className = "pcbuilderuiDialogContent";
    this.attachPoint = this.contentDiv;

    this.root.appendChild(this.contentDiv);
}

pcbuilderui.Dialog.prototype = Object.create(pcbuilderui.Widget.prototype);
pcbuilderui.Dialog.prototype.constructor = pcbuilderui.Dialog;

pcbuilderui.Dialog.prototype.setTitle = function(title){
	this.titleDiv.innerHTML = title;
}

pcbuilderui.Dialog.prototype.onClose = function(callback){
	this.closeCallback = callback;
}

// Tab - a single element placed in a tab container
pcbuilderui.Tab = function(props) {
    pcbuilderui.Widget.call(this);
    this.addClass("pcbuilderuiTab");
    this.name = props.name;
}

pcbuilderui.Tab.prototype = Object.create(pcbuilderui.Widget.prototype);
pcbuilderui.Tab.prototype.constructor = pcbuilderui.Tab;

// Tabs - Tab container
pcbuilderui.Tabs = function(props) {
    pcbuilderui.Widget.call(this);
    this.addClass("pcbuilderuiTabsContainer pcbuilderuiBackground");

    // Header list of tab names
    this.tabList = document.createElement('ul');
    this.tabList.className = "pcbuilderuiTabsList";
    this.root.appendChild(this.tabList);

    // Content of tabs
    this.tabsBody = document.createElement('div');
    this.tabsBody.className = "pcbuilderuiTabsBody";

    this.tabsBodyContent = document.createElement('div');
    this.tabsBodyContent.className = "pcbuilderuiTabsBodyContent";
    this.tabsBody.appendChild(this.tabsBodyContent);

    // Internal state vars
    this.tabMap = {};
    this.selectedTab = null;

    if (props.onTabChange && typeof(props.onTabChange) == "function") {
        this.onTabChange = props.onTabChange;
    } else {
        this.onTabChange = null;
    }
    this.root.appendChild(this.tabsBody)
}

pcbuilderui.Tabs.prototype = Object.create(pcbuilderui.Widget.prototype);
pcbuilderui.Tabs.prototype.constructor = pcbuilderui.Tabs;
pcbuilderui.Tabs.prototype.makeselected = function(tabName) {
    // Remove the selected class from previously selected tab head and detach it's widget
    if (this.selectedTab != null) {
        pcbuilderui.removeClass("selected",this.selectedTab.root);
        this.selectedTab.widget.detachFrom(this.tabsBodyContent);
    }

    newselected = this.tabMap[tabName];

    this.selectedTab = newselected;
	pcbuilderui.addClass("selected",this.selectedTab.root);
    this.selectedTab.widget.attachTo(this.tabsBodyContent);

    // Notify listener
    if (this.onTabChange != null) {
        this.onTabChange(this.selectedTab.widget);
    }
	
}

pcbuilderui.Tabs.prototype.tabClick = function(evt) {
    this.makeselected(evt.srcElement.id);
}

// Add a new tab entry
pcbuilderui.Tabs.prototype.addTab = function(tab) {
    // Create a new header
    tabHeader = {};
    tabHeader.root = document.createElement('li');
    tabHeader.root.className = "pcbuilderuiTabsLink";
    tabHeader.root.id = tab.name;

    // Header label
    tabHeader.label = document.createElement('div');
    tabHeader.label.className = "pcbuilderuiTabsLabel";
    tabHeader.label.innerHTML = tab.name;
    tabHeader.label.id = tab.name;
    tabHeader.root.appendChild(tabHeader.label);
    tabHeader.root.addEventListener("click", this.tabClick.bind(this), false);

    // Save the widget which will hold dom info
    tabHeader.widget = tab;

    this.tabMap[tab.name] = tabHeader;
    this.tabList.appendChild(tabHeader.root);
	
    // If this is the first tab make it the selected one
    if (this.selectedTab == null) {
        this.makeselected(tab.name);
		;
    }
}

// Status - a text panel that fades in when updated then fades out after it's timer expires
pcbuilderui.Status = function(text, timeout) {
    pcbuilderui.Widget.call(this);
	this.removeClass("pcbuilderuiWidget");
    this.addClass("pcbuilderuiStatus faded");
    this.labelDiv = document.createElement('div');
    this.labelDiv.className = "pcbuilderuiStatusLabel";
	
	this.labelDiv.addEventListener("mouseover", this.cancelFade.bind(this));
	this.labelDiv.addEventListener("mouseout", this.fade.bind(this));
	
	if (text === undefined){
		this.labelDiv.innerHTML = text;
	}else{
		this.labelDiv.innerHTML = "Idle";
	}

	this.root.appendChild(this.labelDiv);
	this.timeId = null;
	
	if(timeout === undefined){
		this.timeout = 4000;
	}else{
		this.timeout = timeout;
	}
}

pcbuilderui.Status.prototype = Object.create(pcbuilderui.Widget.prototype);
pcbuilderui.Status.prototype.constructor = pcbuilderui.Status;

pcbuilderui.Status.prototype.setText = function(text){
	console.log("setText");
	this.labelDiv.innerHTML = text;
	this.removeClass("faded");
	this.removeClass("fadeOut");
	this.fade();
}

pcbuilderui.Status.prototype.fade = function(){
	this.timeId = window.setTimeout(this.fadeOut.bind(this),this.timeout);
}

pcbuilderui.Status.prototype.cancelFade = function(){
	if(this.timeId){
		window.clearTimeout(this.timeId);
		this.timeId = null;
	}
	this.removeClass("fadeOut");
}

pcbuilderui.Status.prototype.fadeOut = function(){
	this.addClass("fadeOut");
}
