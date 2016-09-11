'use strict';

let tm = require('../index'),
    g = tm.grammar,
    syntax = require('./syntax'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    dot = require('dot'),
    home = './dist/doc';

mkdirp.sync(home);

dot.templateSettings.strip = false;
var render = dot.process({ path: path.dirname(module.filename)});

function save(name, page) {
    fs.writeFileSync(home + '/' + name + '.html', page);
}

// An array of message info sorted by message name
let messages = g.root
    .terms.map(rule => rule.name)
    .sort();
messages = messages.map(name => {
    var example, ast, def;
    g.rules[name].example(g, (e,s) => { example = s; });
    tm.parse(example, (e,o) => { ast = JSON.stringify(o, null, 4); });
    def = syntax.rule(name);
    syntax.dependencies(name).forEach(r => {
        def += '\n' + syntax.rule(r);
    });
    return {
        name: name,
        example: example,
        definition: def,
        description: '',
        ast: ast
    };
});

module.exports.run = function run() {
    save('index', render.messages({ messages: messages }));
};

