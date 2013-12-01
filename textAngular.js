/*
textAngular
Author : Austin Anderson
License : 2013 MIT
Version 1.1.1

Requirements: Angular 1.2.0, Angular ngSanitize module
Optional Requirements: Bootstrap 3.0.0 and font-awesome for styling if you are using the default classes and icons.

How to Use:

1. Include textAngular.js in your project, alternatively grab all this code and throw it in your directives.js module file.
2. In your HTML instantiate textAngular as an attribute or element, the only required attribute is the ng-model which is the variable to bind the content of the editor to, this is the standard ng-model allowing you to use validating filters on it.
3. I reccommend using the following CSS in your stylesheet or a variant of to display the text box nicely:
	
.ta-editor{
	min-height: 300px;
	height: auto;
	overflow: auto;
	font-family: inherit;
	font-size: 100%;
}

4. Have fun!

Setting Options:

Several options can be set through attributes on the HTML tag, these are;
	- ta-toolbar: this should evaluate to an array of arrays. Each element is the name of one of the toolbar tools. The default is: [['h1', 'h2', 'h3', 'p', 'pre', 'bold', 'italics', 'ul', 'ol', 'redo', 'undo', 'clear'],['html', 'insertImage', 'insertLink']]
	- ta-toolbar-class: this is the class to apply to the overall div of the toolbar, defaults to "btn-toolbar". Note that the class "ta-toolbar" is also added to the toolbar.
	- ta-toolbar-group-class: this is the class to apply to the nested groups in the toolbar, a div with this class is created for each nested array in the ta-toolbar array and then the tool buttons are nested inside the group, defaults to "btn-group".
	- ta-toolbar-button-class: this is the class to apply to each tool button in the toolbar, defaults to: "btn btn-default"
	- ta-toolbar-active-button-class: this is the class to apply to each tool button in the toolbar if it's activeState function returns true ie when a tool function is applied to the selected text, defaults to: "active".
	- ta-text-editor-class: this is the class to apply to the text editor <pre>, defaults to "form-control". Note that the classes: ta-editor and ta-text are also added.
	- ta-html-editor-class: this is the class to apply to the html editor <div>, defaults to "form-control". Note that the classes: ta-editor and ta-html are also added.

The defaults can be changed by altering/overwriting the variable: $rootScope.textAngularOpts which acts like global defaults for the classes and toolbar.
The default value for this is: 
	$rootScope.textAngularOpts = {
		toolbar: [['h1', 'h2', 'h3', 'p', 'pre', 'bold', 'italics', 'ul', 'ol', 'redo', 'undo', 'clear'],['html', 'insertImage', 'insertLink']],
		classes: {
			toolbar: "btn-toolbar",
			toolbarGroup: "btn-group",
			toolbarButton: "btn btn-default",
			toolbarButtonActive: "active",
			textEditor: 'form-control',
			htmlEditor: 'form-control'
		}
	}

The toolbar buttons are defined in the object variable $rootScope.textAngularTools.
The following is an example of how to add a button to make the selected text red:
`
$rootScope.textAngularTools.colourRed = {
	display: "<button ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-square' style='color: red;'></i></button>",
	action: function(){
		this.$parent.wrapSelection('formatBlock', '<span style="color: red">');
	},
	activeState: function(){return false;} //This isn't required, and currently doesn't work reliably except for the html tag that doesn't rely on the cursor position.
};
//the following adds it to the toolbar to be displayed and used.
$rootScope.textAngularOpts.toolbar = [['h1', 'h2', 'h3', 'p', 'pre', 'bold', 'colourRed', 'italics', 'ul', 'ol', 'redo', 'undo', 'clear'],['html', 'insertImage', 'insertLink']];
`
To explain how this works, when we create a button we create an isolated child scope of the textAngular scope and extend it with the values in the tools object, we then compile the HTML in the display value with the newly created scope.
Note that the way any functions are called in the plugins the 'this' variable will allways point to the scope of the button ensuring that this.$parent will allways 
Here's the code we run for every tool:

`
toolElement = angular.element($rootScope.textAngularTools[tool].display);
toolElement.addClass(scope.classes.toolbarButton);
groupElement.append($compile(toolElement)(angular.extend scope.$new(true), $rootScope.textAngularTools[tool]));
`
*/


