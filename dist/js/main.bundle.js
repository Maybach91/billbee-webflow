/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 323:
/***/ (function(module) {

(function (global, factory) {
   true ? module.exports = factory() : 0;
})(this, function () {
  'use strict';

  var lang = {
    en: {
      required: "This field is required",
      email: "This field requires a valid e-mail address",
      number: "This field requires a number",
      integer: "This field requires an integer value",
      url: "This field requires a valid website URL",
      tel: "This field requires a valid telephone number",
      maxlength: "This fields length must be < ${1}",
      minlength: "This fields length must be > ${1}",
      min: "Minimum value for this field is ${1}",
      max: "Maximum value for this field is ${1}",
      pattern: "Please match the requested format",
      equals: "The two fields do not match"
    }
  };

  function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) {}

    return el;
  }

  function tmpl(o) {
    var _arguments = arguments;
    return this.replace(/\${([^{}]*)}/g, function (a, b) {
      return _arguments[b];
    });
  }

  function groupedElemCount(input) {
    return input.pristine.self.form.querySelectorAll('input[name="' + input.getAttribute('name') + '"]:checked').length;
  }

  function mergeConfig(obj1, obj2) {
    for (var attr in obj2) {
      if (!(attr in obj1)) {
        obj1[attr] = obj2[attr];
      }
    }

    return obj1;
  }

  var defaultConfig = {
    classTo: 'form-group',
    errorClass: 'has-danger',
    successClass: 'has-success',
    errorTextParent: 'form-group',
    errorTextTag: 'div',
    errorTextClass: 'text-help'
  };
  var PRISTINE_ERROR = 'pristine-error';
  var SELECTOR = "input:not([type^=hidden]):not([type^=submit]), select, textarea";
  var ALLOWED_ATTRIBUTES = ["required", "min", "max", 'minlength', 'maxlength', 'pattern'];
  var EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var MESSAGE_REGEX = /-message(?:-([a-z]{2}(?:_[A-Z]{2})?))?/; // matches, -message, -message-en, -message-en_US

  var currentLocale = 'en';
  var validators = {};

  var _ = function _(name, validator) {
    validator.name = name;
    if (validator.priority === undefined) validator.priority = 1;
    validators[name] = validator;
  };

  _('text', {
    fn: function fn(val) {
      return true;
    },
    priority: 0
  });

  _('required', {
    fn: function fn(val) {
      return this.type === 'radio' || this.type === 'checkbox' ? groupedElemCount(this) : val !== undefined && val !== '';
    },
    priority: 99,
    halt: true
  });

  _('email', {
    fn: function fn(val) {
      return !val || EMAIL_REGEX.test(val);
    }
  });

  _('number', {
    fn: function fn(val) {
      return !val || !isNaN(parseFloat(val));
    },
    priority: 2
  });

  _('integer', {
    fn: function fn(val) {
      return !val || /^\d+$/.test(val);
    }
  });

  _('minlength', {
    fn: function fn(val, length) {
      return !val || val.length >= parseInt(length);
    }
  });

  _('maxlength', {
    fn: function fn(val, length) {
      return !val || val.length <= parseInt(length);
    }
  });

  _('min', {
    fn: function fn(val, limit) {
      return !val || (this.type === 'checkbox' ? groupedElemCount(this) >= parseInt(limit) : parseFloat(val) >= parseFloat(limit));
    }
  });

  _('max', {
    fn: function fn(val, limit) {
      return !val || (this.type === 'checkbox' ? groupedElemCount(this) <= parseInt(limit) : parseFloat(val) <= parseFloat(limit));
    }
  });

  _('pattern', {
    fn: function fn(val, pattern) {
      var m = pattern.match(new RegExp('^/(.*?)/([gimy]*)$'));
      return !val || new RegExp(m[1], m[2]).test(val);
    }
  });

  _('equals', {
    fn: function fn(val, otherFieldSelector) {
      var other = document.querySelector(otherFieldSelector);
      return other && (!val && !other.value || other.value === val);
    }
  });

  function Pristine(form, config, live) {
    var self = this;
    init(form, config, live);

    function init(form, config, live) {
      form.setAttribute("novalidate", "true");
      self.form = form;
      self.config = mergeConfig(config || {}, defaultConfig);
      self.live = !(live === false);
      self.fields = Array.from(form.querySelectorAll(SELECTOR)).map(function (input) {
        var fns = [];
        var params = {};
        var messages = {};
        [].forEach.call(input.attributes, function (attr) {
          if (/^data-pristine-/.test(attr.name)) {
            var name = attr.name.substr(14);
            var messageMatch = name.match(MESSAGE_REGEX);

            if (messageMatch !== null) {
              var locale = messageMatch[1] === undefined ? 'en' : messageMatch[1];
              if (!messages.hasOwnProperty(locale)) messages[locale] = {};
              messages[locale][name.slice(0, name.length - messageMatch[0].length)] = attr.value;
              return;
            }

            if (name === 'type') name = attr.value;

            _addValidatorToField(fns, params, name, attr.value);
          } else if (~ALLOWED_ATTRIBUTES.indexOf(attr.name)) {
            _addValidatorToField(fns, params, attr.name, attr.value);
          } else if (attr.name === 'type') {
            _addValidatorToField(fns, params, attr.value);
          }
        });
        fns.sort(function (a, b) {
          return b.priority - a.priority;
        });
        self.live && input.addEventListener(!~['radio', 'checkbox'].indexOf(input.getAttribute('type')) ? 'input' : 'change', function (e) {
          self.validate(e.target);
        }.bind(self));
        return input.pristine = {
          input: input,
          validators: fns,
          params: params,
          messages: messages,
          self: self
        };
      }.bind(self));
    }

    function _addValidatorToField(fns, params, name, value) {
      var validator = validators[name];

      if (validator) {
        fns.push(validator);

        if (value) {
          var valueParams = name === "pattern" ? [value] : value.split(',');
          valueParams.unshift(null); // placeholder for input's value

          params[name] = valueParams;
        }
      }
    }
    /***
     * Checks whether the form/input elements are valid
     * @param input => input element(s) or a jquery selector, null for full form validation
     * @param silent => do not show error messages, just return true/false
     * @returns {boolean} return true when valid false otherwise
     */


    self.validate = function (input, silent) {
      silent = input && silent === true || input === true;
      var fields = self.fields;

      if (input !== true && input !== false) {
        if (input instanceof HTMLElement) {
          fields = [input.pristine];
        } else if (input instanceof NodeList || input instanceof (window.$ || Array) || input instanceof Array) {
          fields = Array.from(input).map(function (el) {
            return el.pristine;
          });
        }
      }

      var valid = true;

      for (var i = 0; fields[i]; i++) {
        var field = fields[i];

        if (_validateField(field)) {
          !silent && _showSuccess(field);
        } else {
          valid = false;
          !silent && _showError(field);
        }
      }

      return valid;
    };
    /***
     * Get errors of a specific field or the whole form
     * @param input
     * @returns {Array|*}
     */


    self.getErrors = function (input) {
      if (!input) {
        var erroneousFields = [];

        for (var i = 0; i < self.fields.length; i++) {
          var field = self.fields[i];

          if (field.errors.length) {
            erroneousFields.push({
              input: field.input,
              errors: field.errors
            });
          }
        }

        return erroneousFields;
      }

      if (input.tagName && input.tagName.toLowerCase() === "select") {
        return input.pristine.errors;
      }

      return input.length ? input[0].pristine.errors : input.pristine.errors;
    };
    /***
     * Validates a single field, all validator functions are called and error messages are generated
     * when a validator fails
     * @param field
     * @returns {boolean}
     * @private
     */


    function _validateField(field) {
      var errors = [];
      var valid = true;

      for (var i = 0; field.validators[i]; i++) {
        var validator = field.validators[i];
        var params = field.params[validator.name] ? field.params[validator.name] : [];
        params[0] = field.input.value;

        if (!validator.fn.apply(field.input, params)) {
          valid = false;

          if (typeof validator.msg === "function") {
            errors.push(validator.msg(field.input.value, params));
          } else if (typeof validator.msg === "string") {
            errors.push(tmpl.apply(validator.msg, params));
          } else if (validator.msg === Object(validator.msg) && validator.msg[currentLocale]) {
            // typeof generates unnecessary babel code
            errors.push(tmpl.apply(validator.msg[currentLocale], params));
          } else if (field.messages[currentLocale] && field.messages[currentLocale][validator.name]) {
            errors.push(tmpl.apply(field.messages[currentLocale][validator.name], params));
          } else if (lang[currentLocale] && lang[currentLocale][validator.name]) {
            errors.push(tmpl.apply(lang[currentLocale][validator.name], params));
          }

          if (validator.halt === true) {
            break;
          }
        }
      }

      field.errors = errors;
      return valid;
    }
    /***
     * Add a validator to a specific dom element in a form
     * @param elem => The dom element where the validator is applied to
     * @param fn => validator function
     * @param msg => message to show when validation fails. Supports templating. ${0} for the input's value, ${1} and
     * so on are for the attribute values
     * @param priority => priority of the validator function, higher valued function gets called first.
     * @param halt => whether validation should stop for this field after current validation function
     */


    self.addValidator = function (elem, fn, msg, priority, halt) {
      if (elem instanceof HTMLElement) {
        elem.pristine.validators.push({
          fn: fn,
          msg: msg,
          priority: priority,
          halt: halt
        });
        elem.pristine.validators.sort(function (a, b) {
          return b.priority - a.priority;
        });
      } else {
        console.warn("The parameter elem must be a dom element");
      }
    };
    /***
     * An utility function that returns a 2-element array, first one is the element where error/success class is
     * applied. 2nd one is the element where error message is displayed. 2nd element is created if doesn't exist and cached.
     * @param field
     * @returns {*}
     * @private
     */


    function _getErrorElements(field) {
      if (field.errorElements) {
        return field.errorElements;
      }

      var errorClassElement = findAncestor(field.input, self.config.classTo);
      var errorTextParent = null,
          errorTextElement = null;

      if (self.config.classTo === self.config.errorTextParent) {
        errorTextParent = errorClassElement;
      } else {
        errorTextParent = errorClassElement.querySelector('.' + self.config.errorTextParent);
      }

      if (errorTextParent) {
        errorTextElement = errorTextParent.querySelector('.' + PRISTINE_ERROR);

        if (!errorTextElement) {
          errorTextElement = document.createElement(self.config.errorTextTag);
          errorTextElement.className = PRISTINE_ERROR + ' ' + self.config.errorTextClass;
          errorTextParent.appendChild(errorTextElement);
          errorTextElement.pristineDisplay = errorTextElement.style.display;
        }
      }

      return field.errorElements = [errorClassElement, errorTextElement];
    }

    function _showError(field) {
      var errorElements = _getErrorElements(field);

      var errorClassElement = errorElements[0],
          errorTextElement = errorElements[1];

      if (errorClassElement) {
        errorClassElement.classList.remove(self.config.successClass);
        errorClassElement.classList.add(self.config.errorClass);
      }

      if (errorTextElement) {
        errorTextElement.innerHTML = field.errors.join('<br/>');
        errorTextElement.style.display = errorTextElement.pristineDisplay || '';
      }
    }
    /***
     * Adds error to a specific field
     * @param input
     * @param error
     */


    self.addError = function (input, error) {
      input = input.length ? input[0] : input;
      input.pristine.errors.push(error);

      _showError(input.pristine);
    };

    function _removeError(field) {
      var errorElements = _getErrorElements(field);

      var errorClassElement = errorElements[0],
          errorTextElement = errorElements[1];

      if (errorClassElement) {
        // IE > 9 doesn't support multiple class removal
        errorClassElement.classList.remove(self.config.errorClass);
        errorClassElement.classList.remove(self.config.successClass);
      }

      if (errorTextElement) {
        errorTextElement.innerHTML = '';
        errorTextElement.style.display = 'none';
      }

      return errorElements;
    }

    function _showSuccess(field) {
      var errorClassElement = _removeError(field)[0];

      errorClassElement && errorClassElement.classList.add(self.config.successClass);
    }
    /***
     * Resets the errors
     */


    self.reset = function () {
      for (var i = 0; self.fields[i]; i++) {
        self.fields[i].errorElements = null;
      }

      Array.from(self.form.querySelectorAll('.' + PRISTINE_ERROR)).map(function (elem) {
        elem.parentNode.removeChild(elem);
      });
      Array.from(self.form.querySelectorAll('.' + self.config.classTo)).map(function (elem) {
        elem.classList.remove(self.config.successClass);
        elem.classList.remove(self.config.errorClass);
      });
    };
    /***
     * Resets the errors and deletes all pristine fields
     */


    self.destroy = function () {
      self.reset();
      self.fields.forEach(function (field) {
        delete field.input.pristine;
      });
      self.fields = [];
    };

    self.setGlobalConfig = function (config) {
      defaultConfig = config;
    };

    return self;
  }
  /***
   *
   * @param name => Name of the global validator
   * @param fn => validator function
   * @param msg => message to show when validation fails. Supports templating. ${0} for the input's value, ${1} and
   * so on are for the attribute values
   * @param priority => priority of the validator function, higher valued function gets called first.
   * @param halt => whether validation should stop for this field after current validation function
   */


  Pristine.addValidator = function (name, fn, msg, priority, halt) {
    _(name, {
      fn: fn,
      msg: msg,
      priority: priority,
      halt: halt
    });
  };

  Pristine.addMessages = function (locale, messages) {
    var langObj = lang.hasOwnProperty(locale) ? lang[locale] : lang[locale] = {};
    Object.keys(messages).forEach(function (key, index) {
      langObj[key] = messages[key];
    });
  };

  Pristine.setLocale = function (locale) {
    currentLocale = locale;
  };

  return Pristine;
});

