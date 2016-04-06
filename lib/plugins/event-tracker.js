/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var delegate = require('delegate');
var getAttributes = require('dom-utils/src/get-attributes');
var camelCase = require('../utilities').camelCase;
var createFieldsObj = require('../utilities').createFieldsObj;
var defaults = require('../utilities').defaults;
var provide = require('../provide');



/**
 * Registers declarative event tracking.
 * @constructor
 * @param {Object} tracker Passed internally by analytics.js
 * @param {?Object} opts Passed by the require command.
 */
function EventTracker(tracker, opts) {

  // Feature detects to prevent errors in unsupporting browsers.
  if (!window.addEventListener) return;

  this.opts = defaults(opts, {
    events: ['click', 'submit', 'focus'],
    attributePrefix: 'ga-',
    fieldsObj: null,
    hitFilter: null
  });

  this.tracker = tracker;

  // Binds methods.
  this.handleEvents = this.handleEvents.bind(this)

  var selector = '[' + this.opts.attributePrefix + 'on]';


  this.delegates = {};
  this.opts.events.forEach(function(event) {
    this.delegates[event] = delegate(
        document, selector, event, this.handleEvents);

  }.bind(this));

  // this.delegate = delegate(document, selector,
  //     'focus', this.handleEvents, true);
}


/**
 * Handles all clicks on elements with event attributes.
 * @param {Event} event The DOM click event.
 */
EventTracker.prototype.handleEvents = function(event) {

  var element = event.delegateTarget;
  var prefix = this.opts.attributePrefix;

  var defaultFields = {};
  var attributes = getAttributes(element);

  Object.keys(attributes).forEach(function(attribute) {
    if (attribute.indexOf(prefix) === 0 && attribute != prefix + 'on') {
      var value = attributes[attribute];

      // Detects Boolean value strings.
      if (value == 'true') value = true;
      if (value == 'false') value = false;

      var field = camelCase(attribute.slice(prefix.length));
      defaultFields[field] = value;
    }
  });

  this.tracker.send(defaultFields.hitType || 'event', createFieldsObj(
      defaultFields, this.opts.fieldsObj, this.tracker, this.opts.hitFilter));
};


/**
 * Removes all event listeners and instance properties.
 */
EventTracker.prototype.remove = function() {
  this.delegate.destroy();
  this.delegate = null;
  this.tracker = null;
  this.opts = null;
};


provide('eventTracker', EventTracker);
