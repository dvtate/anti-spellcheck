import Typo = require('typo-js');
import nlp = require('compromise');
import Debugger from 'debug';

import { readFileSync } from 'fs';

import { FeedItem } from './feed.js';
import { begin, queryProm } from './db.js';

begin();

const debug = Debugger('typo:read');

export const dictionary = new Typo('en_US');

export async function registerTypos(feed: FeedItem[]) {
    return Promise.all(feed.map(async item => {
        let startIndex = 0;
        // debug('checking text', item.text);
        // @ts-ignore
        const terms = nlp(item.text).json()[0].terms;
        for (const term of terms) {
            startIndex += term.pre.length;
            if (term.normal.match(/^[a-zA-Z'`-]+$/)
                && !term.tags.includes('ProperNoun')
                && !term.tags.includes('Acronym')
            ) {
                const res = await queryProm('SELECT * FROM Words WHERE word IN (?, ?)', [term.text, term.normal], true);
                if (res instanceof Error) {
                    console.error(res);
                    console.log(term);
                    process.exit(1);
                }
                if (res.length === 0 && !dictionary.check(term.normal) && !dictionary.check(term.text)) {
                    debug('\tNot a word:', term.text);
                    await queryProm('INSERT INTO NotWords (spelling) VALUES (?) WHERE NOT EXISTS (SELECT spelling FROM NotWords WHERE spelling=?)', [term.text, term.text], false);
                    queryProm('INSERT INTO MispelledContext (spelling,context,source,startIndex) VALUES (?, ?, ?, ?)', [term.text, item.text, item.url, startIndex], false);
                }
                if (res.length) {
                    queryProm('UPDATE Words SET validCount = validCount + 1 WHERE word = ?', [term.normal]);
                }
            }
            startIndex += term.text.length + term.post.length;
        }
    }));
}

const feed = JSON.parse(readFileSync('/tmp/feed.json').toString());
setTimeout(() => registerTypos(feed[0]), 1000);