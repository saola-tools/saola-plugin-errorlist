'use strict';

const Devebot = require('devebot');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');

function Manager({ sandboxConfig, loggingFactory }) {
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();

  const errorBuilders = {};
  let refByUniqueName;
  let refByReturnCode;

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

  this.getAllDescriptors = function () {
    const descriptors = {};
    lodash.forOwn(errorBuilders, function(errorBuilder, namespace) {
      descriptors[namespace] = errorBuilder.getDescriptor();
    });
    return descriptors;
  }

  this.findByUniqueName = function (uniqueName) {
    refByUniqueName = refByUniqueName || keyByUniqueName({ errorBuilders });
    return transformInfos(refByUniqueName[uniqueName]);
  }

  this.findByReturnCode = function (returnCode) {
    refByReturnCode = refByReturnCode || keyByReturnCode({ errorBuilders });
    return transformInfos(refByReturnCode[returnCode]);
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
      msg = chores.formatTemplate(msg, payload);
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

function keyByUniqueName ({ errorBuilders } = {}) {
  const refs = {};
  lodash.forOwn(errorBuilders, function(builder, namespace) {
    const descriptor = builder.getDescriptor();
    lodash.forOwn(descriptor.errorCodes, function(errorCode, uniqueName) {
      refs[uniqueName] = refs[uniqueName] || [];
      refs[uniqueName].push({ namespace, name: uniqueName, errorCode });
    });
  });
  return refs;
}

function keyByReturnCode ({ errorBuilders } = {}) {
  const refs = {};
  lodash.forOwn(errorBuilders, function(builder, namespace) {
    const descriptor = builder.getDescriptor();
    lodash.forOwn(descriptor.errorCodes, function(errorCode, name) {
      const returnCode = errorCode.returnCode || '__unknown__';
      refs[returnCode] = refs[returnCode] || [];
      refs[returnCode].push({ namespace, name, errorCode });
    });
  });
  return refs;
}

function transformInfos (infos = []) {
  return lodash.map(infos, function(info) {
    const { namespace, name, errorCode } = info || {};
    return lodash.assign({ namespace, name }, errorCode);
  })
}
