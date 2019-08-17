'use strict';

const crypto = require('crypto');

module.exports = { getPackageRef }

function getPackageRef (pkgName) {
  const hash = crypto.createHash('sha1');
  const data = hash.update(pkgName, 'utf-8');
  return data.digest('base64');
}
