'use strict';

var Devebot = require('devebot');
var lodash = Devebot.require('lodash');

function Example(params) {
  params = params || {};

  var packageName = params.packageName;
  var sandboxConfig = params.sandboxConfig;
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  var errorManager = params.errorManager;

  var errorBuilder = errorManager.register(packageName, {
    errorCodes: sandboxConfig.errorCodes
  });

  console.log('Errorlist: %s', JSON.stringify(errorManager.getAllDescriptors(), null, 2));
};

Example.referenceHash = {
  errorManager: 'manager'
};

module.exports = Example;
