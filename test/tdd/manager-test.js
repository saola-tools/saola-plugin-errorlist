'use strict';

const devebot = require('devebot');
const lodash = devebot.require('lodash');
const assert = require('liberica').assert;
const mockit = require('liberica').mockit;

describe('manager', function() {
  describe('newError()', function() {
    let Manager, BusinessError, newError;

    beforeEach(function() {
      Manager = mockit.acquire('manager', { libraryDir: '../lib' });
      BusinessError = mockit.get(Manager, 'BusinessError');
      newError = function newError (errorName, message, opts = {}) {
        return new BusinessError(errorName, message, opts);
      }
    });

    it('newError() must return an instance of BusinessError class', function() {
      const err = newError('UserNotFound', 'username must be provided', {
        returnCode: 1000,
        statusCode: 500
      });
      assert.instanceOf(err, BusinessError);
    });

    it('newError() must build the error with provided attributes correctly', function() {
      const err = newError('UserNotFound', 'username must be provided', {
        unknown: undefined,
        empty: null,
        returnCode: 1000,
        statusCode: 500,
        payload: {
          email: 'user@example.com',
          password: '********'
        }
      });
      assert.equal(err.name, 'UserNotFound');
      assert.equal(err.message, 'username must be provided');
      assert.equal(err.returnCode, 1000);
      assert.equal(err.statusCode, 500);
      assert.deepEqual(err.payload, {
        email: 'user@example.com',
        password: '********'
      });
      assert.isTrue('empty' in err);
      assert.isFalse('unknown' in err);
    });
  });

  describe('ErrorBuilder', function() {
    let Manager, ErrorBuilder;

    beforeEach(function() {
      Manager = mockit.acquire('manager', { libraryDir: '../lib' });
      ErrorBuilder = mockit.get(Manager, 'ErrorBuilder');
    });

    it('must embed [packageRef, returnCode] fields to the error object', function() {
      const builder = new ErrorBuilder({
        packageName: 'app-restfront',
        errorCodes: {
          UserNotFound: {
            message: 'User not found',
            returnCode: 1000,
            statusCode: 400
          },
          UserIsLocked: {
            message: 'User is locked',
            returnCode: 1001,
            statusCode: 400
          },
        }
      });

      const err = builder.newError('UserNotFound', {
        payload: {
          email: 'user@example.com',
          password: '********'
        }
      });

      assert.equal(err.name, 'UserNotFound');
      assert.equal(err.message, 'User not found');
      assert.equal(err.statusCode, 400);
      assert.equal(err.returnCode, 1000);
      assert.equal(err.packageRef, 'A6+4vsPnaKIsWdzGkPE1IyK4FmE=');
      assert.deepEqual(err.payload, {
        email: 'user@example.com',
        password: '********'
      });
    });
  });
});
