'use strict';

if (typeof window !== 'undefined') {
    require('babel-polyfill');
}

module.exports = require('./lib/parser');
