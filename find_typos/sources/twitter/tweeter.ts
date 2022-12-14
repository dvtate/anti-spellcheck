import { queryProm } from '../../db.js';
import Debugger from 'debug';
import Twit = require('twit');

// Initialize debugger
const debug = Debugger('typo:twit');

// Load dotenv
import { config } from 'dotenv';
config();

// Login to Twitter API
const twit = new Twit({
    consumer_key:         process.env.TWIT_API_KEY,
    consumer_secret:      process.env.TWIT_API_SECRET,
    access_token:         process.env.TWIT_ACCESS_TOKEN,
    access_token_secret:  process.env.TWIT_ACCESS_SECRET,
});

// export async function setUsers(obj: Tweeter[]) {
//     // TODO probably better to just update the changed rows
//     cachedUsers = obj;
//     let result = await queryProm(
//         'DELETE FROM Tweeters; INSERT (username, lastTweetTs) INTO Tweeters VALUES ?;',
//         [cachedUsers.map(u => `(${JSON.stringify(u.username)}, ${u.lastTweetTs})`).join(',')],
//         false,
//     );

//     if (result instanceof Error) {
//         debug('failed to update tweeters list');
//         console.error(result);
//     }
// };


export default class Tweeter {
    public username: string;
    protected ts: number;

    constructor({ username, lastTweetTs }) {
        this.username = username;
        this.ts = lastTweetTs;
    }
    get lastTweetTs() {
        return this.ts;
    }
    set lastTweetTs(epochMs: number) {
        this.ts = epochMs;
        queryProm(
            'UPDATE Tweeters SET lastTweetTs=? WHERE username=?',
            [String(epochMs), this.username],
            false,
        ).catch(e => {
            debug(`failed to update Tweeter @${this.username} in database`);
            console.error(e);
        });
    }

    static cachedTweeters = null;
    // static tweeterLookup: { [k: string]: Tweeter } = {};
    static async getUsers(): Promise<Tweeter[]> {
        if (Tweeter.cachedTweeters)
            return Tweeter.cachedTweeters;
        const ret = await queryProm('SELECT * FROM Tweeters', [], true);
        if (ret instanceof Error)
            throw ret;
        return Tweeter.cachedTweeters = ret.map(r => new Tweeter(r));
    }
    static async refreshUsers() {
        Tweeter.cachedTweeters = null;
        await this.getUsers();
    }

    protected async fetchTimeline(max_id?: string) {
        debug('username: ', this.username);
        try {
            return twit.get(
                "statuses/user_timeline",
                {
                    screen_name: this.username,
                    max_id,
                    count: 200,
                    tweet_mode: "extended",
                    exclude_replies: false,
                    include_entities: false,
                    trim_user: true,
                },
            );
        } catch (e) {
            debug("UserTimeline account failed: %s", e.message);
            console.error(e);
            return { data: [] };
        }
    }

    formatTweetFeed(tweets: any[]) {
        const ret = [];
        tweets.forEach(t => {
            // For retweets use original tweet
            if (t.retweeted_status)
                t = t.retweeted_status;

            // Only English tweets
            if (t.lang !== 'en')
                return;

            ret.push({
                // tweetId: t.id_str,
                url: `https://twitter.com/${this.username}/status/${t.id_str}`,
                text: t.full_text,
                date: Date.parse(t.created_at),
            });
        });
        return ret;
    }

    async getNewTweets() {
        if (this.lastTweetTs > 0) {
            const response = await this.fetchTimeline();
            const data = response.data as any[];
            debug("Received %d old @%s tweets", data.length, this.username);
            if (!data.length) {
                debug('data.length was zero');
                console.error('data:', data);
                return;
            }

            const ret = this.formatTweetFeed(data.filter(t => Date.parse(t.date) > this.lastTweetTs));
            this.lastTweetTs = Math.max(...ret.map(t => t.date));
            return ret;
        }

        // Need to fetch full history
        let oldestTweetIdStr: string;
        let fullset = [];

        let retriesLeft = 1;
        for (; ;) {
            const response = await this.fetchTimeline(oldestTweetIdStr);
            const data = response.data as any[];
            debug("Received %d old @%s tweets", data.length, this.username);
            if (!data.length) {
                if (--retriesLeft < 0) break;
                continue;
            }
            retriesLeft = 1;
            const set = this.formatTweetFeed(data);
            fullset.push(...set);
            oldestTweetIdStr = String(
                data.map(t => BigInt(t.id_str))
                    .reduce((p: bigint, c: bigint) => p ? (c < p ? c : p) : c) - BigInt(1)
            );
        }
        return fullset;
    }
};


setTimeout(() => {
    // Load users list from database 2 seconds after start
    Tweeter.getUsers();

    // Refresh users list from database every hour
    setInterval(() => Tweeter.refreshUsers(), 1000 * 60 * 60);
}, 2000);