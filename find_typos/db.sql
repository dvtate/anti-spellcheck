-- make db
CREATE DATABASE spellcheck;
USE spellcheck;

-- Real, correctly spelled words
CREATE TABLE Words (
	word VARCHAR(255) PRIMARY KEY,
	validCount BIGINT UNSIGNED DEFAULT 0
);

-- Typos that haven't been assigned
CREATE TABLE NotWords (
	spelling VARCHAR(255) PRIMARY KEY
);

-- Confirmed typos
CREATE TABLE Mispellings (
	word VARCHAR(255) REFERENCES Words,
	spelling VARCHAR(255) REFERENCES NotWords,
	userScore INT DEFAULT 0, -- if user dislikes suggestion it goes down if they use it, it goes up
	PRIMARY KEY(word, spelling)
);

-- Mispelling context
CREATE TABLE MispelledContext (
	mispelledContextId BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	word VARCHAR(255) DEFAULT NULL REFERENCES Words,
	spelling VARCHAR(255) DEFAULT NULL REFERENCES NotWords,
	context TEXT DEFAULT NULL,
    source VARCHAR(255) DEFAULT NULL, -- ie - url
    startIndex BIGINT UNSIGNED DEFAULT NULL,
    UNIQUE(spelling,context,startIndex),
	UNIQUE(spelling,source,startIndex)
);

-- Twitter accounts to track
CREATE TABLE Tweeters (
	username VARCHAR(16) PRIMARY KEY,
	lastTweetTs BIGINT UNSIGNED DEFAULT 0
);
INSERT INTO Tweeters (username) VALUES ('kernel_aneurysm');