var textAngular = angular.module("textAngular", ['ngSanitize']); //This makes ngSanitize required

textAngular.directive("textAngular", function($compile, $sce, $window, $document, $rootScope, $timeout) {
	console.log("Thank you for using textAngular! http://www.textangular.com");
	// Here we set up the global display defaults, make sure we don't overwrite any that the user may have already set.
	$rootScope.textAngularOpts = angular.extend({
		toolbar: [['h1', 'h2', 'h3', 'p', 'pre', 'bold', 'italics', 'ul', 'ol', 'redo', 'undo', 'clear'], ['html', 'insertImage', 'insertLink']],
		classes: {
			toolbar: "btn-toolbar",
			toolbarGroup: "btn-group",
			toolbarButton: "btn btn-default",
			toolbarButtonActive: "active",
			textEditor: 'form-control',
			htmlEditor: 'form-control'
		}
	}, ($rootScope.textAngularOpts != null)? $rootScope.textAngularOpts : {});
	// deepExtend instead of angular.extend in order to allow easy customization of "display" for default buttons
	// snatched from: http://stackoverflow.com/a/15311794/2966847
	function deepExtend(destination, source) {
		for (var property in source) {
			if (source[property] && source[property].constructor &&
				source[property].constructor === Object) {
				destination[property] = destination[property] || {};
				arguments.callee(destination[property], source[property]);
			} else {
				destination[property] = source[property];
			}
		}
		return destination;
	}
	// Setup the default toolbar tools, this way allows the user to add new tools like plugins
		$rootScope.textAngularTools = deepExtend({
		html: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>Toggle HTML</button>",
			action: function() {
				// this variable in an action function referrs to the angular scope of the tool
				var ht, _this = this;
				this.$parent.showHtml = !this.$parent.showHtml;
				if (this.$parent.showHtml) { //Show the HTML view
					ht = this.$parent.displayElements.text.html();
					$timeout((function() { //defer until the element is visible
						return _this.$parent.displayElements.html[0].focus(); //dereference the DOM object from the angular.element
					}), 100);
				} else { //Show the WYSIWYG view
					ht = this.$parent.displayElements.html.html();
					$timeout((function() { //defer until the element is visible
						return _this.$parent.displayElements.text[0].focus(); //dereference the DOM object from the angular.element
					}), 100);
				}
				// don't need to wrap in $apply as this is called within the ng-click which is in an $apply anyway
				this.$parent.compileHtml(ht);
				this.active = this.$parent.showHtml;
			}
		},
		h1: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>H1</button>",
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<H1>");
			}
		},
		h2: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>H2</button>",
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<H2>");
			}
		},
		h3: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>H3</button>",
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<H3>");
			}
		},
		p: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>P</button>",
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<P>");
			}
		},
		pre: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'>pre</button>",
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<PRE>");
			}
		},
		ul: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-list-ul'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("insertUnorderedList", null);
			}
		},
		ol: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-list-ol'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("insertOrderedList", null);
			}
		},
		quote: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-quote-right'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("formatBlock", "<BLOCKQUOTE>");
			}
		},
		undo: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-undo'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("undo", null);
			}
		},
		redo: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-repeat'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("redo", null);
			}
		},
		bold: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-bold'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("bold", null);
			},
			activeState: function() {
				return $document[0].queryCommandState('bold');
			}
		},
		justifyLeft: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-align-left'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("justifyLeft", null);
			},
			activeState: function() {
				return $document[0].queryCommandState('justifyLeft');
			}
		},
		justifyRight: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-align-right'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("justifyRight", null);
			},
			activeState: function() {
				return $document[0].queryCommandState('justifyRight');
			}
		},
		justifyCenter: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-align-center'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("justifyCenter", null);
			},
			activeState: function() {
				return $document[0].queryCommandState('justifyCenter');
			}
		},
		italics: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-italic'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("italic", null);
			},
			activeState: function() {
				return $document[0].queryCommandState('italic');
			}
		},
		clear: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-ban'></i></button>",
			action: function() {
				return this.$parent.wrapSelection("FormatBlock", "<div>");
			}
		},
		insertImage: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-picture-o'></i></button>",
			action: function() {
				var imageLink;
				imageLink = prompt("Please enter an image URL to insert", 'http://');
				if (imageLink !== '') {
					return this.$parent.wrapSelection('insertImage', imageLink);
				}
			}
		},
		insertLink: {
			display: "<button type='button' ng-click='action()' ng-class='displayActiveToolClass(active)'><i class='fa fa-chain'></i></button>",
			action: function() {
				var urlLink;
				urlLink = prompt("Please enter an URL to insert", 'http://');
				if (urlLink !== '') {
					return this.$parent.wrapSelection('createLink', urlLink);
				}
			}
		}
	}, ($rootScope.textAngularTools != null)? $rootScope.textAngularTools : {});
	
	// ngSanitize is a requirement for the module so this shouldn't cause any trouble
	var sanitizationWrapper = function(html) {
		return $sce.trustAsHtml(html);
	};
	
	return {
		require: 'ngModel',
		scope: {},
		restrict: "EA",
		link: function(scope, element, attrs, ngModel) {
			var group, groupElement, keydown, keyup, tool, toolElement; //all these vars should not be accessable outside this directive
			// get the settings from the defaults and add our specific functions that need to be on the scope
			angular.extend(scope, $rootScope.textAngularOpts, {
				// This must be called within a $apply or the ngModel value will not be updated correctly
				compileHtml: function(html) {
					// this refers to the scope
					var compHtml = angular.element("<div>").append(html).html().replace(/(class="(.*?)")|(class='(.*?)')/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/style=("|')(.*?)("|')/g, "");
					if (scope.showHtml === "load") {
						scope.text = sanitizationWrapper(compHtml);
						scope.html = sanitizationWrapper(compHtml.replace(/</g, "&lt;"));
						scope.showHtml = scope.showHtmlDefault || false;
					} else if (scope.showHtml) { // update the raw HTML view
						scope.text = sanitizationWrapper(compHtml);
					} else { // update the WYSIWYG view
						scope.html = sanitizationWrapper(compHtml.replace(/</g, "&lt;"));
					}
					ngModel.$setViewValue(compHtml);
				},
				// wraps the selection in the provided tag / execCommand function.
				wrapSelection: function(command, opt, updateDisplay) {
					// the default value for updateDisplay is true
					if (updateDisplay == null) updateDisplay = true;
					document.execCommand(command, false, opt);
					// refocus on the shown display element, this fixes a display bug when using :focus styles to outline the box. You still have focus on the text/html input it just doesn't show up
					if (scope.showHtml)
						scope.displayElements.text[0].focus();
					else
						scope.displayElements.html[0].focus();
					// note that wrapSelection is called via ng-click in the tool plugins so we are already within a $apply
					if (updateDisplay) scope.updateDisplay();
				},
				// due to restritions on compileHtml this must also be called in a scope.$apply - this is really a convenience function for compileHtml anyway.
				updateDisplay: function() {
					scope.compileHtml((!scope.showHtml)? scope.displayElements.html.html() : scope.displayElements.text.html());
				},
				showHtml: false
			});
			// setup the options from the optional attributes
			if (!!attrs.taToolbar)					scope.toolbar = scope.$eval(attrs.taToolbar);
			if (!!attrs.taToolbarClass)				scope.classes.toolbar = attrs.taToolbarClass;
			if (!!attrs.taToolbarGroupClass)		scope.classes.toolbarGroup = attrs.taToolbarGroupClass;
			if (!!attrs.taToolbarButtonClass)		scope.classes.toolbarButton = attrs.taToolbarButtonClass;
			if (!!attrs.taToolbarActiveButtonClass)	scope.classes.toolbarButtonActive = attrs.taToolbarActiveButtonClass;
			if (!!attrs.taTextEditorClass)			scope.classes.textEditor = attrs.taTextEditorClass;
			if (!!attrs.taHtmlEditorClass)			scope.classes.htmlEditor = attrs.taHtmlEditorClass;
			
			// Setup the HTML elements as variable references for use later
			scope.displayElements = {
				toolbar: angular.element("<div></div>"),
				text: angular.element("<pre contentEditable='true' ng-show='showHtml' ng-bind-html='html' ></pre>"),
				html: angular.element("<div contentEditable='true' ng-hide='showHtml' ng-bind-html='text' ></div>")
			};
			// add the main elements to the origional element
			element.append(scope.displayElements.toolbar);
			element.append(scope.displayElements.text);
			element.append(scope.displayElements.html);
			
			// compile the scope with the text and html elements only - if we do this with the main element it causes a compile loop
			$compile(scope.displayElements.text)(scope);
			$compile(scope.displayElements.html)(scope);
			
			// add the classes manually last
			element.addClass("ta-root");
			scope.displayElements.toolbar.addClass("ta-toolbar " + scope.classes.toolbar);
			scope.displayElements.text.addClass("ta-text ta-editor " + scope.classes.textEditor);
			scope.displayElements.html.addClass("ta-html ta-editor " + scope.classes.textEditor);
			
			scope.tools = {}; // Keep a reference for updating the active states later
			// create the tools in the toolbar
			for (var _i = 0; _i < scope.toolbar.length; _i++) {
				// setup the toolbar group
				group = scope.toolbar[_i];
				groupElement = angular.element("<div></div>");
				groupElement.addClass(scope.classes.toolbarGroup);
				for (var _j = 0; _j < group.length; _j++) {
					// init and add the tools to the group
					tool = group[_j]; // a tool name (key name from textAngularTools struct)
					toolElement = angular.element($rootScope.textAngularTools[tool].display);
					toolElement.addClass(scope.classes.toolbarButton);
					toolElement.attr('unselectable', 'on'); // important to not take focus from the main text/html entry
					var childScope = angular.extend(scope.$new(true), $rootScope.textAngularTools[tool], { // add the tool specific functions
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
			ngModel.$render = function() {
				if(ngModel.$viewValue === undefined) return;
				// if the editors aren't focused they need to be updated, otherwise they are doing the updating
				if (!($document[0].activeElement === scope.displayElements.html[0]) && !($document[0].activeElement === scope.displayElements.text[0])) {
					var val = ngModel.$viewValue || ''; // in case model is null
					scope.text = sanitizationWrapper(val);
					scope.html = sanitizationWrapper(val.replace(/</g, "&lt;"));
				}
			};
			
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
				if (this.bUpdateSelectedStyles) $timeout(this.updateSelectedStyles, 200); // used to update the active state when a key is held down, ie the left arrow
			};
			// start updating on keydown
			keydown = function(e) {
				scope.bUpdateSelectedStyles = true;
				scope.$apply(function() {
					scope.updateSelectedStyles();
				});
			};
			scope.displayElements.html.on('keydown', keydown);
			scope.displayElements.text.on('keydown', keydown);
			// stop updating on key up and update the display/model
			keyup = function(e) {
				scope.bUpdateSelectedStyles = false;
				scope.$apply(scope.updateDisplay);
			};
			scope.displayElements.html.on('keyup', keyup);
			scope.displayElements.text.on('keyup', keyup);
			// update the toolbar active states when we click somewhere in the text/html boxed
			mouseup = function(e) {
				scope.$apply(function() {
					scope.updateSelectedStyles();
				});
			};
			scope.displayElements.html.on('mouseup', mouseup);
			scope.displayElements.text.on('mouseup', mouseup);
		}
	};
});