/***/ }),

/***/ 969:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(15);
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports
;

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "", "",{"version":3,"sources":[],"names":[],"mappings":"","sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 645:
/***/ ((module) => {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join('');
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === 'string') {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, '']];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ }),

/***/ 15:
/***/ ((module) => {

"use strict";


function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

module.exports = function cssWithMappingToString(item) {
  var _item = _slicedToArray(item, 4),
      content = _item[1],
      cssMapping = _item[3];

  if (typeof btoa === 'function') {
    // eslint-disable-next-line no-undef
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || '').concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
  }

  return [content].join('\n');
};

/***/ }),

/***/ 379:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isOldIE = function isOldIE() {
  var memo;
  return function memorize() {
    if (typeof memo === 'undefined') {
      // Test for IE <= 9 as proposed by Browserhacks
      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
      // Tests for existence of standard globals is to allow style-loader
      // to operate correctly into non-standard environments
      // @see https://github.com/webpack-contrib/style-loader/issues/177
      memo = Boolean(window && document && document.all && !window.atob);
    }

    return memo;
  };
}();

var getTarget = function getTarget() {
  var memo = {};
  return function memorize(target) {
    if (typeof memo[target] === 'undefined') {
      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
        try {
          // This will throw an exception if access to iframe is blocked
          // due to cross-origin restrictions
          styleTarget = styleTarget.contentDocument.head;
        } catch (e) {
          // istanbul ignore next
          styleTarget = null;
        }
      }

      memo[target] = styleTarget;
    }

    return memo[target];
  };
}();

