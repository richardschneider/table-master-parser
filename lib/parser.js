'use strict';

var ll = require("ll.js"),
    grammar = require('./grammar');

function parse(msg, cb) {

    // Bridge Moniteur specials
    var match;
    if ((match = msg.match(/^(\w+) ([^"]+) (seated)$/i))) {
        msg = match[1] + ' "' + match[2] + '" ' + match[3];
    }

    var reader = new ll.Reader(msg);
    var script = [];
    grammar.parse(reader, script, function(ok) {
        if (!ok) {
            return cb(new Error('Invalid table master message'));
        }
        var stack = [];

        // Execute the functions asynchronously
        function step() {
                var f = script.shift();
                if(f) {
                        f(stack, step);
                }
                else {
                    return cb(null, stack.pop());
                }
        }

        step(script);

    });
}

module.exports = {
    parse: parse,
    grammar: grammar
};
