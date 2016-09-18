'use strict';

var ll = require("ll.js");

var g = new ll.Grammar();
var p = ll.Factory;

/* Helpers */
function push(value) {
    return (stack, cb) => {
        stack.push(value);
        cb();
    };
}

function setExample(name, text) {
    g.rules[name].example = (grammar, cb) => cb(null, text);
}

/* Create an AST node from the parser stack. */
function ast(kind) {
    let properties = Array.prototype.slice.call(arguments, 1).reverse();
    return (stack, cb) => {
        let node = { kind: kind };
        properties.forEach(name => {
            if (name.endsWith('?')) {
                name = name.slice(0, -1);
                let o = stack[stack.length - 1];
                if (typeof o === 'object' && name in o) {
                    node[name] = stack.pop()[name];
                }
            } else {
                node[name] = stack.pop();
            }
        });
        stack.push(node);
        cb();
    };
}

/* Tokens */
g.addRule('port', p.number());
g.addRule('protocolVersion', p.number());
setExample('protocolVersion', '18');
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
    p.keyword('H').op(push('H')),
    p.keyword('D').op(push('D')),
    p.keyword('C').op(push('C'))
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

g.addRule('scards', p.either(
    p.keyword('-', true),
    p
        .regex(/^[AKQJT98765432 ]+/, 'A J 4 3')
        .op((stack, cb) => {
            stack.push(stack.pop().replace(/ /g,''));
            cb();
        })
));
g.addRule('hand',
    p.kleene(
        p.other('someCards')
    ).op((stack, cb) => {
        let cards = [];
        while (stack.length > 0) {
            let some = stack[stack.length - 1];
            if (Array.isArray(some)) {
                Array.prototype.push.apply(cards, stack.pop().reverse());
            } else {
                break;
            }
        }
        stack.push(cards.reverse());
        cb();
    })
);
setExample('hand', 'S A K J 4 3. H -. D 6 5 4 3. C Q J T 9.');

g.addRule('someCards',
    p.sequence(
        p.other('suit'),
        p.other('scards'),
        p.keyword('.')
    ).op((stack, cb) => {
        var ranks = stack.pop();
        var suit = stack.pop();
        if (ranks === '-') {
            stack.push([]);
        } else {
            var cards = Array.from(ranks).map(r => r + suit);
            stack.push(cards);
        }
        cb();
    })
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
    p.sequence(
        p.other('seat'),
        p.other('teamName'),
        p.keyword('seated'))
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
        p.keyword('board'), p.keyword('number'), p.number(), p.keyword('.'),
        p.keyword('dealer'), p.other('seat'), p.keyword('.'),
        p.other('vulnerable'))
    .op(ast('deal', 'board', 'dealer', 'vulnerable'))
);
messages.add('cards',
    p.sequence(
        p.other("seat'"),
        p.keyword('cards'),
        p.keyword(':'),
        p.other('hand')
    )
    .op(ast('cards', 'seat', 'cards'))
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
    p.sequence(
        p.other('seat'),
        p.other('call'),
        p.optionally(
            p.sequence(
                p.keyword('Alert.'),
                p.regex(/.+/, '12 to 14 total points')
            ).op((stack, cb) => {
                stack.push({ alert: stack.pop() });
                cb();
            })
          )
    )
    .op(ast('bid', 'seat', 'bid', 'alert?'))
);
setExample('bid', 'south bids 1NT Alert. 12 to 14 total points');

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
 * Playing messages
 */
g.addRule('trickNumber', p.number());
g.addRule('mmss', p.regex(/^\d+\:\d+/, '3:30'));
g.addRule('hhmmss', p.regex(/^\d+\:\d+\:\d+/, '1:10:30'));
messages.add('lead',
    p.sequence(
        p.other('seat'),
        p.keyword('to'),
        p.keyword('lead'))
    .op(ast('lead', 'seat'))
);
messages.add('dummyLead',
    p.sequence(
        p.keyword('dummy'),
        p.keyword('to'),
        p.keyword('lead'))
    .op(ast('dummyLead'))
);
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
        p.other('hand'))
    .op(ast('dummyCards', 'cards'))
);
messages.add('endOfBoard',
    p.sequence(
        p.keyword('timing'),
        p.keyword('-'),
        p.keyword('N/S'),
        p.keyword(':'),
        p.keyword('this'),
        p.keyword('board'),
        p.other('mmss'),
        p.keyword(','),
        p.keyword('total'),
        p.other('hhmmss'),
        p.keyword(','),
        p.keyword('E/W'),
        p.keyword(':'),
        p.keyword('this'),
        p.keyword('board'),
        p.other('mmss'),
        p.keyword(','),
        p.keyword('total'),
        p.other('hhmmss')
    )
    .op(ast('endOfBoard', 'nsBoardTime', 'nsTotalTime', 'ewBoardTime', 'ewTotalTime'))
);

/*
 * The root rule is one of the messaged 
 */
g.addRule('message', p.either.apply(p, otherMessages), true);

//console.log('grammar', g);
//g.dumpHTML((err, html) => console.log(html));
//g.example((err, s) => console.log(s));

module.exports = g;
