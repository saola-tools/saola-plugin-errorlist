'use strict';

const Devebot = require('devebot');
const lodash = Devebot.require('lodash');

function Manager({ sandboxConfig, loggingFactory }) {
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();

  const errorBuilders = {};

  this.register = function (namespace, { errorCodes } = {}) {
    const errorExtensions = lodash.get(sandboxConfig.extensions, namespace);
    if (!lodash.isEmpty(errorExtensions)) {
      errorCodes = lodash.merge(errorCodes, errorExtensions);
    }
    const opts = { errorCodes, defaultLanguage: sandboxConfig.defaultLanguage };
    L.has('debug') && L.log('debug', T.add({
      namespace: namespace,
      errorNames: Object.keys(errorCodes),
      extensions: Object.keys(errorExtensions || {})
    }).toMessage({
      tmpl: 'Register the errorCodes for the bundle[${namespace}]: ${errorNames} < ${extensions}'
    }));
    errorBuilders[namespace] = new ErrorBuilder(opts);
    return errorBuilders[namespace];
  }

  this.getErrorBuilder = function (namespace) {
    return errorBuilders[namespace];
  }

  this.getDescriptorOf = function (namespace) {
    const errorBuilder = errorBuilders[namespace]; //this.getErrorBuilder();
    if (!errorBuilder) {
      return null;
    }
    return errorBuilder.getDescriptor();
  }
};

module.exports = Manager;

function ErrorBuilder ({ errorCodes, defaultLanguage }) {
  this.newError = function(errorName, { payload, language } = {}) {
    language = language || defaultLanguage;
    const errInfo = errorCodes[errorName];
    if (errInfo == null) {
      const err = new Error('Error[' + errorName + '] unsupported');
      err.name = errorName;
      err.returnCode = -1;
      err.statusCode = 500;
      return err;
    }
    let msg = errInfo.message || errorName;
    if (errInfo.messageIn && typeof language === 'string') {
      msg = errInfo.messageIn[language] || msg;
    }
    if (payload && typeof payload === 'object') {
      msg = format(msg, payload);
    } else {
      payload = null;
    }
    const err = new Error(msg);
    err.name = errorName;
    err.returnCode = errInfo.returnCode;
    err.statusCode = errInfo.statusCode;
    if (payload) {
      err.payload = payload;
    }
    return err;
  }

  this.getDescriptor = function () {
    return { errorCodes, defaultLanguage };
  }
}
