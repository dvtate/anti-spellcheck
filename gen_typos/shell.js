const readline = require('readline');
const { genMispellings } = require('./typoology');

// Create line reader
const rl = readline.createInterface ({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "> "
});


rl.on('line', line => {
    line.split(' ').forEach(word => {
        console.log(`Mispellings for '${word}':`);
        const goodMispellings = genMispellings(word, {}, false);
        const badMispellings = genMispellings(word, {}, true).filter(s => !goodMispellings.includes(s));

        goodMispellings.forEach(s => console.log(' + ' + s));
        badMispellings.forEach(s => console.log(' - ' + s));
    });
});