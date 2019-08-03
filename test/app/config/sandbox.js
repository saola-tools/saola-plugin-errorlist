'use strict';

module.exports = {
  plugins: {
    appErrorlist: {
      defaultLanguage: 'vi',
      extensions: {
        "app-handshake": {
          // User
          UserNotFound: {
            messageIn: {
              vi: 'Không tìm thấy tài khoản người dùng',
            },
          },
          UserIsLocked: {
            messageIn: {
              vi: 'Tài khoản đã bị khóa',
            },
          },
        }
      }
    }
  }
};
