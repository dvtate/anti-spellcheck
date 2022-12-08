import { begin } from '../../db';
import Tweeter from './tweeter';
import Debugger from 'debug';
const debug = Debugger('typo:twit_chron');

async function chron() {
    const tweeters = await Tweeter.getUsers();
    Promise.all(tweeters.map(t => t.getNewTweets()));
}

begin();
setTimeout(chron, 4000);