import { begin, queryProm } from '../db.js';

import twitterChron from "./twitter/chron.js";

// Start db
begin();

function chron() {
    twitterChron();
}

export default setInterval(chron, 1000 * 60 * 60);