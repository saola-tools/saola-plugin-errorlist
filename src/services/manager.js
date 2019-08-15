'use strict';

const Devebot = require('devebot');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');

function Manager({ sandboxConfig, loggingFactory }) {
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();

  const errorBuilders = {};
  let refByErrorClass;
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
    if (sandboxConfig.useBuiltinBuilder === false && lodash.isFunction(chores.newErrorBuilder)) {
      L.has('silly') && L.log('silly', T.add({ namespace }).toMessage({
        tmpl: 'Register the errorCodes for the bundle[${namespace}] with devebot ErrorBuilder class'
      }));
      errorBuilders[namespace] = chores.newErrorBuilder(opts);
    } else {
      L.has('silly') && L.log('silly', T.add({ namespace }).toMessage({
        tmpl: 'Register the errorCodes for the bundle[${namespace}] with builtin ErrorBuilder class'
      }));
      errorBuilders[namespace] = new ErrorBuilder(opts);
    }
    return errorBuilders[namespace];
  }

  this.getErrorBuilder = function (namespace) {
    return errorBuilders[namespace];
  }

  this.getDescriptorOf = function (namespace) {
    const errorBuilder = this.getErrorBuilder();
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

  this.findByErrorClass = function (errorClass) {
    refByErrorClass = refByErrorClass || keyByErrorClass({ errorBuilders });
    return transformInfos(refByErrorClass[errorClass]);
  }

  this.findByReturnCode = function (returnCode) {
    refByReturnCode = refByReturnCode || keyByReturnCode({ errorBuilders });
    return transformInfos(refByReturnCode[returnCode]);
  }
};

module.exports = Manager;

function newError (errorName, message, opts = {}) {
  const err = new Error(message);
  err.name = errorName;
  for (const fieldName in opts) {
    if (opts[fieldName] !== undefined) {
      err[fieldName] = opts[fieldName];
    }
  }
  return err;
}

function ErrorBuilder ({ errorCodes, defaultLanguage }) {
  this.newError = function(errorName, { payload, language } = {}) {
    language = language || defaultLanguage;
    const errInfo = errorCodes[errorName];
    if (errInfo == null) {
      return newError(errorName, 'Error[' + errorName + '] unsupported', {
        returnCode: -1,
        statusCode: 500
      });
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
    return newError(errorName, msg, {
      returnCode: errInfo.returnCode,
      statusCode: errInfo.statusCode,
      payload: payload
    });
  }

  this.getDescriptor = function () {
    return { errorCodes, defaultLanguage };
  }
}

function keyByErrorClass ({ errorBuilders } = {}) {
  const refs = {};
  lodash.forOwn(errorBuilders, function(builder, namespace) {
    const descriptor = builder.getDescriptor();
    lodash.forOwn(descriptor.errorCodes, function(errorCode, errorClass) {
      refs[errorClass] = refs[errorClass] || [];
      refs[errorClass].push({ namespace, name: errorClass, errorCode });
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
