'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');

function Manager({ sandboxConfig, loggingFactory }) {
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();

  const errorBuilders = {};

  this.register = function (namespace, { errorCodes } = {}) {
    if (lodash.isFunction(chores.newErrorBuilder)) {
      errorBuilders[namespace] = chores.newErrorBuilder({ errorCodes });
    } else {
      errorBuilders[namespace] = new ErrorBuilder({ errorCodes });
    }
    return errorBuilders[namespace];
  }

  this.getErrorBuilder = function (namespace) {
    return errorBuilders[namespace];
  }
};

module.exports = Manager;

function ErrorBuilder ({ errorCodes }) {
  this.newError = function(errorName, { payload, language } = {}) {
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
}
