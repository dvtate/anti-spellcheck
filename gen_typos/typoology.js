/**
 * File made as I study typos
 */

// Maybe one day useful for determining what spellings are confusing
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split();
const vowels = 'aeiouy'.split('');
const consonants = alphabet.filter(l => !vowels.includes(l));
// TODO equivalent sounds/dipthongs?

// Fatfinger probability
const keyboardRows = 'qwertyuiop asdfghjkl zxcvbnm'.split(' ');
const neighboringKeys = (() => {
    // Array of 2 character strings for neighboring keys
    const ret = [];

    // Horizontal neighbors, look right
    keyboardRows.forEach(r => {
        for (let i = 0; i < r.length - 2; i++)
            ret.push(r.substring(i, i + 2));
    });

    // Vertical neighbors, look up
    for (let ri = 1; ri < keyboardRows.length; ri++)
        for (let i = 0; i < keyboardRows[ri].length; i++) {
            ret.push(keyboardRows[ri][i] + keyboardRows[ri - 1][i]);
            ret.push(keyboardRows[ri][i] + keyboardRows[ri - 1][i + 1]);
        }

    // Bi-directional
    const l = ret.length;
    for (let i = 0; i < l; i++)
        ret.push(ret[i][1] + ret[i][0]);
    return ret;
})();

// Likely to flip these
const lhsKeys = 'qwertasdfgzxcvb'.split('');
const rhsKeys = 'yuiophjklnm'.split('');

// Helper functions
function pairsPerms(arr) {
    if (typeof arr === 'string')
        arr = arr.split('');
    const ret = [];
    for (let i = 0; i < arr.length; i++)
        for (let j = 0; j < arr.length; j++)
            if (j !== i)
                ret.push([arr[i], arr[j]]);
    return ret.map(s => s.join(''));
}
function possiblePairs(a, b) {
    const ret = [];
    a.forEach(a =>
        b.forEach(b =>
            ret.push(a + b, b + a)))
    return ret;
}

// Letter similarity => less likely to notice typos
// Somewhat arbitrary
const similarLetters = [...new Set([
    ...pairsPerms('aceo'),
    ...pairsPerms('tlifbhd'),
    ...pairsPerms('umnhr'),
    ...pairsPerms('vwyx'),
    ...pairsPerms('odbc'),
    ...pairsPerms('jgypq'),
    'uv', 'sz', 'bd', 'nr',
    'vu', 'zs', 'db', 'rn',
    'ij', 'il', 'bh', 'hb',
    'cd', 'aq', 'nm', 'nh',
    'ht', 'yu', 'ft', 'xz',
    'gy', 'vy',
])];
const oppositeHands = possiblePairs(lhsKeys, rhsKeys);


/// Generate a list of all possible substr replacements
function strReplacements(str, from, to) {
    function strOverwrite(str, ind, substr) {
        // console.log({str, ind, substr});
        return str.slice(0, ind) + substr + str.slice(ind + substr.length);
    }
    const ret = [];
    let i = str.indexOf(from);
    let i2 = i;
    while (i2 !== -1 && ret.length < 10) {
        ret.push(strOverwrite(str, i, to));
        i2 = str.slice(i + 1).indexOf(from);
        i += i2 + 1;
    }
    return ret;
}

function strDuppedChars(s) {
    let ret = 0;
    for (let i = 1; i < s.length; i++)
        if (s[i - 1] == s[i])
            ret++;
    return ret;
}


/**
 * Generate a list of mispellings for a given word
 * @param {string} word word to generate mispellings for
 * @param {object} skip should we skip certain part of process?
 * @param {boolean} desperate how desperate are we
 * @returns {string[]} list of mispelled forms of the word
 */
function genMispellings(word, skip = {}, desperate = false) {
    let ret = [];

    // Flip letters we type together quickly
    function flipLetters() {
        const commonlyFlipped = similarLetters.filter(p =>
            oppositeHands.includes(p) && !(desperate && neighboringKeys.includes(p)));
        const nDups = strDuppedChars(word);
        const spellings = commonlyFlipped
            .map(p => strReplacements(word, p[0], p[1]))
            .reduce((a, b) => a.concat(b), []);


        // console.log('flipLetters', spellings);

        // If not desparate don't break up duplicate letters bc
        if (desperate)
            ret.push(...spellings);
        else
            ret.push(...spellings.filter(s => strDuppedChars(s) === nDups));
    }

    // Pick location and flip to neighboring key
    // Don't flip if previous key is also a neighbor?
    // TODO this is usually easier to spot so maybe less impactful
    function fatFinger() {
        for (let i = 0 ; i < word.length; i++) {

        }

        // if not desparate don't break up duplicate letters
    }

    // Remove duplicate letters
    function dropDuplicates() {
        const letters = word.split('');
        const special = desperate ? 'oe' : ''; // easier to spot e or o dups (imo)
        const spellings = [];
        for (let i = 0; i < letters.length; i++)
            if (letters[i - 1] === letters[i] && special.includes(letters[i]))
                spellings.push(word.slice(0, i - 1) + word.slice(i));

        if (desperate) {
            spellings.push(...strReplacements(word, 'ee', 'i'));
            spellings.push(...strReplacements(word, 'oo', 'u'));
        }

        // console.log('dropDuplicates', spellings);
        ret.push(...spellings);
    }

    if (!skip.flipLetters)
        flipLetters();
    if (!skip.dropDuplicates)
        dropDuplicates();
    if (!skip.fatFinger)
        fatFinger();

    // We don't have enough, retry more desperately
    if (ret.length < 3 && !desperate)
        return genMispellings(word, true, skip);

    // TODO recursively apply to generated misspellings

    function changeScore(s) {
        function firstChangedLetter() {
            for (let i = 0; i < word.length; i++)
                if (word[i] !== s[i])
                    return i;
            return word.length;
        }

        // Change to start of word more noticable
        // Word length - First changed letter index
        let score = word.length - firstChangedLetter();

        // Different number of duplicate characters... kinda noticable
        if (strDuppedChars(word) !== strDuppedChars(s))
            score += 3;

        return score;
    }

    // We have plenty, pick top 8
    if (ret.length > 8 && !desperate)
        ret = ret
            .sort((a, b) => changeScore(a) - changeScore(b))
            .slice(0, 8);

    //
    if (ret.length || desperate)
        return ret;
    else
        return genMispellings(word, skip, desperate);
}

module.exports.genMispellings = genMispellings;