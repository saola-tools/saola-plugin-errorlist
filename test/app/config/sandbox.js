'use strict';

module.exports = {
  application: {
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
  },
  plugins: {
    appErrorlist: {
      defaultLanguage: 'vi',
      extensions: {
        "devebot-application": {
          // User
          UserNotFound: {
            messageIn: {
              vi: 'Không tìm thấy tài khoản người dùng'
            },
          },
          UserIsLocked: {
            messageIn: {
              vi: 'Tài khoản đã bị khóa',
            },
          },
        }
      },
      useBuiltinBuilder: true
    }
  }
};
