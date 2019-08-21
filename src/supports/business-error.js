'use strict';

const util = require('util');

function BusinessError(name, message, opts = {}) {
  Error.call(this, message);
  this.name = name;
  this.message = message;
  for (const fieldName in opts) {
    if (opts[fieldName] !== undefined) {
      this[fieldName] = opts[fieldName];
    }
  }
  const oldLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = 64;
  Error.captureStackTrace(this, this.constructor);
  Error.stackTraceLimit = oldLimit;
}
util.inherits(BusinessError, Error);

module.exports = BusinessError;
