import { begin, queryProm } from '../../db';
import Tweeter from './tweeter';
import Debugger from 'debug';
import { writeFileSync } from 'fs';
const debug = Debugger('typo:twit_chron');

// Start db
begin();


export async function chron() {
    const tweeters = await Tweeter.getUsers();
    const tweets = await Promise.all(tweeters.map(t => t.getNewTweets()));
    writeFileSync('/tmp/feed.json', JSON.stringify(tweets));
}

setTimeout(chron, 4000);