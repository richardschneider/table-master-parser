# Table Master Parser

[![Travis build status](https://travis-ci.org/richardschneider/table-master-parser.svg)](https://travis-ci.org/richardschneider/table-master-parser)
[![Coverage Status](https://coveralls.io/repos/github/richardschneider/table-master-parser/badge.svg?branch=master)](https://coveralls.io/github/richardschneider/table-master-parser?branch=master)
[![npm version](https://badge.fury.io/js/table-master-parser.js.svg)](https://badge.fury.io/js/table-master-parser.js) 

The [Table Master protocol](http://www.bluechipbridge.co.uk/protocol.htm) allows bridge programs to communicate with each other in order to play bridge. ASCII messages (terminated with a CRLF) are exchanged over TCP/IP.  This package parses the ASCII message and produces a javascript object representation commonly called an [AST or *Abstract Syntax Tree*](https://en.wikipedia.org/wiki/Abstract_syntax_tree).

[Documentation](https://unpkg.com/table-master-parser/dist/doc/index.html) on each message is automatically produced by 
this package.
The [change log](https://github.com/richardschneider/table-master-parser/releases) is automatically produced with
the help of [semantic-release](https://github.com/semantic-release/semantic-release).

## Getting started

**table-master-parser** is available for [Node.js](https://nodejs.org) and most modern browsers.  If you want to know if your currremt browser is compatible, run the [online test suite](https://unpkg.com/table-master-parser/test/index.html).

Install with [npm](http://blog.npmjs.org/post/85484771375/how-to-install-npm)

    > npm install table-master-parser --save

### Node

Include the package

    var tm = require('table-master-parser')
    
Parse a message

    tm.parse('South plays AS', (e, m) => console.log(m)))
    
Produces

    {   kind: 'play', 
        card: 'AS',
        seat: 'S'
    }

### Browser

Include the package from your project

    <script src="./node_modules/table-master-parser/dist/table-master-parser.min.js" type="text/javascript"></script>

or from the [unpkg CDN](https://unpkg.com)

    <script src="https://unpkg.com/table-master-parser/dist/table-master-parser.min.js"></script>

This will provide `tableMasterParser` as a global object, or `define` it if you are using [AMD](https://en.wikipedia.org/wiki/Asynchronous_module_definition).
