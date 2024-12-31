let gridWidth = 5;
let gridHeigth = 5;

const maxLongWords = 30;
let selectedGrid = null;

const Direction = {
    horizontal: 'h',
    vertical: 'v'
}

function shuffleArray(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {

        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

function checkInNonValidPosition(grid, x, y) {
    return x < 0 || y < 0 || x > grid.size.x - 1 || y > grid.size.y - 1;
}

function checkIfGroupedWordIndexIsPrimary(word, index) {
    const result = isLibraryAllGroupsContainsWord(word);

    if (result == null) return;

    return index == result.sameLetterIndex;
}

function forEachWordPosition(word, callback) {
    const xAdd = word.direction == Direction.horizontal ? 1 : 0;
    const yAdd = word.direction == Direction.vertical ? 1 : 0;
    for (let i = 0; i < word.word.length; i++) {
        callback?.(word.position.x + i * xAdd, word.position.y + i * yAdd, i);
    }
}

function forEachWordPositionExt(word, callback) {
    const xAdd = word.direction == Direction.horizontal ? 1 : 0;
    const yAdd = word.direction == Direction.vertical ? 1 : 0;
    for (let i = 0; i < word.word.length; i++) {
        callback?.({
            character: word.word[i], position: { x: word.position.x + i * xAdd, y: word.position.y + i * yAdd }
        });
    }
}

function getWord(density) {
    if (usingLibrary.categorized == null) return { word: usingLibrary.filtered[randomInt(0, usingLibrary.filtered.length - 1)], type: 'default' };

    function getWordPriority(density, noGroupedWords) {
        const longPriority = Math.max(0.5 - density, 0.1);
        const mediumPriority = Math.max(0.6 - density / 2, 0.2);
        const shortPriority = Math.min(0.4 + density, 0.9);
        return { shortPriority, mediumPriority, longPriority };
    }
    function chooseWord({ shortWords, mediumWords, longWords }, priority) {
        const { shortPriority, mediumPriority, longPriority } = priority;

        const random = Math.random();
        if (random < longPriority && longWords.length > 0) {
            return longWords[Math.floor(Math.random() * longWords.length)];
        } else if (random < longPriority + mediumPriority && mediumWords.length > 0) {
            return mediumWords[Math.floor(Math.random() * mediumWords.length)];
        } else if (shortWords.length > 0) {
            return shortWords[Math.floor(Math.random() * shortWords.length)];
        }
        return null;
    }
    function getRandomGroupedWord() {
        const groups = usingLibrary.groups;
        let allGroupWords = [];
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            allGroupWords = allGroupWords.concat(group.getWords());
        }

        if (allGroupWords.length == 0) return null;

        const selected = allGroupWords[randomInt(0, allGroupWords.length)];

        return selected;
    }

    const priority = getWordPriority(density);
    const defaultWordObject = { word: chooseWord(usingLibrary.categorized, priority), type: 'default' };

    const result = [];

    if (usingLibrary.groups.length > 0 && (!startWithGroupedWords && density > .01 || startWithGroupedWords)) {
        const groupedWord = { word: getRandomGroupedWord(), type: 'grouped' };
        if (groupedWord.word != null) {
            result.push(groupedWord);
        }
    }

    result.push(defaultWordObject);

    return result;
}

function getGridWords(grid) {
    const words = [];
    for (let i = 0; i < grid.words.length; i++) {
        words.push(grid.words[i].word);
    }
    return words;
}

function isWordPlacedOnPosition(wordObject, x, y) {
    const wordDirection = wordObject.direction;
    for (let i = 0; i < wordObject.word.length; i++) {
        const tx = wordObject.position.x + (wordDirection == Direction.horizontal ? 1 : 0);
        const ty = wordObject.position.y + (wordDirection == Direction.vertical ? 1 : 0);

        if (tx == x && ty == y) return true;
    }

    return false;
}

function getGridWordsInPosition(grid, x, y) {
    const words = [];
    for (let i = 0; i < grid.words.length; i++) {
        const wordObject = grid.words[i];
        if (isWordPlacedOnPosition(wordObject, x, y)) {
            words.push(wordObject.word);
        }
    }

    return words;
}

function randomInt(from, to) {
    return from + Math.floor(Math.random() * Math.floor(to - from));
}

function createGrid(width, height) {
    var grid = {
        size: { x: parseInt(width), y: parseInt(height) },
        words: [],
        density: 0
    };

    return grid;
}

function createWord(word, x, y, direction) {
    return {
        word,
        position: { x, y },
        direction
    }
}

function hasNeighborAtPosition(grid, x, y, direction) {
    if (direction == Direction.vertical) {
        for (let xs = -1; xs <= 1; xs++) {
            const tx = x + xs;
            if (tx < 0) continue;
            if (xs != 0 && getCellCharacter(grid, tx, y) != null) {
                return true;
            }
        }
    } else {
        for (let ys = -1; ys <= 1; ys++) {
            const ty = y + ys;
            if (ty < 0) continue;
            if (ys != 0 && getCellCharacter(grid, x, ty) != null) return true;
        }
    }
    return false;
}

function getCharactersInCrossOfPosition(grid, x, y) {
    const cells = [];
    for (let xs = -1; xs <= 1; xs++) {
        for (let ys = -1; ys <= 1; ys++) {
            if (xs == 0 || ys == 0) continue;
            const tx = x + xs;
            const ty = y + ys;

            const cellCharacter = getCellCharacter(grid, tx, ty);

            if (cellCharacter != null) cells.push({ character: cellCharacter, x: tx, y: ty });
        }
    }

    return cells;
}

function getNeighborCharactersInPosition(grid, x, y) {
    const cells = [];
    for (let xs = -1; xs <= 1; xs++) {
        for (let ys = -1; ys <= 1; ys++) {
            if (xs == 0 && ys == 0) continue;
            const tx = x + xs;
            const ty = y + ys;

            const cellCharacter = getCellCharacter(grid, tx, ty);

            if (cellCharacter != null) cells.push({ character: cellCharacter, x: tx, y: ty });
        }
    }

    return cells;
}

function getSidedNeighborCharactersInPosition(grid, x, y, direction) {
    const cells = [];
    for (let xs = -1; xs <= 1; xs++) {
        for (let ys = -1; ys <= 1; ys++) {
            if ((direction == Direction.horizontal && xs == 0) || (direction == Direction.vertical && ys == 0)) continue;
            const tx = x + xs;
            const ty = y + ys;

            const cellCharacter = getCellCharacter(grid, tx, ty);

            if (cellCharacter != null) cells.push({ character: cellCharacter, x: tx, y: ty });
        }
    }

    return cells;
}

function getCellCharacter(grid, x, y) {
    if (x < 0 || x > grid.size.x - 1 || y < 0 || y > grid.size.y - 1) return null;
    for (let i = 0; i < grid.words.length; i++) {
        const gridWord = grid.words[i];
        for (let j = 0; j < gridWord.word.length; j++) {
            const tx = gridWord.direction == Direction.horizontal ? gridWord.position.x + j : gridWord.position.x;
            const ty = gridWord.direction == Direction.vertical ? gridWord.position.y + j : gridWord.position.y;

            if (tx == x && ty == y) return gridWord.word[j];
        }
    }

    return null;
}

function tryPlaceWord(grid, word, x, y, direction) {
    let intersections = [];
    let intersected = false;

    for (let i = 0; i < word.length; i++) {
        const tx = direction == Direction.horizontal ? x + i : x;
        const ty = direction == Direction.vertical ? y + i : y;

        const currentWordCharacter = word[i];
        const gridPositionedCharacter = getCellCharacter(grid, tx, ty);

        if (gridPositionedCharacter != null && currentWordCharacter != gridPositionedCharacter || tx > grid.size.x - 1 || ty > grid.size.y - 1) {
            return null;
        }
        else if (gridPositionedCharacter == null && hasNeighborAtPosition(grid, tx, ty, direction)) {
            return null;
        }
        else if (gridPositionedCharacter != null && currentWordCharacter == gridPositionedCharacter) {
            if (intersected) return null;
            intersections.push({ x: tx, y: ty });
            intersected = true;
        } else {
            intersected = false;
        }
    }

    if (direction == Direction.vertical && (getCellCharacter(grid, x, y + word.length) != null || getCellCharacter(grid, x, y - 1) != null)) {
        return null;
    }
    else if (direction == Direction.horizontal && (getCellCharacter(grid, x + word.length, y) != null || getCellCharacter(grid, x - 1, y) != null)) {
        return null;
    }

    if (intersections.length == 0 && grid.words.length > 0) return null;

    return { word, position: { x, y }, direction, intersections };
}

function isWordOnGrid(grid, word) {
    for (let i = 0; i < grid.words.length; i++) {
        if (word == grid.words[i].word) return true;
    }
    return false;
}

function getCellPriority(grid, x, y) {
    if (x < 0 || x > grid.size.x - 1 || y < 0 || y > grid.size.y - 1) return 0;
    for (let i = 0; i < grid.words.length; i++) {
        const gridWord = grid.words[i];
        for (let j = 0; j < gridWord.word.length; j++) {
            const tx = gridWord.direction == Direction.horizontal ? gridWord.position.x + j : gridWord.position.x;
            const ty = gridWord.direction == Direction.vertical ? gridWord.position.y + j : gridWord.position.y;

            if (tx == x && ty == y && isLibraryUsedGroupsContainsWord(gridWord.word)) {
                return 1;
            };
        }
    }

    return 0;
}

function getWordPositionAtIndex(wordObject, index) {
    return getWordPositionAtIndexExt(wordObject.position, wordObject.direction, index);
}

function getWordPositionAtIndexExt(startPosition, direction, index) {
    return {
        x: startPosition.x + (direction == Direction.horizontal ? index : 0),
        y: startPosition.y + (direction == Direction.vertical ? index : 0)
    }
}

function checkIfPotentialWordConflictWithGroupedWord(grid, result) {
    const { word, direction, position } = result;

    const groupContainment = isLibraryAllGroupsContainsWord(word);


    for (let i = 0; i < word.length; i++) {
        const tpos = getWordPositionAtIndexExt(position, direction, i);

        if (groupContainment) {
            if (groupContainment.sameLetterIndex == i) {

                const crossedCells = getCharactersInCrossOfPosition(grid, tpos.x, tpos.y);
                if (crossedCells.length > 0) {
                    return true;
                }
            }
        } else {

            const neighborCells = getSidedNeighborCharactersInPosition(grid, tpos.x, tpos.y, direction);

            for (let j = 0; j < neighborCells.length; j++) {
                const { x, y } = neighborCells[j];

                const wordsInPosition = getGridWordsInPosition(grid, x, y);
                for (let k = 0; k < wordsInPosition.length; k++) {
                    const wordInPos = wordsInPosition[k];

                    if (isLibraryUsedGroupsContainsWord(wordInPos)) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

function createWordInPosition(grid, word, x, y, directions) {
    for (let i = 0; i < directions.length; i++) {
        const direction = directions[i];
        const result = tryPlaceWord(grid, word, x, y, direction);

        if (result != null) {
            return createWord(word, x, y, direction);
        }
    }

    return null;
}

function moveByGridAndTryPlaceWords(grid, words, start, step) {
    for (let i = 0; i < words.length; i++) {
        const word = words[i].word;
        for (let x = start; x < grid.size.x - start; x += step) {
            for (let y = start; y < grid.size.y - start; y += step) {
                const directions = [Direction.horizontal, Direction.vertical];
                shuffleArray(directions);

                const createdWord = createWordInPosition(grid, word, x, y, directions);

                if (createdWord != null) {
                    return createdWord;
                }
            }
        }
    }
}

function moveByWordsAndTryPlaceWords(grid, words) {
    const directions = [Direction.horizontal, Direction.vertical];
    shuffleArray(directions);

    if (grid.words.length == 0) {
        const result = createWordInPosition(grid, words[0].word, 0, 0, directions);
        return result;
    }

    const gridWords = [].concat(grid.words);
    shuffleArray(gridWords)

    for (let i = 0; i < gridWords.length; i++) {
        const { direction } = gridWords[i];
        for (let j = 0; j < words.length; j++) {
            const { word: potentialWord, type } = words[j];

            const creationDirection = direction == Direction.horizontal ? Direction.vertical : Direction.horizontal;
            let createdWord = null;

            if (type == 'grouped') {
                let ind = -1;

                for (let gi = 0; gi < usingLibrary.groups.length; gi++) {
                    const element = usingLibrary.groups[gi];
                    if (element.toUse.includes(potentialWord)) {
                        ind = element.sameLetterIndex;
                    }
                }

                if (ind >= 0) {
                    forEachWordPosition(gridWords[i], (x, y) => {
                        const tx = creationDirection == Direction.horizontal ? x - ind : x;
                        const ty = creationDirection == Direction.vertical ? y - ind : y;

                        if (tx < 0 || ty < 0) return;

                        const created = createWordInPosition(grid, potentialWord, tx, ty, [creationDirection]);

                        if (created != null) {
                            createdWord = created;
                            return;
                        }
                    });
                }
            } else {
                forEachWordPosition(gridWords[i], (x, y, i) => {
                    const tx = Math.max(creationDirection == Direction.horizontal ? (x - potentialWord.length + i) : x, 0);
                    const ty = Math.max(creationDirection == Direction.vertical ? (y - potentialWord.length + i) : y, 0);

                    const created = createWordInPosition(grid, potentialWord, tx, ty, [creationDirection]);

                    if (created != null) {
                        createdWord = created;
                        return;
                    }
                });
            }

            if (createdWord != null) {
                return createdWord;
            }
        }
    }
}

function tryInsertWord(grid, density, iteration) {
    if (iteration <= 0) return null;

    let words = getWord(density);

    let placedWord = moveByGridAndTryPlaceWords(grid, words, 0, 1);
    // let placedWord = moveByWordsAndTryPlaceWords(grid, words);
    if (placedWord != null) return placedWord;


    return tryInsertWord(grid, density, iteration - 1);
}

function getGridDensity(grid) {
    const overallGridCount = gridWidth * gridHeigth;
    let filledGridCount = 0;

    for (let x = 0; x < grid.size.x; x++) {
        for (let y = 0; y < grid.size.y; y++) {
            if (getCellCharacter(grid, x, y) != null) filledGridCount++;
        }
    }

    return filledGridCount / overallGridCount;
}

function getGroupSummary(grid) {
    let sum = 0;
    for (let j = 0; j < grid.groups.length; j++) {
        sum += grid.groups[j].used.length;
    }
    return sum;
}

function groupsContainsWord(grid, word) {
    for (let i = 0; i < grid.groups.length; i++) {
        const group = grid.groups[i];

        if (group.used.includes(word)) return { index: i, sameLetterIndex: group.sameLetterIndex };
    }

    return null;
}

function getRandomRevealedLetter(grid, otherRevealed) {
    const wordObjects = [];
    function otherContains(word) {
        for (let i = 0; i < otherRevealed.length; i++) {
            const otherWord = otherRevealed[i].word;
            if (word == otherWord) {
                return true;
            }
        }

        return false;
    }

    for (let i = 0; i < grid.words.length; i++) {
        const wordObject = grid.words[i];
        if (otherContains(wordObject.word)) continue;

        wordObjects.push(wordObject);
    }

    if (wordObjects.length == 0) return null;

    const randomWordObject = wordObjects[randomInt(0, wordObjects.length)];
    const { direction, position } = randomWordObject;

    const wordLength = randomWordObject.word.length;
    const random = randomInt(0, wordLength);

    const x = position.x + (direction == Direction.horizontal ? random : 0);
    const y = position.y + (direction == Direction.vertical ? random : 0);

    return {
        position: { x, y },
        letter: randomWordObject.word[random],
        word: randomWordObject.word
    };
}

function getRandomRevealedWord(grid, otherRevealed) {
    const wordObjects = [];
    function otherContains(word) {
        for (let i = 0; i < otherRevealed.length; i++) {
            const otherWord = otherRevealed[i].word;
            if (word == otherWord) {
                return true;
            }
        }

        return false;
    }

    for (let i = 0; i < grid.words.length; i++) {
        const wordObject = grid.words[i];
        if (otherContains(wordObject.word)) continue;

        wordObjects.push(wordObject);
    }

    if (wordObjects.length == 0) return null;

    const randomWordObject = wordObjects[randomInt(0, wordObjects.length)];
    const { word, direction, position } = randomWordObject;

    const wordLength = randomWordObject.word.length;

    const revealedCells = [];
    for (let i = 0; i < wordLength; i++) {
        const tpos = getWordPositionAtIndexExt(position, direction, i);
        revealedCells.push({
            position: tpos,
            letter: word[i],
            word: word
        })
    }


    return revealedCells;
}

function getGroupedRevealedLetter(grid, otherRevealed) {
    const wordObjects = [];
    function otherContains(word) {
        for (let i = 0; i < otherRevealed.length; i++) {
            const otherWord = otherRevealed[i].word;
            if (word == otherWord) {
                return true;
            }
        }

        return false;
    }

    for (let i = 0; i < grid.words.length; i++) {
        const wordObject = grid.words[i];

        if (otherContains(wordObject.word)) continue;

        const res = groupsContainsWord(grid, wordObject.word);
        if (res == null) continue;

        wordObject.sameLetterIndex = res.sameLetterIndex;
        wordObjects.push(wordObject);
    }

    if (wordObjects.length == 0) return null;

    const toReveal = [];
    for (let i = 0; i < wordObjects.length; i++) {
        const { word, sameLetterIndex, position, direction } = wordObjects[i];
        const x = position.x + (direction == Direction.horizontal ? sameLetterIndex : 0);
        const y = position.y + (direction == Direction.vertical ? sameLetterIndex : 0);
        toReveal.push({
            position: { x, y },
            letter: word[sameLetterIndex],
            word: word
        })
    }

    return toReveal.length == 0 ? null : toReveal[randomInt(0, toReveal.length)];
}

function getGroupedWords() {
    const groups = usingLibrary.groups;
    const words = [];
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        for (let j = 0; j < group.used.length; j++) {
            words.push({ word: group.used[j], groupIndex: i, sameLetterIndex: group.sameLetterIndex });
        }
    }
    return words;
}

function buildGridView(grid) {
    selectedGrid = grid;

    const gridElement = document.getElementById("grid-wrapper");
    document.getElementById("density-title").innerText = `Density: ${Math.floor(grid.density * 100)}% | Words: ${grid.words.length}`;

    for (let x = 0; x < grid.size.x; x++) {
        for (let y = 0; y < grid.size.y; y++) {

            const character = getCellCharacter(grid, x, y);
            const cellElement = gridElement.children[x + y * grid.size.x];
            const letter = cellElement.children[0];
            const number = cellElement.children[1];
            number.innerText = '';

            if (character != null) {
                letter.innerText = character;
                cellElement.style.backgroundColor = "white";
                cellElement.style.visibility = 'visible';
                letter.style.color = '#222';
                if (!cellElement.classList.contains('filled-cell')) {
                    cellElement.classList.add('filled-cell');
                }
            } else {
                cellElement.style.backgroundColor = "#00000000";
                letter.innerText = '-';
                letter.style.color = '#222';
                cellElement.style.visibility = 'hidden';
                cellElement.classList.remove('filled-cell');
            }
        }
    }

    function getColorByGroup(index) {
        switch (index) {
            case 0:
                return '#3a3';
            case 2:
                return '#a43';
            case 3:
                return '#a48';
            case 4:
                return '#fc3';
            case 5:
                return '#ef3';
            case 6:
                return '#ecf';
            default:
                return '#f8f';
        }
    }

    const list = document.getElementById('word-list');
    for (let i = list.children.length - 1; i >= 0; i--) {
        const element = list.children[i];
        element.remove();
    }

    for (let i = 0; i < grid.words.length; i++) {
        const word = grid.words[i];
        if (word == null || word.word == null) continue;

        const cellElement = gridElement.children[word.position.x + word.position.y * grid.size.x];
        if (cellElement)
            cellElement.children[1].innerText = i + 1;

        const groupContainment = groupsContainsWord(grid, word.word);
        if (groupContainment != null) {
            forEachWordPosition(word, (x, y, index) => {
                const cell = gridElement.children[x + y * grid.size.x];
                if (index == groupContainment.sameLetterIndex) {
                    cell.style.backgroundColor = getColorByGroup(groupContainment.index)
                }

                cell.children[0].style.color = getColorByGroup(groupContainment.index);
            })
        }

        const wordListItem = document.createElement('span');
        wordListItem.innerText = `${i + 1}. ${word.word.toUpperCase()} - ${word.position.x}-${word.position.y}`;
        list.append(wordListItem);
    }

    if (grid.revealedCells) {
        for (let i = 0; i < grid.revealedCells.length; i++) {
            const cell = grid.revealedCells[i];
            const cellElement = gridElement.children[cell.position.x + cell.position.y * grid.size.x];

            if (cellElement) {
                cellElement.style.backgroundColor = '#884EA0';
            }
        }
    }
}

function previewResults(grids, selectedGrid) {
    function createLink(prefix, grid) {
        const link = document.createElement('a');
        link.classList.add('result-link');
        link.innerText = `${prefix} - D: ${Math.floor(grid.density * 100)}% | W: ${grid.words.length} | S: ${grid.groups.sum}`;
        link.onclick = () => buildGridView(grid);

        return link;
    }

    const resultContainer = document.getElementsByClassName('result-container')[0];
    if (resultContainer.children.length > 0) {
        for (let i = resultContainer.children.length - 1; i >= 0; i--) {
            resultContainer.children[i].remove();
        }
    }

    for (let i = 0; i < grids.length; i++) {
        const grid = grids[i];
        const link = createLink(i + 1, grid);

        resultContainer.insertAdjacentElement('beforeend', link);
    }
    const separator = document.createElement("span");
    separator.innerText = "-";
    separator.style.visibility = 'hidden';
    resultContainer.insertAdjacentElement('beforeend', separator);
    resultContainer.insertAdjacentElement('beforeend', createLink("BEST", selectedGrid));
}

async function generateCrossword() {
    selectedGrid = null;

    const exportButton = document.getElementsByClassName('export-button')[0];
    const body = document.getElementsByTagName('body')[0];

    if (!exportButton.classList.contains('disabled')) {
        exportButton.classList.add('disabled');
    }

    if (!body.classList.contains('disabled')) {
        body.classList.add('disabled');
    }

    await new Promise((p) => setTimeout(() => p(), 200));

    const gridList = [];

    let completedConditions = false;

    const iterationElement = document.getElementById('iteration');

    let iteration = 1;
    while (!completedConditions) {
        for (let it = 0; it < gridGenerationIteration; it++) {
            const grid = generate();
            iterationElement.innerText = ` [ Iteration: ${iteration} ]`

            const density = getGridDensity(grid);
            const sum = getGroupSummary(grid);
            grid.density = density;
            grid.groups.sum = sum;

            iteration++;

            let isLoopBreaks = false;
            if (grid.density > 0.55 && grid.groups.sum == sameLetterGroupCount * sameLetterWordCount) {
                // if all grouped letter intersects then break look

                for (let i = 0; i < grid.words.length; i++) {
                    const { word, direction } = grid.words[i];
                    const result = groupsContainsWord(grid, word);
                    if (result != null) {
                        const { x, y } = getWordPositionAtIndex(grid.words[i], result.sameLetterIndex);
                        if (!hasNeighborAtPosition(grid, x, y, direction)) {
                            isLoopBreaks = true;
                        }
                    }
                }

                if (isLoopBreaks) {
                    continue;
                }

                gridList.push(grid);

                previewResults(gridList, grid);
                buildGridView(grid);

                if (gridList.length >= maxGridCount)
                    completedConditions = true;
                break;
            }
        }

        await new Promise(p => setTimeout(() => p(), 1))
    }


    function getGridWithMostVaibleConditions() {
        const sorted = gridList.sort((a, b) => b.groups.sum > a.groups.sum);

        const toNewSort = [];
        const lastSum = sorted[0].groups.sum;

        for (let i = 0; i < sorted.length; i++) {
            if (lastSum == sorted[i].groups.sum) {
                toNewSort.push(sorted[i]);
            }
        }

        return getGridWithHighestDinsity(toNewSort);
    }

    function getGridWithBiggestWordCount(grids) {
        return grids.sort((a, b) => b.words.length > a.words.length)[0];
    }

    function getGridWithHighestDinsity(grids) {
        return grids.sort((a, b) => b.density > a.density)[0];
    }

    let finalGrid = getGridWithMostVaibleConditions();
    previewResults(gridList, finalGrid);

    buildGridView(finalGrid);

    await new Promise((p) => setTimeout(() => p(), 200));

    exportButton.classList.remove('disabled');
    body.classList.remove('disabled');
}

function generate() {
    createSession(gridWidth, gridHeigth, maxLongWords, sameLetterWordCount, sameLetterGroupCount);
    const grid = createGrid(gridWidth, gridHeigth);

    for (let it = 0; it < 1; it++) {
        for (let iteration = 0; iteration < generationInterations; iteration++) {
            const density = getGridDensity(grid);
            const result = tryInsertWord(grid, density, wordSelectionIterations);
            if (result != null) {
                usingLibrary.remove(result.word);
                grid.words.push(result);
            }
        }
    }

    grid.groups = usingLibrary.groups;


    if (isFirstLetterRandom) {
        grid.revealedCells = [];

        for (let i = 0; i < revealedLetterCount; i++) {
            const revealed = getRandomRevealedLetter(grid, grid.revealedCells);
            if (revealed != null) {
                grid.revealedCells.push(revealed);
            }
        }
    } else {
        grid.revealedCells = [];

        for (let i = 0; i < revealedLetterCount; i++) {
            let revealed = getGroupedRevealedLetter(grid, grid.revealedCells);
            if (revealed == null) {
                revealed = getRandomRevealedLetter(grid, grid.revealedCells);
            }

            if (revealed != null) {
                grid.revealedCells.push(revealed);
            }
        }
    }

    if (revealedWordCount > 0) {
        for (let i = 0; i < revealedWordCount; i++) {
            const revealed = getRandomRevealedWord(grid, grid.revealedCells);
            if (revealed != null && revealed.length > 0) {
                const split = grid.revealedCells.concat(revealed);
                grid.revealedCells = split;
            }
        }
    }

    return grid;
}

function start() {
}

function createField(x, y) {
    if (x != null) gridWidth = x;
    if (y != null) gridHeigth = y;

    document.getElementById('grid-size').innerText = `${gridWidth}x${gridHeigth}`;

    const gridElement = document.getElementById("grid-wrapper");
    for (let i = gridElement.children.length - 1; i >= 0; i--) {
        const element = gridElement.children[i];
        element.remove();
    }

    const ratio = gridWidth / gridHeigth;

    const width = ratio < 1 ? 80 * ratio : 80;
    const height = ratio > 1 ? 80 / ratio : 80;

    const fontSize = Math.min(width, height) / Math.min(gridWidth, gridHeigth) / 5;


    gridElement.style.width = `${width}vh`;
    gridElement.style.height = `${height}vh`;

    gridElement.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;

    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeigth; y++) {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');

            const cellLetter = document.createElement('span');
            cellLetter.id = 'cell-letter';
            cellElement.style.fontSize = `${fontSize}em`;
            cellElement.insertAdjacentElement('afterbegin', cellLetter);

            const number = document.createElement('span');
            number.classList.add('cell-number');
            cellElement.insertAdjacentElement('beforeend', number);
            number.innerText = x + y * gridWidth;

            gridElement.insertAdjacentElement('beforeend', cellElement);
            cellElement.style.backgroundColor = "#00000000";
        }
    }

    localStorage.setItem('gw', gridWidth);
    localStorage.setItem('gh', gridHeigth);

    start(x, y);
}

function exportCrossword(grid) {
    function arrayToCsv(data) {
        return data.map(row =>
            row
                .map(String)  // convert every value to String
                .map(v => v.replaceAll('"', '""'))  // escape double quotes
                .map(v => `"${v}"`)  // quote it
                .join(',')  // comma-separated
        ).join('\r\n');  // rows starting on new lines
    }

    function downloadBlob(content, filename, contentType) {
        // Create a blob
        var blob = new Blob([content], { type: contentType });
        var url = URL.createObjectURL(blob);

        // Create a link to download it
        var pom = document.createElement('a');
        pom.href = url;
        pom.setAttribute('download', filename);
        pom.click();
    }

    if (grid == null) return;

    const excelExport = [];
    for (let y = 0; y < grid.size.y; y++) {
        const row = [];
        for (let x = 0; x < grid.size.x; x++) {
            row.push('-');
        }
        excelExport.push(row);
    }


    for (let i = 0; i < grid.words.length; i++) {
        forEachWordPositionExt(grid.words[i], (result) => {
            const { character, position: { x, y } } = result;
            excelExport[y][x] = character.toUpperCase();
        })
    }

    for (let i = 0; i < grid.revealedCells.length; i++) {
        const cell = grid.revealedCells[i];
        const { x, y } = { x: cell.position.x, y: cell.position.y }
        excelExport[y][x] += '*';
    }

    downloadBlob(arrayToCsv(excelExport), 'export.csv', 'text/csv;charset=utf-8;');
    return;

    let textExport = `${grid.size.x}|${grid.size.y}\n`;
    for (let i = 0; i < grid.words.length; i++) {
        const { word, position: { x, y }, direction } = grid.words[i];
        textExport += `${word.toUpperCase()}|${x}|${y}|${(direction == Direction.vertical ? "Vertical" : "Horizontal")}|\n`
    }
}

function exportSelectedCrossword() {
    exportCrossword(selectedGrid);
}
// createField(localStorage.getItem("gw") ?? 10, localStorage.getItem("gh") ?? 10);