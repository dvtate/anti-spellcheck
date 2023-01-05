import Tweeter from './tweeter';
import Debugger from 'debug';
import registerTypos from '../../register_typos.js';
const debug = Debugger('typo:twit_chron');


export default async function chron() {
    console.log('Scraping tweets...');
    const tweeters = await Tweeter.getUsers();
    const tweetFeeds = await Promise.all(tweeters.map(t => t.getNewTweets()));
    const tweets = [].concat(...tweetFeeds);
    console.log('Scraped %d tweets', tweets.length);

    console.log('Reading tweets...');
    const invalidWordCount = registerTypos(tweets);
    console.log('Found %d mispellings', invalidWordCount);
}