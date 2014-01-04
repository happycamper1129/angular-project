/*
textAngular
Author : Austin Anderson
License : 2013 MIT
Version 1.1.2

See README.md or https://github.com/fraywing/textAngular/wiki for requirements and use.
*/

(function(){ // encapsulate all variables so they don't become global vars
	"Use Strict";
	var textAngular = angular.module("textAngular", ['ngSanitize']); //This makes ngSanitize required
	
	// Here we set up the global display defaults, to set your own use a angular $provider#decorator.
	textAngular.value('taOptions', {
		toolbar: [['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'], ['bold', 'italics', 'underline', 'ul', 'ol', 'redo', 'undo', 'clear'], ['justifyLeft','justifyCenter','justifyRight'],['html', 'insertImage', 'insertLink', 'unlink']],
		classes: {
			focussed: "focussed",
			toolbar: "btn-toolbar",
			toolbarGroup: "btn-group",
			toolbarButton: "btn btn-default",
			toolbarButtonActive: "active",
			toolbarButtonDisabled: "disabled",
			textEditor: 'form-control',
			htmlEditor: 'form-control'
		}
	});
	
	// setup the global contstant functions for setting up the toolbar
	
	var taTools = {}; // all tool definitions
	/*
		A tool definition is an object with the following key/value parameters:
			display: [string] an HTML element to be displayed as the buton. The `scope` of the button is the tool definition object with some additional functions
			buttontext: [string]? if this is defined it will replace the contents of the element contained in the `display` element
			iconclass: [string]? if this is defined an icon (<i>) will be appended to the `display` element with this string as it's class
			activestate: [function()]? this function is called on every caret movement, if it returns true then the class taOptions.classes.toolbarButtonActive will be applied to the `display` element, else the class will be removed
			disabled: [function()]? if this function returns true then the tool will have the class taOptions.classes.toolbarButtonDisabled applied to it, else it will be removed
		Other functions available on the scope are:
			displayActiveToolClass: [function(boolean)] 
			name: [string] the name of the tool, this is the first parameter passed into taRegisterTool
			isDisabled: [function()] returns true if the tool is disabled, false if it isn't
			displayActiveToolClass: [function()] returns true if the tool is 'active' in the currently focussed toolbar
	*/
	// name and toolDefinition to add into the tools available to be added on the toolbar
	function registerTextAngularTool(name, toolDefinition){
		taTools[name] = toolDefinition;
	};
	textAngular.constant('taRegisterTool', registerTextAngularTool);
	
	// The activeState function is invoked on the textAngular scope, not the tool scope. All the other functions are called on the tool scope, a child scope of the main textAngular scope.
	textAngular.value('taTools', taTools);
	
	// configure initial textAngular tools here via taRegisterTool
	textAngular.config(function(taRegisterTool){
		taRegisterTool("html", {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			buttontext: 'Toggle HTML',
			action: function() {
				this.$parent.switchView();
				this.active = this.$parent.showHtml;
			}
		});
		// add the Header tools
		var _retActiveStateFunction = function(q){ // convenience function so that the loop works correctly
			return function() { return this.queryFormatBlockState(q); };
		};
		for(var h = 1; h <= 6; h++){
			taRegisterTool('h' + h, {
				display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
				buttontext: 'H' + h,
				action: function() {
					return this.$parent.wrapSelection("formatBlock", "<" + this.name.toUpperCase() +">");
				},
				activeState: _retActiveStateFunction('h' + h)
			});
		}
		taRegisterTool('p', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			buttontext: 'P',
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<P>");
			},
			activeState: function() { return this.queryFormatBlockState('p'); }
		});
		taRegisterTool('pre', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			buttontext: 'pre',
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<PRE>");
			},
			activeState: function() { return this.queryFormatBlockState('pre'); }
		});
		taRegisterTool('ul', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-list-ul',
			action: function() {
				return this.$parent.wrapSelection("insertUnorderedList", null);
			},
			activeState: function() { return document.queryCommandState('insertUnorderedList'); }
		});
		taRegisterTool('ol', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-list-ol',
			action: function() {
				return this.$parent.wrapSelection("insertOrderedList", null);
			},
			activeState: function() { return document.queryCommandState('insertOrderedList'); }
		});
		taRegisterTool('quote', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-quote-right',
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<BLOCKQUOTE>");
			},
			activeState: function() { return this.queryFormatBlockState('blockquote'); }
		});
		taRegisterTool('undo', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-undo',
			action: function() {
				return this.$parent.wrapSelection("undo", null);
			}
		});
		taRegisterTool('redo', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-repeat',
			action: function() {
				return this.$parent.wrapSelection("redo", null);
			}
		});
		taRegisterTool('bold', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-bold',
			action: function() {
				return this.$parent.wrapSelection("bold", null);
			},
			activeState: function() {
				return document.queryCommandState('bold');
			}
		});
		taRegisterTool('justifyLeft', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-align-left',
			action: function() {
				return this.$parent.wrapSelection("justifyLeft", null);
			},
			activeState: function() {
				return document.queryCommandState('justifyLeft');
			}
		});
		taRegisterTool('justifyRight', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-align-right',
			action: function() {
				return this.$parent.wrapSelection("justifyRight", null);
			},
			activeState: function() {
				return document.queryCommandState('justifyRight');
			}
		});
		taRegisterTool('justifyCenter', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-align-center',
			action: function() {
				return this.$parent.wrapSelection("justifyCenter", null);
			},
			activeState: function() {
				return document.queryCommandState('justifyCenter');
			}
		});
		taRegisterTool('italics', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-italic',
			action: function() {
				return this.$parent.wrapSelection("italic", null);
			},
			activeState: function() {
				return document.queryCommandState('italic');
			}
		});
		taRegisterTool('underline', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-underline',
			action: function() {
				return this.$parent.wrapSelection("underline", null);
			},
			activeState: function() {
				return document.queryCommandState('underline');
			}
		});
		taRegisterTool('clear', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-ban',
			action: function() {
				return this.$parent.wrapSelection("removeFormat", null);
			}
		});
		taRegisterTool('insertImage', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-picture-o',
			action: function() {
				var imageLink;
				imageLink = prompt("Please enter an image URL to insert", 'http://');
				if (imageLink !== '') {
					return this.$parent.wrapSelection('insertImage', imageLink);
				}
			}
		});
		taRegisterTool('insertLink', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-link',
			action: function() {
				var urlLink;
				urlLink = prompt("Please enter an URL to insert", 'http://');
				if (urlLink !== '') {
					return this.$parent.wrapSelection('createLink', urlLink);
				}
			}
		});
		taRegisterTool('unlink', {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>",
			iconclass: 'fa fa-unlink',
			action: function() {
				return this.$parent.wrapSelection('unlink', null);
			}
		});
	});
	
	textAngular.directive("textAngular", ['$compile', '$timeout', 'taOptions', 'taTools', '$log', function($compile, $timeout, taOptions, taTools, $log) {
		$log.info("Thank you for using textAngular! http://www.textangular.com");
		return {
			require: '?ngModel',
			scope: {},
			restrict: "EA",
			link: function(scope, element, attrs, ngModel) {
				var group, groupElement, keydown, keyup, tool, toolElement; //all these vars should not be accessable outside this directive
				// get the settings from the defaults and add our specific functions that need to be on the scope
				angular.extend(scope, taOptions, {
					// wraps the selection in the provided tag / execCommand function.
					wrapSelection: function(command, opt) {
						document.execCommand(command, false, opt);
						// refocus on the shown display element, this fixes a display bug when using :focus styles to outline the box. You still have focus on the text/html input it just doesn't show up
						if (scope.showHtml)
							scope.displayElements.html[0].focus();
						else
							scope.displayElements.text[0].focus();
						// note that wrapSelection is called via ng-click in the tool plugins so we are already within a $apply
						scope.updateSelectedStyles();
						if (!scope.showHtml) scope.updateTaBindtext(); // only update if in text or WYSIWYG mode
					},
					showHtml: false
				});
				// setup the options from the optional attributes
				if (!!attrs.taToolbar)					scope.toolbar = scope.$eval(attrs.taToolbar);
				if (!!attrs.taFocussedClass)			scope.classes.focussed = scope.$eval(attrs.taFocussedClass);
				if (!!attrs.taToolbarClass)				scope.classes.toolbar = attrs.taToolbarClass;
				if (!!attrs.taToolbarGroupClass)		scope.classes.toolbarGroup = attrs.taToolbarGroupClass;
				if (!!attrs.taToolbarButtonClass)		scope.classes.toolbarButton = attrs.taToolbarButtonClass;
				if (!!attrs.taToolbarActiveButtonClass)	scope.classes.toolbarButtonActive = attrs.taToolbarActiveButtonClass;
				if (!!attrs.taTextEditorClass)			scope.classes.textEditor = attrs.taTextEditorClass;
				if (!!attrs.taHtmlEditorClass)			scope.classes.htmlEditor = attrs.taHtmlEditorClass;
				
				var originalContents = element.html();
				element.html(''); // clear the original content
				
				// Setup the HTML elements as variable references for use later
				scope.displayElements = {
					toolbar: angular.element("<div></div>"),
					forminput: angular.element("<input type='hidden' style='display: none;'>"), // we still need the hidden input even with a textarea as the textarea may have invalid/old input in it, wheras the input will ALLWAYS have the correct value.
					html: angular.element("<textarea ng-show='showHtml' ta-bind='html' ng-model='html' ></textarea>"),
					text: angular.element("<div contentEditable='true' ng-hide='showHtml' ta-bind='text' ng-model='text' ></div>")
				};
				// add the main elements to the origional element
				element.append(scope.displayElements.toolbar);
				element.append(scope.displayElements.text);
				element.append(scope.displayElements.html);
				
				if(!!attrs.name){
					scope.displayElements.forminput.attr('name', attrs.name);
					element.append(scope.displayElements.forminput);
				}
				
				if(!!attrs.taDisabled){
					scope.displayElements.text.attr('ta-readonly', 'disabled');
					scope.displayElements.html.attr('ta-readonly', 'disabled');
					scope.disabled = scope.$parent.$eval(attrs.taDisabled);
					scope.$parent.$watch(attrs.taDisabled, function(newVal){
						scope.disabled = newVal;
						if(scope.disabled){
							element.addClass(scope.classes.toolbarButtonDisabled);
						}else{
							element.removeClass(scope.classes.toolbarButtonDisabled);
						}
					});
				}
				
				// compile the scope with the text and html elements only - if we do this with the main element it causes a compile loop
				$compile(scope.displayElements.text)(scope);
				$compile(scope.displayElements.html)(scope);
				
				// add the classes manually last
				element.addClass("ta-root");
				scope.displayElements.toolbar.addClass("ta-toolbar " + scope.classes.toolbar);
				scope.displayElements.text.addClass("ta-text ta-editor " + scope.classes.textEditor);
				scope.displayElements.html.addClass("ta-html ta-editor " + scope.classes.textEditor);
				
				// note that focusout > focusin is called everytime we click a button
				element.on('focusin', function(){ // cascades to displayElements.text and displayElements.html automatically.
					element.addClass(scope.classes.focussed);
					$timeout(function(){ element.triggerHandler('focus'); }, 0); // to prevent multiple apply error defer to next seems to work.
				});
				element.on('focusout', function(){
					$timeout(function(){
						// if we have NOT focussed again on the text etc then fire the blur events
						if(!(document.activeElement === scope.displayElements.html[0]) && !(document.activeElement === scope.displayElements.text[0])){
							element.removeClass(scope.classes.focussed);
							$timeout(function(){ element.triggerHandler('blur'); }, 0); // to prevent multiple apply error defer to next seems to work.
						}
					}, 0);
				});
				
				// Setup the default toolbar tools, this way allows the user to add new tools like plugins. Note that this is called from the activeState function which is invoked on the main textAngular scope NOT the toolbar scope.
				scope.queryFormatBlockState = function(command){
					command = command.toLowerCase();
					var val = document.queryCommandValue('formatBlock').toLowerCase();
					return val === command || val === command;
				};
				scope.switchView = function(){
					scope.showHtml = !scope.showHtml;
					if (scope.showHtml) { //Show the HTML view
						$timeout((function() { //defer until the element is visible
							return scope.displayElements.html[0].focus(); //dereference the DOM object from the angular.element
						}), 100);
					} else { //Show the WYSIWYG view
						$timeout((function() { //defer until the element is visible
							return scope.displayElements.text[0].focus(); //dereference the DOM object from the angular.element
						}), 100);
					}
				};
				scope.tools = {}; // Keep a reference for updating the active states later
				// create the tools in the toolbar
				for (var _i = 0; _i < scope.toolbar.length; _i++) {
					// setup the toolbar group
					group = scope.toolbar[_i];
					groupElement = angular.element("<div>");
					groupElement.addClass(scope.classes.toolbarGroup);
					for (var _j = 0; _j < group.length; _j++) {
						// init and add the tools to the group
						tool = group[_j]; // a tool name (key name from taTools struct)
						toolElement = angular.element(taTools[tool].display);
						toolElement.addClass(scope.classes.toolbarButton);
						toolElement.attr('unselectable', 'on'); // important to not take focus from the main text/html entry
						toolElement.attr('ng-disabled', 'isDisabled()');
						if(taTools[tool].buttontext) toolElement.html(taTools[tool].buttontext);
						if(taTools[tool].iconclass){
							var icon = angular.element('<i>');
							icon.addClass(taTools[tool].iconclass);
							toolElement.append(icon);
						}
						var childScope = angular.extend(scope.$new(true), taTools[tool], { // add the tool specific functions, these overwrite anything in the tool
							name: tool,
							isDisabled: function(){ // to set your own disabled logic set a function or boolean on the tool called 'disabled'
								return (typeof this.disabled === 'function' && this.disabled()) || (typeof this.disabled === 'boolean' && this.disabled) || (this.name !== 'html' && (this.$parent.disabled || this.$parent.showHtml)) || this.$parent.disabled;
							},
							displayActiveToolClass: function(active){
								return (active)? this.$parent.classes.toolbarButtonActive : '';
							}
						}); //creates a child scope of the main angularText scope and then extends the childScope with the functions of this particular tool
						scope.tools[tool] = childScope; // reference to the scope kept
						groupElement.append($compile(toolElement)(childScope)); // append the tool compiled with the childScope to the group element
					}
					scope.displayElements.toolbar.append(groupElement); // append the group to the toolbar
				}
				
				// changes to the model variable from outside the html/text inputs
				if(attrs.ngModel){ // if no ngModel, then the only input is from inside text-angular
					ngModel.$render = function() {
						scope.displayElements.forminput.val(ngModel.$viewValue);
						// if the editors aren't focused they need to be updated, otherwise they are doing the updating
						if (!(document.activeElement === scope.displayElements.html[0]) && !(document.activeElement === scope.displayElements.text[0])) {
							var val = ngModel.$viewValue || ''; // in case model is null
							scope.text = val;
							scope.html = val;
						}
					};
				}else{ // if no ngModel then update from the contents of the origional html.
					scope.displayElements.forminput.val(originalContents);
					scope.text = originalContents;
					scope.html = originalContents;
				}
				
				scope.$watch('text', function(newValue, oldValue){
					scope.html = newValue;
					if(attrs.ngModel && newValue !== oldValue) ngModel.$setViewValue(newValue);
					scope.displayElements.forminput.val(newValue);
				});
				scope.$watch('html', function(newValue, oldValue){
					scope.text = newValue;
					if(attrs.ngModel && newValue !== oldValue) ngModel.$setViewValue(newValue);
					scope.displayElements.forminput.val(newValue);
				});
				
				// the following is for applying the active states to the tools that support it
				scope.bUpdateSelectedStyles = false;
				// loop through all the tools polling their activeState function if it exists
				scope.updateSelectedStyles = function() {
					for (var _k = 0; _k < scope.toolbar.length; _k++) {
						var groups = scope.toolbar[_k];
						for (var _l = 0; _l < groups.length; _l++) {
							tool = groups[_l];
							if (scope.tools[tool].activeState != null) {
								scope.tools[tool].active = scope.tools[tool].activeState.apply(scope);
							}
						}
					}
					if (scope.bUpdateSelectedStyles) $timeout(scope.updateSelectedStyles, 200); // used to update the active state when a key is held down, ie the left arrow
				};
				// start updating on keydown
				var keydown = function() {
					scope.bUpdateSelectedStyles = true;
					scope.$apply(function() {
						scope.updateSelectedStyles();
					});
				};
				scope.displayElements.html.on('keydown', keydown);
				scope.displayElements.text.on('keydown', keydown);
				// stop updating on key up and update the display/model
				var keyup = function() {
					scope.bUpdateSelectedStyles = false;
				};
				scope.displayElements.html.on('keyup', keyup);
				scope.displayElements.text.on('keyup', keyup);
				// update the toolbar active states when we click somewhere in the text/html boxed
				var mouseup = function() {
					scope.$apply(function() {
						scope.updateSelectedStyles();
					});
				};
				scope.displayElements.html.on('mouseup', mouseup);
				scope.displayElements.text.on('mouseup', mouseup);
			}
		};
	}]).directive('taBind', ['$sanitize', 'taFixChrome', function($sanitize, taFixChrome){
		// Uses for this are textarea or input with ng-model and ta-bind='text' OR any non-form element with contenteditable="contenteditable" ta-bind="html|text" ng-model
		return {
			require: 'ngModel',
			scope: {'taBind': '@'},
			link: function(scope, element, attrs, ngModel){
				var isContentEditable = element[0].tagName.toLowerCase() !== 'textarea' && element[0].tagName.toLowerCase() !== 'input' && element.attr('contenteditable') !== undefined && element.attr('contenteditable');
				var isReadonly = false;
				// in here we are undoing the converts used elsewhere to prevent the < > and & being displayed when they shouldn't in the code.
				var compileHtml = function(){
					var result = taFixChrome(element).html();
					if(scope.taBind === 'html' && isContentEditable) result = result.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, '&');
					return result;
				};
				
				scope.$parent['updateTaBind' + scope.taBind] = function(){//used for updating when inserting wrapped elements
					var compHtml = compileHtml();
					var tempParsers = ngModel.$parsers;
					ngModel.$parsers = []; // temp disable of the parsers
					ngModel.$oldViewValue = compHtml;
					ngModel.$setViewValue(compHtml);
					ngModel.$parsers = tempParsers;
				};
				
				//this code is used to update the models when data is entered/deleted
				if(isContentEditable){
					element.on('keyup', function(){
						if(!isReadonly) ngModel.$setViewValue(compileHtml());
					});
				}
				
				ngModel.$parsers.push(function(value){
					// all the code here takes the information from the above keyup function or any other time that the viewValue is updated and parses it for storage in the ngModel
					if(ngModel.$oldViewValue === undefined) ngModel.$oldViewValue = value;
					try{
						$sanitize(value); // this is what runs when ng-bind-html is used on the variable
					}catch(e){
						return ngModel.$oldViewValue; //prevents the errors occuring when we are typing in html code
					}
					ngModel.$oldViewValue = value;
					return value;
				});
				
				// changes to the model variable from outside the html/text inputs
				ngModel.$render = function() {
					// if the editor isn't focused it needs to be updated, otherwise it's receiving user input
					if (document.activeElement !== element[0]) {
						var val = ngModel.$viewValue || ''; // in case model is null
						ngModel.$oldViewValue = val;
						if(scope.taBind === 'text'){ //WYSIWYG Mode
							var e = angular.element('<div>' + val + '</div>'); // wrap in div for DOM manipulation
							e.find('script').remove(); // to prevent JS XSS insertion executing arbritrary code, we still save the contents of script tags, we just don't allow them to run in ta-bind
							element.html(e.html()); // escape out of the div to get corrected val (val = e.html())
							element.find('a').on('click', function(e){
								e.preventDefault();
								return false;
							});
						}else if(isContentEditable || (element[0].tagName.toLowerCase() !== 'textarea' && element[0].tagName.toLowerCase() !== 'input')) // make sure the end user can SEE the html code.
							element.html(val.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, '&gt;'));
						else element.val(val); // only for input and textarea inputs
					}else if(!isContentEditable) element.val(val); // only for input and textarea inputs
				};
				
				if(!!attrs.taReadonly){
					//set initial value
					if(scope.$parent.$eval(attrs.taReadonly)){ // we changed to readOnly mode (taReadonly='true')
						if(element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input') element.attr('disabled', 'disabled');
						if(element.attr('contenteditable') !== undefined && element.attr('contenteditable')) element.removeAttr('contenteditable');
					}else{ // we changed to NOT readOnly mode (taReadonly='false')
						if(element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input') element.removeAttr('disabled');
						else if(isContentEditable) element.attr('contenteditable', 'true');
					}
					scope.$parent.$watch(attrs.taReadonly, function(newVal, oldVal){ // taReadonly only has an effect if the taBind element is an input or textarea or has contenteditable='true' on it. Otherwise it is readonly by default
						if(oldVal === newVal) return;
						if(newVal){ // we changed to readOnly mode (taReadonly='true')
							if(element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input') element.attr('disabled', 'disabled');
							if(element.attr('contenteditable') !== undefined && element.attr('contenteditable')) element.removeAttr('contenteditable');
						}else{ // we changed to NOT readOnly mode (taReadonly='false')
							if(element[0].tagName.toLowerCase() === 'textarea' || element[0].tagName.toLowerCase() === 'input') element.removeAttr('disabled');
							else if(isContentEditable) element.attr('contenteditable', 'true');
						}
						isReadonly = newVal;
					});
				}
			}
		};
	}]).factory('taFixChrome', function(){
		// get whaterever rubbish is inserted in chrome
		var taFixChrome = function($html){ // should be an angular.element object, returns object for chaining convenience
			// fix the chrome trash that gets inserted sometimes
			var spans = angular.element($html).find('span'); // default wrapper is a span so find all of them
			for(var s = 0; s < spans.length; s++){
				var span = angular.element(spans[s]);
				if(span.attr('style') && span.attr('style').match(/line-height: 1.428571429;|color: inherit; line-height: 1.1;/i)){ // chrome specific string that gets inserted into the style attribute, other parts may vary. Second part is specific ONLY to hitting backspace in Headers
					if(span.next().length > 0 && span.next()[0].tagName === 'BR') span.next().remove()
					span.replaceWith(span.html());
				}
			}
			var result = $html.html().replace(/style="[^"]*?(line-height: 1.428571429;|color: inherit; line-height: 1.1;)[^"]*"/ig, ''); // regex to replace ONLY offending styles - these can be inserted into various other tags on delete
			if(result !== $html.html()) $html.html(result); // only replace when something has changed, else we get focus problems on inserting lists
			return $html;
		};
		return taFixChrome;
	});
})();