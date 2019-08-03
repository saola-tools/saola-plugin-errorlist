'use strict';

var Devebot = require('devebot');
var lodash = Devebot.require('lodash');

function Example(params) {
  params = params || {};

  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();
};

Example.referenceHash = {
};

module.exports = Example;
