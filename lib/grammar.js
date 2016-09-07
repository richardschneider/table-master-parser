'use strict';

var ll = require("ll.js");

var g = new ll.Grammar();
var p = ll.Factory;

/* op Helpers */
function push(value) {
    return (stack, cb) => {
        stack.push(value);
        cb();
    };
}

/* Create an AST node from the parser stack. */
function ast(kind) {
    let properties = Array.prototype.slice.call(arguments, 1).reverse();
    return (stack, cb) => {
        let node = { kind: kind };
        for (let name of properties) {
            node[name] = stack.pop();
        }
        stack.push(node);
        cb();
    };
}

/* Tokens */
g.addRule('port', p.number());
g.addRule('protocolVersion', p.number());
g.addRule('teamName', p.string());

/* Expressions */
g.addRule('hand', p.either(
    p.keyword('north').op(push('N')),
    p.keyword('south').op(push('S')),
    p.keyword('east').op(push('E')),
    p.keyword('west').op(push('W'))
    )
);

/* Messages */
let messages = [];
let otherMessages = [];
messages.add = function(name, term) {
    g.addRule(name, term);
    let rule = g.rules[name];
    this.push(rule);
    otherMessages.push(p.other(name));
};

messages.add('connect',
    p.sequence(
        p.keyword('connecting'),
        p.other('teamName'),
        p.keyword('as'),
        p.other('hand'),
        p.keyword('using'),
        p.keyword('protocol'),
        p.keyword('version'),
        p.other('protocolVersion')
    ).op(ast('connect', 'teamName', 'seat', 'protocolVersion'))
);

messages.add('seated',
    p.sequence(p.other('hand'), p.other('teamName'), p.keyword('seat'))
    .op(ast('seated', 'seat', 'teamName'))
);

/* The root rule is one of the message */
g.addRule('message', p.either.apply(p, otherMessages), true);

//console.log('grammar', g);
//g.dumpHTML((err, html) => console.log(html));
g.example((err, s) => console.log(s));

module.exports = g;
