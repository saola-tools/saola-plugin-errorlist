'use strict';

var assert = require('liberica').assert;

describe('index', function() {
  var BusinessError = require('../../index').BusinessError;
  it('BusinessError is available', function() {
    assert.isFunction(BusinessError);
  });
});
