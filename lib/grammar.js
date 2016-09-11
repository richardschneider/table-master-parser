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
        properties.forEach(name => { node[name] = stack.pop(); });
        stack.push(node);
        cb();
    };
}

/* Tokens */
g.addRule('port', p.number());
g.addRule('protocolVersion', p.number());
g.addRule('teamName', p.string());

/* Expressions */
g.addRule('seat', p.either(
    p.keyword('north').op(push('N')),
    p.keyword('south').op(push('S')),
    p.keyword('east').op(push('E')),
    p.keyword('west').op(push('W'))
    )
);

g.addRule("seat'", p.either(
    p.keyword("north's").op(push('N')),
    p.keyword("south's").op(push('S')),
    p.keyword("east's").op(push('E')),
    p.keyword("west's").op(push('W'))
    )
);

g.addRule('suit', p.either(
    p.keyword('S').op(push('S')),
    p.keyword('H').op(push('S')),
    p.keyword('D').op(push('S')),
    p.keyword('C').op(push('S'))
    )
);

g.addRule('vulnerable', p.either(
    p.keyword('Neither vulnerable').op(push('Nil')),
    p.keyword('N/S vulnerable').op(push('NS')),
    p.keyword('E/W vulnerable').op(push('EW')),
    p.keyword('Both vulnerable').op(push('All'))
    )
);

g.addRule('card', p.regex(/^[AKQJT98765432][SHDC]/, 'KH'));

g.addRule('playersHand', p.sequence(
    p.other('suit') // TODO: cards
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

/*
 * Connections messages
 */
messages.add('connect',
    p.sequence(
        p.keyword('connecting'),
        p.other('teamName'),
        p.keyword('as'),
        p.other('seat'),
        p.keyword('using'),
        p.keyword('protocol'),
        p.keyword('version'),
        p.other('protocolVersion')
    ).op(ast('connect', 'teamName', 'seat', 'protocolVersion'))
);

messages.add('readyForTeams',
    p.sequence(p.other('seat'), p.keyword('ready'), p.keyword('for'), p.keyword('teams'))
    .op(ast('readyForTeams', 'seat'))
);

messages.add('readyToStart',
    p.sequence(p.other('seat'), p.keyword('to'), p.keyword('start'))
    .op(ast('readyToStart', 'seat'))
);

messages.add('teams',
    p.sequence(
        p.keyword('teams'), p.keyword(':'),
        p.keyword('N/S'), p.keyword(':'), p.other('teamName'),
        p.keyword('E/W'), p.keyword(':'), p.other('teamName'))
    .op(ast('teams', 'NS', 'EW'))
);

messages.add('seated',
    p.sequence(p.other('seat'), p.other('teamName'), p.keyword('seat'))
    .op(ast('seated', 'seat', 'teamName'))
);

messages.add('endOfSession',
    p.sequence(
        p.keyword('end'),
        p.keyword('of'),
        p.keyword('session'))
    .op(ast('endOfSession'))
);

/*
 * Dealing messages
 */
messages.add('startOfBoard',
    p.sequence(p.keyword('start'), p.keyword('of'), p.keyword('board'))
    .op(ast('startOfBoard'))
);
messages.add('readyForDeal',
    p.sequence(p.other('seat'), p.keyword('ready'), p.keyword('for'), p.keyword('deal'))
    .op(ast('readyForDeal', 'seat'))
);
messages.add('readyForCards',
    p.sequence(p.other('seat'), p.keyword('ready'), p.keyword('for'), p.keyword('cards'))
    .op(ast('readyForCards', 'seat'))
);
messages.add('deal',
    p.sequence(
        p.keyword('board'), p.number(), p.keyword('.'),
        p.keyword('dealer'), p.other('seat'), p.keyword('.'),
        p.other('vulnerable'))
    .op(ast('deal', 'board', 'dealer', 'vulnerable'))
);
messages.add('cards',
    p.sequence(
        p.other("seat'"),
        p.keyword('cards'),
        p.keyword(':'),
        p.other('playersHand'))
    .op(ast('cards', 'seat', 'playersHand'))
);

/*
 * Bidding messages
 */
messages.add('illegalBid',
    p.sequence(p.keyword('illegal'), p.keyword('bid'))
    .op(ast('illegalBid'))
);

g.addRule('call', p.either(
    p.keyword('passes').op(push('pass')),
    p.keyword('doubles').op(push('X')),
    p.keyword('redoubles').op(push('XX')),
    p.sequence(
        p.keyword('bids'),
        p.regex(/^[1-7]([SHDC]|NT)/, '1NT')
    ))
);

messages.add('bid',
    p.sequence(p.other('seat'), p.other('call'))
    .op(ast('bid', 'seat', 'bid'))
);
messages.add('readyForBid',
    p.sequence(
        p.other('seat'),
        p.keyword('ready'),
        p.keyword('for'),
        p.other("seat'"),
        p.keyword('bid'))
    .op(ast('readyForBid', 'seat', 'from'))
);

/*
 * TODO: Alerts
 */

/*
 * Playing messages
 */
g.addRule('trickNumber', p.number());
messages.add('play',
    p.sequence(
        p.other('seat'),
        p.keyword('plays'),
        p.other('card'))
    .op(ast('play', 'seat', 'card'))
);
messages.add('readyForCard',
    p.sequence(
        p.other('seat'),
        p.keyword('ready'), 
        p.keyword('for'), 
        p.other("seat'"),
        p.keyword('card'),
        p.keyword('to'),
        p.keyword('trick'),
        p.other('trickNumber'))
    .op(ast('readyForCard', 'seat', 'player', 'trick'))
);
messages.add('readyForDummy',
    p.sequence(
        p.other('seat'),
        p.keyword('ready'), 
        p.keyword('for'), 
        p.keyword('dummy'))
    .op(ast('readyForDummy', 'seat'))
);
messages.add('dummyCards',
    p.sequence(
        p.keyword("dummy's"), 
        p.keyword('cards'), 
        p.keyword(':'), 
        p.other('playersHand'))
    .op(ast('dummyCards', 'seat'))
);
messages.add('endOfBoard',
    p.sequence(
        p.keyword('timing'),
        p.keyword('-')
        // TODO: N/S : this board  [minutes:seconds],  total  [hours:minutes:seconds].  E/W : this board  [minutes:seconds],  total  [hours:minutes:seconds]
    )
    .op(ast('endOfBoard'))
);

/*
 * The root rule is one of the messaged 
 */
g.addRule('message', p.either.apply(p, otherMessages), true);

//console.log('grammar', g);
//g.dumpHTML((err, html) => console.log(html));
//g.example((err, s) => console.log(s));

module.exports = g;
