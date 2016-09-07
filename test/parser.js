'use strict';

var tm = require('..');

describe('Parser', () => {
    it('should parse a string', () => {
        tm.parse('Connecting "my great team" as South using protocol version 18');
    });

});
