'use strict';

var tm = require('..');
require('should');

describe('Parser', () => {
    it('should parse a string', done => {
        tm.parse('Connecting "my great team" as South using protocol version 18', done);
    });

    it('should return an error on an unparsable message', done => {
        tm.parse('Connecting team as South using protocol version 18', (err, ast) => { //missing quotes around the team name.
            err.should.have.property('message');
            done();
        });
    });

    describe('AST', () => {
        it('should have the kind of message', done => {
            let msg = 'Connecting "my great team" as South using protocol version 18';
            tm.parse(msg, (err, ast) => {
                ast.should.have.property('kind');
                done();
            });
        });

        it('should have specific properties of the message', done => {
            let msg = 'Connecting "my great team" as South using protocol version 18';
            tm.parse(msg, (err, ast) => {
                ast.should.have.property('kind', 'connect');
                ast.should.have.property('teamName', 'my great team');
                ast.should.have.property('seat', 'S');
                ast.should.have.property('protocolVersion', 18);
                done();
            });
        });

        it('should have specific properties of the bid message', done => {
            let msg = 'east bids 3NT';
            tm.parse(msg, (err, ast) => {
                ast.should.have.property('kind', 'bid');
                ast.should.have.property('seat', 'E');
                ast.should.have.property('bid', '3NT');
                done();
            });
        });

    });

});
