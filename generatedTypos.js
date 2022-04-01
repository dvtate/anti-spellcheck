
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split();
const vowels = 'aeiouy'.split('');
const consonants = alphabet.filter(l => !vowels.includes(l));

function strOverwrite(str, ind, substr) {
    return str.split(0, ind) + substr + str.split(ind + substr.length);
}

/**
 * Generate a list of all possible substr replacements
 * @param {string} str
 * @param {string} from
 * @param {string} to
 * @returns
 */
function strReplacements(str, from, to) {
    const originalStr = str;
    const ret = [];
    let i = str.indexOf(from)
    while (i !== -1) {
        ret.push(strOverwrite(str, i, to));
        const i2 = str.slice(i + 1).indexOf(from);
        if (i2 === -1)
            break;
        i += i2;
    }
    return ret;
}

/**
 *
 * @param {string} word word to generate mispellings for
 * @param {object} skip should we skip certain part of process?
 * @param {boolean} desperate how desperate are we
 * @returns {string[]} list of mispelled forms of the word
 */
function genMispellings(word, skip = {}, desperate = false) {
    let ret = [];

    // Flip letters we type together quickly
    function flipLetters() {
        [
            ['ea', 'ae'],
            ['er', 're'],
            ['io', 'oi'],
            ['oi', 'io'],
            ['ui', 'iu'],
        ].forEach(([from, to]) =>
            ret.push(strReplacements(word, from, to)));
    }

    // Remove duplicate letters
    function dropDuplicates() {
        const letters = word.split('');
        const special = desperate ? 'oe' : ''; // easier to spot (imo)
        for (let i = 0; i < letters.length; i++)
            if (letters[i - 1] === letters[i] && special.includes(letters[i]))
                ret.push(word.slice(0, i - 1) + word.slice(i));
    }

    if (!skip.flipLetters)
        flipLetters();
    if (!skip.dropDuplicates)
        dropDuplicates();

    // We don't have enough, retry more desperately
    if (ret.length < 3 && !desperate)
        return genMispellings(word, true, skip);

    // TODO recursively apply to generated misspellings

    // We have plenty, remove ones which change first part of the word
    if (ret.length > 8)
        ret = ret.slice(0, 8);
    return ret;
}