var stylesInDom = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDom.length; i++) {
    if (stylesInDom[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var index = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3]
    };

    if (index !== -1) {
      stylesInDom[index].references++;
      stylesInDom[index].updater(obj);
    } else {
      stylesInDom.push({
        identifier: identifier,
        updater: addStyle(obj, options),
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function insertStyleElement(options) {
  var style = document.createElement('style');
  var attributes = options.attributes || {};

  if (typeof attributes.nonce === 'undefined') {
    var nonce =  true ? __webpack_require__.nc : 0;

    if (nonce) {
      attributes.nonce = nonce;
    }
  }

  Object.keys(attributes).forEach(function (key) {
    style.setAttribute(key, attributes[key]);
  });

  if (typeof options.insert === 'function') {
    options.insert(style);
  } else {
    var target = getTarget(options.insert || 'head');

    if (!target) {
      throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
    }

    target.appendChild(style);
  }

  return style;
}

function removeStyleElement(style) {
  // istanbul ignore if
  if (style.parentNode === null) {
    return false;
  }

  style.parentNode.removeChild(style);
}
/* istanbul ignore next  */


var replaceText = function replaceText() {
  var textStore = [];
  return function replace(index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
}();

function applyToSingletonTag(style, index, remove, obj) {
  var css = remove ? '' : obj.media ? "@media ".concat(obj.media, " {").concat(obj.css, "}") : obj.css; // For old IE

  /* istanbul ignore if  */

  if (style.styleSheet) {
    style.styleSheet.cssText = replaceText(index, css);
  } else {
    var cssNode = document.createTextNode(css);
    var childNodes = style.childNodes;

    if (childNodes[index]) {
      style.removeChild(childNodes[index]);
    }

    if (childNodes.length) {
      style.insertBefore(cssNode, childNodes[index]);
    } else {
      style.appendChild(cssNode);
    }
  }
}

function applyToTag(style, options, obj) {
  var css = obj.css;
  var media = obj.media;
  var sourceMap = obj.sourceMap;

  if (media) {
    style.setAttribute('media', media);
  } else {
    style.removeAttribute('media');
  }

  if (sourceMap && typeof btoa !== 'undefined') {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    while (style.firstChild) {
      style.removeChild(style.firstChild);
    }

    style.appendChild(document.createTextNode(css));
  }
}

var singleton = null;
var singletonCounter = 0;

function addStyle(obj, options) {
  var style;
  var update;
  var remove;

  if (options.singleton) {
    var styleIndex = singletonCounter++;
    style = singleton || (singleton = insertStyleElement(options));
    update = applyToSingletonTag.bind(null, style, styleIndex, false);
    remove = applyToSingletonTag.bind(null, style, styleIndex, true);
  } else {
    style = insertStyleElement(options);
    update = applyToTag.bind(null, style, options);

    remove = function remove() {
      removeStyleElement(style);
    };
  }

  update(obj);
  return function updateStyle(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
        return;
      }

      update(obj = newObj);
    } else {
      remove();
    }
  };
}

module.exports = function (list, options) {
  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
  // tags it will allow on a page

  if (!options.singleton && typeof options.singleton !== 'boolean') {
    options.singleton = isOldIE();
  }

  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    if (Object.prototype.toString.call(newList) !== '[object Array]') {
      return;
    }

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDom[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDom[_index].references === 0) {
        stylesInDom[_index].updater();

        stylesInDom.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ 695:
/***/ ((module) => {

"use strict";
module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzOTE2IDE1MjQiPjx0aXRsZT5sb2dvLW9uLWRhcmstYmc8L3RpdGxlPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik04MjIgMzM2bDM4NyAyMTguOXY0MzcuOWwtMzg3IDIxOC45LTM4Ny0yMTguOVY1NTQuOXoiLz48cGF0aCBmaWxsPSIjOEVENkZCIiBkPSJNMTEzOS45IDk3Ny43bC0zMDUuMSAxNzIuNnYtMTM0LjRsMTkwLjEtMTA0LjYgMTE1IDY2LjR6bTIwLjktMTguOVY1OTcuOWwtMTExLjYgNjQuNXYyMzJsMTExLjYgNjQuNHptLTY1Ny45IDE4LjlMODA4IDExNTAuM3YtMTM0LjRMNjE3LjggOTExLjNsLTExNC45IDY2LjR6TTQ4MiA5NTguOFY1OTcuOWwxMTEuNiA2NC41djIzMkw0ODIgOTU4Ljh6bTEzLjEtMzg0LjNsMzEyLjktMTc3djEyOS45TDYwNy41IDYzNy43bC0xLjYuOS0xMTAuOC02NC4xem02NTIuNiAwbC0zMTIuOS0xNzd2MTI5LjlsMjAwLjUgMTEwLjIgMS42LjkgMTEwLjgtNjR6Ii8+PHBhdGggZmlsbD0iIzFDNzhDMCIgZD0iTTgwOCA5ODUuM0w2MjAuNCA4ODIuMVY2NzcuOEw4MDggNzg2LjF2MTk5LjJ6bTI2LjggMGwxODcuNi0xMDMuMVY2NzcuOEw4MzQuOCA3ODYuMXYxOTkuMnptLTEzLjQtMjA3ek02MzMuMSA2NTQuMmwxODguMy0xMDMuNSAxODguMyAxMDMuNS0xODguMyAxMDguNy0xODguMy0xMDguN3oiLz48cGF0aCBmaWxsPSIjRjVGQUZBIiBkPSJNMTU5OS4zIDkxMi4zaDgyLjVsODQuMS0yODAuMmgtODAuNGwtNDkuOCAxOTguOC01My4xLTE5OC44SDE1MTNsLTUzLjYgMTk4LjgtNDkuMy0xOTguOGgtODAuNGw4My42IDI4MC4yaDgyLjVsNTItMTc5LjUgNTEuNSAxNzkuNXpNMTc3MC4yIDc3M2MwIDg0LjEgNTcuMyAxNDYuMyAxNDcuNCAxNDYuMyA2OS43IDAgMTA3LjItNDEuOCAxMTcuOS02MS42bC00OC44LTM3Yy04IDExLjgtMzAgMzQuMy02OC4xIDM0LjMtNDEuMyAwLTcxLjMtMjYuOC03Mi45LTY0LjNIMjA0M2MuNS01LjQuNS0xMC43LjUtMTYuMSAwLTkxLjYtNDkuMy0xNDkuNS0xMzYuMS0xNDkuNS03OS45IDAtMTM3LjIgNjMuMi0xMzcuMiAxNDcuOXptNzcuNy0zMC42YzMuMi0zMi4xIDI1LjctNTYuOCA2MC42LTU2LjggMzMuOCAwIDU4LjQgMjIuNSA2MCA1Ni44aC0xMjAuNnptMjIzLjUgMTY5LjloNjkuN3YtMjguOWM3LjUgOS4xIDM1LjQgMzUuOSA4My4xIDM1LjkgODAuNCAwIDEzNy4yLTYwLjUgMTM3LjItMTQ2LjggMC04Ni44LTUyLjUtMTQ3LjMtMTMyLjktMTQ3LjMtNDguMiAwLTc2LjEgMjYuOC04My4xIDM2LjRWNTI0LjloLTczLjl2Mzg3LjR6bTcxLjgtMTM5LjNjMC01Mi41IDMxLjEtODIuNSA3MS44LTgyLjUgNDIuOSAwIDcxLjggMzMuOCA3MS44IDgyLjUgMCA0OS44LTMwIDgwLjktNzEuOCA4MC45LTQ1IDAtNzEuOC0zNi41LTcxLjgtODAuOXptMjQ3IDIzOS41aDczLjlWODgzLjNjNyA5LjEgMzQuOCAzNS45IDgzLjEgMzUuOSA4MC40IDAgMTMyLjktNjAuNSAxMzIuOS0xNDcuMyAwLTg1LjctNTYuOC0xNDYuOC0xMzcuMi0xNDYuOC00Ny43IDAtNzUuNiAyNi44LTgzLjEgMzYuNFY2MzJoLTY5Ljd2MzgwLjV6bTcxLjgtMjQxLjFjMC00NC41IDI2LjgtODAuOSA3MS44LTgwLjkgNDEuOCAwIDcxLjggMzEuMSA3MS44IDgwLjkgMCA0OC44LTI4LjkgODIuNS03MS44IDgyLjUtNDAuNyAwLTcxLjgtMzAtNzEuOC04Mi41em0yMzEuNSA1NC4xYzAgNTguOSA0OC4yIDkzLjggMTA1IDkzLjggMzIuMiAwIDUzLjYtOS42IDY4LjEtMjUuMmw0LjggMTguMmg2NS40VjczNC45YzAtNjIuNy0yNi44LTEwOS44LTExNi44LTEwOS44LTQyLjkgMC04NS4yIDE2LjEtMTEwLjQgMzMuMmwyNy45IDUwLjRjMjAuOS0xMC43IDQ2LjYtMTkuOCA3NC41LTE5LjggMzIuNyAwIDUwLjkgMTYuNiA1MC45IDQxLjN2MTguMmMtMTAuMi03LTMyLjItMTUuNS02MC42LTE1LjUtNjUuNC0uMS0xMDguOCAzNy40LTEwOC44IDkyLjZ6bTczLjktMi4yYzAtMjMgMTkuOC0zOS4xIDQ4LjItMzkuMXM0OC44IDE0LjUgNDguOCAzOS4xYzAgMjMuNi0yMC40IDM4LjYtNDguMiAzOC42cy00OC44LTE1LjUtNDguOC0zOC42em0zNDguOSAzMC42Yy00Ni42IDAtNzkuOC0zMy44LTc5LjgtODEuNCAwLTQ1IDI5LjUtODIgNzcuMi04MiAzMS42IDAgNTMuMSAxNS41IDY1LjQgMjYuOGwyMC45LTYyLjJjLTE4LjItMTMuOS00Ny4yLTMwLTg4LjQtMzAtODUuMiAwLTE0OSA2Mi43LTE0OSAxNDcuOXM2Mi4yIDE0Ni4zIDE0OS41IDE0Ni4zYzQwLjcgMCA3MS4zLTE3LjEgODcuMy0zMGwtMTkuOC02MC41Yy0xMi40IDEwLjEtMzQuOSAyNS4xLTYzLjMgMjUuMXptMTEwLjkgNTguNGg3My45Vjc2Ny42bDkzLjggMTQ0LjdoODYuOEwzMzc1LjYgNzU5bDk4LjYtMTI3aC04My4xbC05MCAxMTcuOXYtMjI1aC03My45djM4Ny40eiIvPjwvc3ZnPg==";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => module['default'] :
/******/ 				() => module;
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/************************************************************************/
(() => {
"use strict";

// EXTERNAL MODULE: ./src/js/vendor/pristine.js
var vendor_pristine = __webpack_require__(323);
var pristine_default = /*#__PURE__*/__webpack_require__.n(vendor_pristine);
// CONCATENATED MODULE: ./src/js/components/signup.js
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }



var SignUp = () => {
  // -----------------------
  // Variables Configuration
  // -----------------------
  var formConfig = {
    // Form Inputs
    formId: "registerform",
    passwordFieldId: "password",
    emailFieldId: "email",
    // API
    proxy: "https://api.allorigins.win/raw?url=",
    createAccountApiUrl: "https://app.billbee.io/api/v1/internalapi/createaccount",
    checkUsernameApiUrl: "https://app.billbee.io/api/v1/internalapi/checkusername?username=",
    loginUrl: "https://app.billbee.io/login",
    debug: true
  };
  var {
    formId,
    passwordFieldId,
    emailFieldId,
    proxy,
    loginUrl,
    debug
  } = formConfig;
  var {
    createAccountApiUrl,
    checkUsernameApiUrl
  } = formConfig; // ------------------
  // HTML Node Elements
  // ------------------

  var form = document.getElementById(formId); // Get the according password field as node

  var passwordField = document.getElementById(passwordFieldId); // Email Field as node

  var emailField = document.getElementById(emailFieldId); // create the pristine instance

  var pristine = new (pristine_default())(form); // SetUp API URLS
  // If we need a proxy (to avoid CORS conflicts) we need to prefix the url with it

  if (proxy.length) {
    createAccountApiUrl = "".concat(proxy).concat(createAccountApiUrl);
    checkUsernameApiUrl = "".concat(proxy).concat(checkUsernameApiUrl);
  } // -------------------
  // Password validation
  // -------------------
  // 8-20 Characters
  // min one letter
  // min one number


  var regEx = {
    charMin: new RegExp("^(?=.{8,})"),
    charMax: new RegExp("^(?=.{8,20}$)"),
    letter: new RegExp("^(?=.*[a-zA-Z])"),
    num: new RegExp("^(?=.*[0-9])")
  };
  var pwdText = {
    charMin: "Das Passwort muss <strong>mindestens 8 Zeichen</strong> lang sein.",
    letter: "Das Passwort muss aus mindestens <strong>einen Buchstaben</strong> bestehen.",
    charMax: "Das Passwort darf <strong>nicht über 20 Zeichen</strong> lang sein.",
    num: "Das Passwort muss aus mindestens <strong>einer Zahl</strong> bestehen."
  }; // go through every rule and show the error text (source: https://codepen.io/sha256/pen/KEjabq?editors=1010)

  Object.keys(regEx).forEach((key, index) => {
    pristine.addValidator(passwordField, function (value) {
      if (regEx[key].test(value)) {
        return true;
      }

      return false;
    }, pwdText[key], index, false);
  }); // Request Function

  function makeRequest(opts) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(opts.method, opts.url);

      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };

      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };

      if (opts.headers) {
        Object.keys(opts.headers).forEach(function (key) {
          xhr.setRequestHeader(key, opts.headers[key]);
        });
      }

      var params = opts.params; // We'll need to stringify if we've been given an object
      // If we have a string, this is skipped.

      if (params && typeof params === "object") {
        params = Object.keys(params).map(function (key) {
          return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
        }).join("&");
      }

      xhr.send(params);
    });
  } // ------------------
  // E-Mail API Request
  // ------------------
  // Checks if the EMAIL is already registered on the API endpoint


  pristine.addValidator(emailField, /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(function* (value) {
      if (!this.validity.typeMismatch) {
        try {
          this.parentNode.classList.add('is-loading');
          yield checkUsernameExistence(value);
        } catch (_unused) {
          return false;
        }
      }
    });

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }(), "E-Mail wurde bereits registriert, Login?", 1, false); // Init a timeout variable to be used for email check

  var timeout = null;

  function checkUsernameExistence(_x2) {
    return _checkUsernameExistence.apply(this, arguments);
  } // Post Function to create the account


  function _checkUsernameExistence() {
    _checkUsernameExistence = _asyncToGenerator(function* (value) {
      return new Promise(function (resolve, reject) {
        // Clear the timeout if it has already been set.
        // This will prevent the previous task from executing
        // if it has been less than <MILLISECONDS>
        clearTimeout(timeout); // Make a new timeout set to go off in 1000ms (1 second)

        timeout = setTimeout( /*#__PURE__*/_asyncToGenerator(function* () {
          debug && console.time("checkUserNameExistence duration: ");
          debug && console.count("username check count: ");
          yield makeRequest({
            method: "GET",
            url: checkUsernameApiUrl + value
          }).then(data => {
            if (data.length) {
              debug && console.info("%c ".concat(value, " ist frei"), "color: #009d55; background-color:#c4eac1");
              emailField.parentNode.classList.remove('is-loading');
              emailField.parentNode.classList.add('is-successful');
              setTimeout(function () {
                emailField.parentNode.classList.remove('is-successful');
              }, 2000);
              resolve(data);
              return true;
            } else {
              //emailField.parentNode.getElementsByClassName('pristine-error')[0].remove();
              debug && console.error("%c ".concat(value, " ist nicht frei"), "color: #d60202");
              pristine.addError(emailField, "E-Mail bereits registriert, <a target=\"_blank\" href=\"".concat(loginUrl, "\">Login</a>?"));
              emailField.parentNode.classList.remove('is-loading');
              reject(data);
              return false;
            }
          }).catch(err => {
            if (err.status === 409) {
              debug && console.error("%c ".concat(value, " ist nicht frei"), "color: #d60202");
              pristine.addError(emailField, "E-Mail bereits registriert, <a target=\"_blank\" href=\"".concat(loginUrl, "\">Login</a>?"));
              emailField.parentNode.classList.remove('is-loading');
              reject(err);
              return false;
            } else {
              if (debug) {
                console.group("Server Error");
                console.info("Server not reachable, blocked because of CORS policy, try setting a proxy?");
                console.error(err);
                console.groupEnd();
              }

              emailField.parentNode.classList.remove('is-loading');
              reject(err);
              throw new Error("Server not reachable, blocked because of CORS policy, try setting a proxy?", err);
              return false;
            }
          });
          debug && console.timeEnd("checkUserNameExistence duration: ");
        }), 400);
      });
    });
    return _checkUsernameExistence.apply(this, arguments);
  }

  function sendDataToCreateAccount(_x3) {
    return _sendDataToCreateAccount.apply(this, arguments);
  }

  function _sendDataToCreateAccount() {
    _sendDataToCreateAccount = _asyncToGenerator(function* (formData) {
      // Bind the FormData object and the form element
      var FD = formData; // We need to set the value of acceptterms to true, if its checked

      FD.get("acceptterms") == "on" ? FD.set("acceptterms", true) : FD.set("acceptterms", false);
      var FormDataObject = Object.fromEntries(FD);
      var FormDataJson = JSON.stringify(FormDataObject);

      if (debug) {
        console.group("About to sending follwing formData:");
        console.table(FormDataObject);
        console.groupEnd();
      }

      makeRequest({
        method: "POST",
        url: createAccountApiUrl,
        params: FormDataJson,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        }
      }).then(response => {
        var responseJson = JSON.parse(response);

        if (debug) {
          console.group("Success POST Response data:");
          console.log(responseJson);
          console.groupEnd();
          console.log(responseJson.Data.ErrorMessage);
          console.log("Redirect User according to response OnTimeLogiUrl (deactivated in debug mode):");
          console.log(responseJson.Data.OneTimeLoginUrl);
        } // Redirect user according to response redirect url


        if (!debug) {
          window.location.href = responseJson.Data.OneTimeLoginUrl;
        }

        ;
      }).catch(err => {
        if (debug) {
          console.log("damn, error");
          console.error(err);
        }

        pristine.addError(form, "Server-Fehler bei Senden der Daten, bitte später probieren.");
      }); // @ToDo: Redirect user according to response.Data.OneTimeLoginUrl
      // @ToDo: Add Track Signup
    });
    return _sendDataToCreateAccount.apply(this, arguments);
  }

  function onSubmit(_x4, _x5) {
    return _onSubmit.apply(this, arguments);
  } // Validate on Submit (and on input)


  function _onSubmit() {
    _onSubmit = _asyncToGenerator(function* (formData, emailValue) {
      yield checkUsernameExistence(emailValue).then(() => {
        debug && console.log("sendData");
        sendDataToCreateAccount(formData);
      }).then(() => {
        debug && console.log("SUCCESS EVERYTHING");
      }).catch(e => {
        debug && console.error(e);
      });
    });
    return _onSubmit.apply(this, arguments);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var formData = new FormData(this);
    var emailValue = emailField.value;
    debug && console.log("Form submitted."); // check if the form is valid

    var formValid = pristine.validate(); // returns true or false

    debug && console.log("Form is validated:", formValid);

    if (formValid) {
      debug && console.info("Form is valid, check username & sending data.");
      onSubmit(formData, emailValue).then(r => console.log('Successfull', r));
    } // Check, if the username is already registered against the API, if the email input is valid

    /*if (!pristine.getErrors(emailField).length) {
      checkUsernameExistence(emailField.value);
      debug &&
        console.info(
          "E-Mail input has no errors, check username for existence. (Othter fields can still have errors)"
        );
      // @ToDo: According to return of the function add a new Error to the email field
       // Register the username, when the form is valid
    }*/

  });
};

