"use strict";

const assert = require("liberica").assert;

describe("index", function() {
  const BusinessError = require("../../index").BusinessError;
  it("BusinessError is available", function() {
    assert.isFunction(BusinessError);
  });
});
