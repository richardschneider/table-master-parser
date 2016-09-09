#! /usr/bin/env node

'use strict';

let tm = require('..'),
    g = tm.grammar,
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    home = './dist/doc';

mkdirp.sync(home);

g.dumpHTML((err, html) => {
    if (err) {
        return console.log(err);
    }
    
    fs.writeFileSync(home + '/index.html', html);
});


function documentMessage(rule) {
    let doc = fs.createWriteStream(home + '/' + rule.name + '.html');
    doc.write(`<h1>${rule.name}</h1>\n`);
    doc.write('<h2>Definition</h2>\n');
    doc.write('<h2>Example</h2>\n');
    doc.write('<code>');
    g.rules[rule.name].example(g, (e,s) => doc.write(s));
    doc.write('</code>');
    doc.write('<h2>Syntax Tree</h2>\n');
    doc.end();
}

g.root.terms.forEach(documentMessage);
