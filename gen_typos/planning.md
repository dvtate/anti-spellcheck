# Database
```sql
-- real, correctly spelled words
-- equivalent words (ie - uk vs us spellings) have same word id ?
CREATE TABLE Words (
    wordId BIGINT PRIMARY KEY,
    spelling VARCHAR NOT NULL
);

-- misspellings for real words
CREATE TABLE Mispellings (
    wordId BIGINT references Words,     -- which word is being misspelled here
    spelling VARCHAR NOT NULL,
    score INT DEFAULT 0,                -- score for this misspelling judged by humans (incr when )
    pop INT UNSIGNED DEFAULT 0          -- how many times has this been seen in the wild
);
```

# Auto-generating misspellings
## Notes
- First 2 letters of word should remain in tact for typos

## Doubled letters
drop double letters
- always: ss, pp, ll, rr,
- sometimes: tt, bb,
- not: oo, too easy to spot

## Letter swaps
- flip lettres

## Specific words
- I, a: fuck up the case

# Getting some common misspelled words
- Plenty of lists online
- Discord scraping

# Logging system
Need a pretty elaborate logging+moderation system.
- Portal for viewing recent submissions, and banning IPs
