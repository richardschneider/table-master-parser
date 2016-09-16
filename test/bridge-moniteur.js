'use strict';

var tm = require('..');
require('should');

describe('Bridge Moniteur', () => {

    it('should parse a seated message', done => {
        tm.parse('south emanon seated', done);
    });

});
