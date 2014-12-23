pcbuilder.optionspage = pcbuilder.optionsPage || {};

pcbuilder.optionspage = function() {
	this.options = new pcbuilder.Options();
    this.saveButton = new pcbuilderui.Button("Save", this.saveOptions.bind(this));
    this.resetButton = new pcbuilderui.Button("Reset", this.resetOptions.bind(this));
    this.factoryResetButton = new pcbuilderui.Button("Factory reset", this.factoryResetOptions.bind(this));

    this.buttonDiv = document.getElementById("configButtons");
    this.saveButton.attachTo(this.buttonDiv);
    this.resetButton.attachTo(this.buttonDiv);
    this.factoryResetButton.attachTo(this.buttonDiv);
	
	titleDiv = document.getElementById("title");
	this.statusText = new pcbuilderui.Status("Idle");
	this.statusText.attachTo(titleDiv);
};

pcbuilder.optionspage.prototype.refresh = function() {
	// call loadOptions asynchronously when the options are loaded from storage
    this.options.load(this.loadOptions.bind(this));
};

pcbuilder.optionspage.prototype = Object.create(pcbuilder.optionspage.prototype);
pcbuilder.optionspage.prototype.constructor = pcbuilder.optionspage;

// Turns off pusling effect used for errors on each option input
pcbuilder.optionspage.prototype.unPulseOptions = function(){
	for (var key in _this.options.config) 
	{
		if (this.options.config.hasOwnProperty(key)) 
		{
			option = this.options.config[key];
			
			if(option.visible){
				optionDiv = document.getElementById(option.name);
				input = optionDiv.getElementsByTagName('input')[0];
				pcbuilderui.removeClass("pulse",input);

			}
		}
	}
}

// Persist all current option values and handle any invalid items
pcbuilder.optionspage.prototype.saveOptions = function() {

    for (var key in this.options.config) {
        if (this.options.config.hasOwnProperty(key)) {
		
			option = this.options.config[key];
			if(option.visible){
				
				optionDiv = document.getElementById(option.name);
				label = optionDiv.getElementsByTagName('label')[0];

				input = optionDiv.getElementsByTagName('input')[0];
				option.attrs["value"] = input.value;
			}
        }
    }
	_this = this;
    this.options.save(function(errors){
		try{
			if(errors.length < 1){
				
				_this.unPulseOptions();
				pcbuilder.trace("Options are saved");
				_this.statusText.setText("Save successful");	
				
			}else{
				for(i =0; i < errors.length; i++){
					option = errors[i];
					console.log(option.name + "=\""+option.attrs["value"]+"\" is invalid");
					
					optionDiv = document.getElementById(option.name);
					input = optionDiv.getElementsByTagName('input')[0];
					
					pcbuilderui.addClass("pulse",input);
				}
				_this.statusText.setText("Save errors, pulsing items are invalid");
			}
			
			if(_this.saveButton.pulsing){
				_this.saveButton.togglePulse();
			}
		
		}catch(e){
			pcbuilder.error(e);
		}
		
	});
};

// Reset all options to install defaults
pcbuilder.optionspage.prototype.factoryResetOptions = function() {
	
	changed = false;
    for (var key in this.options.config) {
        if (this.options.config.hasOwnProperty(key)) {
		
			option = this.options.config[key];
			
			if(option.visible){
				optionDiv = document.getElementById(option.name);
				input = optionDiv.getElementsByTagName('input')[0];
				
				// Check if the saved value has changed
				if(option.defaultVal != option.attrs["value"]){
					changed = true;
				}
				input.value = option.defaultVal;
			}
        }
    }
	
	// Remove error markers and prompt to save
	if(changed){
		
		this.unPulseOptions();
		
		if(!this.saveButton.pulsing){
			this.saveButton.togglePulse();
		}
		
		_this.statusText.setText("Save to commit changes");
	}else{
		_this.statusText.setText("No changes");
	}
}

// Change all values input by user back to those saved in storage
pcbuilder.optionspage.prototype.resetOptions = function() {
	_this = this;
	
	// Execute callback asynchronously when options have loaded
	_this.options.load(function(){
		changed = false;
		for (var key in _this.options.config) {
			if (_this.options.config.hasOwnProperty(key)) {
				option = _this.options.config[key];
				
				if(option.visible){
					optionDiv = document.getElementById(option.name);

					input = optionDiv.getElementsByTagName('input')[0];
					if(input.value != option.attrs["value"]){
						input.value = option.attrs["value"];
						pcbuilder.trace("Resetting "+option.name+" to "+option.attrs["value"]);
						changed = true;
					}
				}

			}
		}
		
		if(changed){
			_this.unPulseOptions();
			
			if(!_this.saveButton.pulsing){
				_this.saveButton.togglePulse();
			}
			
			_this.statusText.setText("Click save to commit changes");
		}else{
			_this.statusText.setText("No changes");
		}
	});

}

// Load all known options and display them on the page
pcbuilder.optionspage.prototype.loadOptions = function() {

    optionsDiv = document.getElementById("configItems");

    for (var key in this.options.config) {

        if (this.options.config.hasOwnProperty(key)) {
            option = this.options.config[key];
			
			if(option.visible){
			    optionDiv = document.createElement("div");
				optionDiv.setAttribute("id", option.name);
				optionDiv.setAttribute("class", "configItem");

				// Option Label
				label = document.createElement("label");
				label.innerHTML = option.desc;
				label.setAttribute("for", "input-" + option.name);
				
				optionDiv.appendChild(label);

				// Option input
				input = document.createElement("input");
				_this = this;
				input.addEventListener("change", function(){
					if(!_this.saveButton.pulsing){
						_this.saveButton.togglePulse();
					}
				
				}, false);
				
				for (var atKey in option.attrs) {
					if (option.attrs.hasOwnProperty(atKey)) {
						input.setAttribute(atKey, option.attrs[atKey]);
					}
				}
				
				input.setAttribute("id", "input-" + option.name);
				optionDiv.appendChild(input);

				optionsDiv.appendChild(optionDiv);

				divider = new pcbuilderui.HDivide();
				divider.attachTo(optionsDiv);
			}
        }
    }
}

// Create a new backing object when the page loads
document.addEventListener('DOMContentLoaded', function() {
    page = new pcbuilder.optionspage();
    page.refresh();
});