/* harmony default export */ const signup = (SignUp);
/*
jQuery(document).ready(function () {
  var form = document.getElementById("signup");

  form.onsubmit = function (e) {
    // stop the regular form submission
    e.preventDefault();

    if (jQuery("#btnCreateAccountDo").hasClass("disabled")) {
    } else {
      jQuery("#signup").css("display", "none");
      jQuery("#signingup").css("display", "inline");

      // collect the form data while iterating over the inputs
      var data = {};
      data["email"] = jQuery("#username").val();
      data["password"] = jQuery("#password").val();
      if (jQuery("#acceptterms").is(":checked")) data["acceptterms"] = true;
      else data["acceptterms"] = false;
      if (jQuery("#newsletter").is(":checked")) data["newsletter"] = true;
      else data["newsletter"] = false;

      console.log(JSON.stringify(data));

      signup(data);
    }
  };
});

function signup(data) {
  jQuery.ajax({
    type: "POST",
    url: "https://app.billbee.io/api/v1/internalapi/createaccount",
    data: JSON.stringify(data),
    dataType: "json",
    contentType: "application/json; charset=utf-8",
    crossDomain: true,
    success: function (response, status, jqXHR) {
      // ga('send', 'event', 'Account', 'signup');
      $FPROM.trackSignup(
        {
          email: data.email,
          uid: response.Data.UserId
        },
        function () {}
      );
      window.location.href = response.Data.OneTimeLoginUrl;
    },
    error: function (jqXHR, status) {
      console.log(jqXHR);
      alert("fail" + status.code);
    }
  });
}
*/
// EXTERNAL MODULE: ./src/images/webpack-logo.svg
var webpack_logo = __webpack_require__(695);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__(379);
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[1].use[1]!./node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[1].use[2]!./node_modules/sass-loader/dist/cjs.js??ruleSet[1].rules[1].use[3]!./node_modules/mini-css-extract-plugin/dist/loader.js!./node_modules/css-loader/dist/cjs.js??ruleSet[1].rules[5].use[1]!./node_modules/postcss-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/styles/index.scss
var styles = __webpack_require__(969);
// CONCATENATED MODULE: ./src/styles/index.scss
;
            

var options = {};

options.insert = "head";
options.singleton = false;

var update = injectStylesIntoStyleTag_default()(styles/* default */.Z, options);



/* harmony default export */ const src_styles = (styles/* default.locals */.Z.locals || {});
// CONCATENATED MODULE: ./src/index.js
;
signup(); // Test import of an asset

 // Test import of styles

 //import "./template.html.twig"
// Appending to the DOM
// const logo = document.createElement('img')
// logo.src = webpackLogo
//
// const heading = document.createElement('h1')
// heading.textContent = example()
//
// const app = document.querySelector('#root')
// app.append(logo, heading)
})();

/******/ })()
;