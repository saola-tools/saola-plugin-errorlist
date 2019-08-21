'use strict';

const Devebot = require('devebot');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');
const BusinessError = require('../supports/business-error');
const misc = require('../supports/misc');

function Manager({ sandboxConfig, loggingFactory }) {
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();

  const errorBuilders = {};
  let refByErrorClass;
  let refByReturnCode;

  this.register = function (packageName, { errorCodes } = {}) {
    const errorExtensions = lodash.get(sandboxConfig.extensions, packageName);
    if (!lodash.isEmpty(errorExtensions)) {
      errorCodes = lodash.merge(errorCodes, errorExtensions);
    }
    const opts = { packageName, errorCodes, defaultLanguage: sandboxConfig.defaultLanguage };
    L.has('debug') && L.log('debug', T.add({
      packageName: packageName,
      errorNames: Object.keys(errorCodes),
      extensions: Object.keys(errorExtensions || {})
    }).toMessage({
      tmpl: 'Register the errorCodes for the bundle[${packageName}]: ${errorNames} < ${extensions}'
    }));
    if (sandboxConfig.useBuiltinBuilder === false && lodash.isFunction(chores.newErrorBuilder)) {
      L.has('silly') && L.log('silly', T.add({ packageName }).toMessage({
        tmpl: 'Register the errorCodes for the bundle[${packageName}] with devebot ErrorBuilder class'
      }));
      errorBuilders[packageName] = chores.newErrorBuilder(opts);
    } else {
      L.has('silly') && L.log('silly', T.add({ packageName }).toMessage({
        tmpl: 'Register the errorCodes for the bundle[${packageName}] with builtin ErrorBuilder class'
      }));
      errorBuilders[packageName] = new ErrorBuilder(opts);
    }
    return errorBuilders[packageName];
  }

  this.getErrorBuilder = function (packageName) {
    return errorBuilders[packageName];
  }

  this.getDescriptorOf = function (packageName) {
    const errorBuilder = this.getErrorBuilder(packageName);
    if (!errorBuilder) {
      return null;
    }
    return errorBuilder.getDescriptor();
  }

  this.getAllDescriptors = function () {
    const descriptors = {};
    lodash.forOwn(errorBuilders, function(errorBuilder, packageName) {
      descriptors[packageName] = errorBuilder.getDescriptor();
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

  Object.defineProperty(this, 'BusinessError', {
    get: function () {
      return BusinessError;
    },
    set: function (val) {}
  });
};

module.exports = Manager;

function newError (errorName, message, opts = {}) {
  return new BusinessError(errorName, message, opts);
}

function ErrorBuilder ({ packageName, errorCodes, defaultLanguage }) {
  const packageRef = misc.getPackageRef(packageName);

  this.newError = function(errorName, { payload, language } = {}) {
    language = language || defaultLanguage;
    const errInfo = errorCodes[errorName];
    if (errInfo == null) {
      return newError(errorName, 'Error[' + errorName + '] unsupported', {
        packageRef,
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
      packageRef,
      returnCode: errInfo.returnCode,
      statusCode: errInfo.statusCode,
      payload: payload
    });
  }

  this.getDescriptor = function () {
    return { packageRef, errorCodes, defaultLanguage };
  }
}

function keyByErrorClass ({ errorBuilders } = {}) {
  const refs = {};
  lodash.forOwn(errorBuilders, function(builder, packageName) {
    const descriptor = builder.getDescriptor();
    lodash.forOwn(descriptor.errorCodes, function(errorCode, errorClass) {
      refs[errorClass] = refs[errorClass] || [];
      refs[errorClass].push({
        packageName, name: errorClass, errorCode, packageRef: descriptor.packageRef
      });
    });
  });
  return refs;
}

function keyByReturnCode ({ errorBuilders } = {}) {
  const refs = {};
  lodash.forOwn(errorBuilders, function(builder, packageName) {
    const descriptor = builder.getDescriptor();
    lodash.forOwn(descriptor.errorCodes, function(errorCode, name) {
      const returnCode = errorCode.returnCode || '__unknown__';
      refs[returnCode] = refs[returnCode] || [];
      refs[returnCode].push({
        packageName, name, errorCode, packageRef: descriptor.packageRef
      });
    });
  });
  return refs;
}

function transformInfos (infos = []) {
  return lodash.map(infos, function(info = {}) {
    return lodash.assign(lodash.omit(info, ['errorCode']), info.errorCode);
  })
}
