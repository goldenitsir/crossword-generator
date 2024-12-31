let usingLibrary = {};

function randomNumbers(count, from, to) {
    const arr = []

    for (let i = 0; i < count; i++) {
        while (arr.length < count) {
            let newRandomInt = randomInt(from, to + 1);
            if (!arr.includes(newRandomInt)) {
                arr.push(newRandomInt)
            }
        }
    }
    return arr;
}

function removeSameWords(targetWords, templateWords) {
    for (let i = 0; i < templateWords.length; i++) {
        for (let j = targetWords.length; j >= 0; j--) {
            if (templateWords[i] == targetWords[j]) {
                targetWords.splice(j, 1);
            }
        }
    }

    return targetWords;
}

async function fetchRandomWords(count) {
    const url = `https://random-word-api.herokuapp.com/word?number=${count}`;
    try {
        const response = await fetch(url);
        const words = await response.json();
        return words;
    } catch (error) {
        console.error('Error fetching random words:', error);
        return [];
    }
}

function filterWordsByLength(words, minLength, maxLength) {
    return words
        .filter(word => word.length >= minLength && word.length <= maxLength)
        .sort((a, b) => a.length - b.length);
}

function limitWordsByLength(words, maxLongWords, longWordThreshold) {
    words = words.sort(() => Math.random() - 0.5);

    const longWords = words.filter(word => word.length > longWordThreshold);
    const shortWords = words.filter(word => word.length <= longWordThreshold);

    const limitedLongWords = longWords.slice(0, maxLongWords);

    return [...shortWords, ...limitedLongWords];
}

function categorizeWords(words) {
    const shortWords = words.filter(word => word.length <= 4);
    const mediumWords = words.filter(word => word.length > 4 && word.length <= 7);
    const longWords = words.filter(word => word.length > 7);
    return { shortWords, mediumWords, longWords };
}

function groupWordsByLetterPositionAndLength(words, position, minWordLength, maxWordLength) {
    const groups = {};

    if (minWordLength > maxWordLength) {
        const tempMin = minWordLength;
        minWordLength = maxWordLength;
        maxWordLength = tempMin
    }

    const filtered = filterWordsByLength(words, minWordLength, maxWordLength)

    filtered.forEach(word => {
        if (word.length > position) {
            const letter = word[position];
            const length = word.length;

            const key = `${letter}_${length}`;

            if (!groups[key]) {
                groups[key] = new Set();
            }
            groups[key].add(word);
        }
    });

    const result = {};
    for (const key in groups) {
        result[key] = Array.from(groups[key]);
    }

    return result;
}

function filterGroupsBySize(groups, size) {
    return Object.values(groups).filter(group => group.length >= size);
}

function selectGroups(groups, count, maxWordCount) {
    const selectedGroups = [];
    const keys = Object.keys(groups);

    while (selectedGroups.length < count && keys.length > 0) {
        const randomIndex = Math.floor(Math.random() * keys.length);
        const group = groups[keys[randomIndex]];
        const obj = {
            used: [],
            toUse: group.slice(0, maxWordCount),
            getWords: (usedMaxSize) => {
                if (obj.used.length >= usedMaxSize) {
                    return [];
                }
                return obj.toUse;
            }
        }

        selectedGroups.push(obj);
        keys.splice(randomIndex, 1);
    }

    return selectedGroups;
}

function isLibraryUsedGroupsContainsWord(word) {
    for (let i = 0; i < usingLibrary.groups.length; i++) {
        const group = usingLibrary.groups[i];

        if (group.used.includes(word)) return { index: i, sameLetterIndex: group.sameLetterIndex };
    }

    return null;
}

function isLibraryAllGroupsContainsWord(word) {
    for (let i = 0; i < usingLibrary.groups.length; i++) {
        const group = usingLibrary.groups[i];

        if (group.used.includes(word) || group.toUse.includes(word)) return { index: i, sameLetterIndex: group.sameLetterIndex };
    }

    return null;
}

function createSession(width, height, maxLongWordCount, wordCountWithSameLetter, groupCountWidthSameLetter) {
    let filteredLibrary = filterWordsByLength(wordsLibrary, 3, Math.max(width, height));

    for (let i = 0; i < filteredLibrary.length; i++) {
        filteredLibrary[i] = filteredLibrary[i].toLocaleLowerCase();
    }

    const maxWordLength = Math.max(Math.max(width, height), 3)

    // filteredLibrary = limitWordsByLength(filteredLibrary, maxLongWordCount, Math.max(width, height));

    const sameLetterIndexes = randomNumbers(groupCountWidthSameLetter, 0, maxWordLength - 1);
    let finalGroups = [];

    function getGroups(pattern) {
        const arr = [];
        for (let i = 0; i < pattern.length; i++) {
            const groups = groupWordsByLetterPositionAndLength(filteredLibrary, pattern[i], 3, maxWordLength);
            const filteredGroups = filterGroupsBySize(groups, wordCountWithSameLetter);
            const selectedGroups = selectGroups(filteredGroups, 1, wordCountWithSameLetter);
            selectedGroups[0].sameLetterIndex = pattern[i];
            arr.push(selectedGroups[0])
        }
        return arr;
    }

    finalGroups = getGroups(sameLetterIndexes);

    for (let i = 0; i < finalGroups.length; i++) {
        const group = finalGroups[i].toUse;
        filteredLibrary = removeSameWords(filteredLibrary, group);
    }

    const categoriedLibrary = categorizeWords(filteredLibrary);

    usingLibrary = {
        filtered: filteredLibrary,
        categorized: categoriedLibrary,
        groups: finalGroups,
        remove: (word) => {
            usingLibrary = removeSameWords(usingLibrary, [word]);

            for (let i = 0; i < usingLibrary.groups.length; i++) {
                const group = usingLibrary.groups[i];
                for (let j = 0; j < group.toUse.length; j++) {
                    const gw = group.toUse[j];
                    if (gw == word) {
                        group.used.push(word);
                        break;
                    }
                }
                usingLibrary.groups[i].toUse = removeSameWords(usingLibrary.groups[i].toUse, [word]);
            }

            if (word.length <= 4) {
                usingLibrary.categorized.shortWords = removeSameWords(usingLibrary.categorized.shortWords, [word]);
            } else if (word.length <= 7) {
                usingLibrary.categorized.mediumWords = removeSameWords(usingLibrary.categorized.mediumWords, [word]);
            } else {
                usingLibrary.categorized.longWords = removeSameWords(usingLibrary.categorized.longWords, [word]);
            }
        }
    }
}