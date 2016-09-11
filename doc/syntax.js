'use strict';

let tm = require('../index'),
    grammar = tm.grammar;

function termHtml(term) {
    if('optionally' in term) {
        return ' [' + termHtml(term.optionally) + ']';
    }
    else if('repeating' in term) {
        return ' (' + termHtml(term.repeating) + ']) ...';
    }
    else if('keyword' in term) {
        return ` <span class="keyword">${term.keyword}</span>`;
    }
    else if('other' in term) {
        return ` <var class="rule-name">${term.other}</var>`;
    }
    else if('number' in term) {
        return ` <span class="number">#</span>`;
    }
    else if('string' in term) {
        return ` <var class="string">quoted-string</var>`;
    }
    else if('regex' in term) {
        return ` <code class="regex">${term.regex.toString()}</code>`;

    }
    else if('sequence' in term) {
        return term.sequence.reduce((html, t) => html += termHtml(t), '');
    }
    else if('either' in term) {
        return term.either.reduce((html, t, i, either) => {
            var trailer = (i === either.length -1) ? '' : ' |';
            html += termHtml(t) + trailer;
            return html;
        }, '');
    }
}

module.exports.rule = function rule(name) {
    let html = `<var>${name}</var> :=`;

    grammar.rules[name].dump(grammar, (e,t) => html += termHtml(t));

    return html;
};

function pushOther(others, other) {
    if (Array.isArray(other)) {
        other.forEach(e => pushOther(others, e));
    } else if (other !== null && others.indexOf(other) === -1) {
        others.push(other);
    }

    return others;
}

function termOther(term) {
    if('optionally' in term) {
        return termOther(term.optionally);
    }
    else if('repeating' in term) {
        return termOther(term.repeating);
    }
    else if('other' in term) {
        return term.other;
    }
    else if('sequence' in term) {
        return term.sequence.reduce((others, t) => pushOther(others, termOther(t)), []);
    }
    else if('either' in term) {
        return term.either.reduce((others, t) => pushOther(others, termOther(t)), []);
    }

    return null;
}

module.exports.dependencies = function dependencies(name, others, visited) {
    others = others || [];
    visited = visited || [];

    if (visited.indexOf(name) >= 0) {
        return others;
    }
    visited.push(name);

    grammar.rules[name].dump(grammar, (e,t) => pushOther(others, termOther(t)));

    for (let i = 0; i < others.length; ++i) {
        dependencies(others[i], others, visited);
    }

    return others;
};

