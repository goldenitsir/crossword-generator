let gridWidth = 5;
let gridHeigth = 5;

const maxLongWords = 30;

const Direction = {
    horizontal: 'h',
    vertical: 'v'
}

function forEachWordPosition(word, callback) {
    const xAdd = word.direction == Direction.horizontal ? 1 : 0;
    const yAdd = word.direction == Direction.vertical ? 1 : 0;
    for (let i = 0; i < word.word.length; i++) {
        callback?.(word.position.x + i * xAdd, word.position.y + i * yAdd, i);
    }
}

function getWord(density) {
    if (usingLibrary.categorized == null) return usingLibrary.filtered[randomInt(0, usingLibrary.filtered.length - 1)];
    function getWordPriority(density) {
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
    const word = chooseWord(usingLibrary.categorized, priority);

    const result = [];

    if (!startWithGroupedWords && density > .01 || startWithGroupedWords) {
        const groupedWord = getRandomGroupedWord();
        if (groupedWord != null) {
            result.push(groupedWord);
        }
    }

    result.push(word);

    return result;
}

function randomInt(from, to) {
    return from + Math.floor(Math.random() * Math.floor(to - from));
}

function createGrid(width, height) {
    var grid = {
        size: { x: width, y: height },
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
    let intersections = 0;
    let intersected = false;
    for (let i = 0; i < word.length; i++) {
        const tx = direction == Direction.horizontal ? x + i : x;
        const ty = direction == Direction.vertical ? y + i : y;

        const currentWordCharacter = word[i];
        const gridPositionedCharacter = getCellCharacter(grid, tx, ty);

        if (gridPositionedCharacter != null && currentWordCharacter != gridPositionedCharacter || tx > grid.size.x - 1 || ty > grid.size.y - 1) {
            return false;
        }
        else if (gridPositionedCharacter == null && hasNeighborAtPosition(grid, tx, ty, direction)) {
            return false;
        }
        else if (gridPositionedCharacter != null && currentWordCharacter == gridPositionedCharacter) {
            if (intersected) return false;
            intersections++;
            intersected = true;
        } else {
            intersected = false;
        }
    }

    if (direction == Direction.vertical && (getCellCharacter(grid, x, y + word.length) != null || getCellCharacter(grid, x, y - 1) != null)) {
        return false;
    }
    else if (direction == Direction.horizontal && (getCellCharacter(grid, x + word.length, y) != null || getCellCharacter(grid, x - 1, y) != null)) {
        return false;
    }

    if (intersections == 0 && grid.words.length > 0) return false;
    return true;
}

function isWordOnGrid(grid, word) {
    for (let i = 0; i < grid.words.length; i++) {
        if (word == grid.words[i].word) return true;
    }
    return false;
}

function tryInsertWord(grid, density, iteration) {
    if (iteration <= 0) return null;

    let words = getWord(density);

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        for (let x = 0; x < grid.size.x; x++) {
            for (let y = 0; y < grid.size.y; y++) {
                const horizontalFirstly = randomInt(0, 2) == 1;

                if (!tryPlaceWord(grid, word, x, y, horizontalFirstly ? Direction.horizontal : Direction.vertical)) {
                    if (!tryPlaceWord(grid, word, x, y, horizontalFirstly ? Direction.vertical : Direction.horizontal)) {
                        continue;
                    }
                    return createWord(word, x, y, horizontalFirstly ? Direction.vertical : Direction.horizontal);
                }
                return createWord(word, x, y, horizontalFirstly ? Direction.horizontal : Direction.vertical);
            }
        }
    }
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

function getRandomRevealedLetter(grid) {
    const randomWord = grid.words[randomInt(0, grid.words.length)];
    const direction = randomWord.direction;
    const position = randomWord.position;
    const wordLength = randomWord.word.length;
    const random = randomInt(0, wordLength);

    const x = position.x + (direction == Direction.horizontal ? random : 0);
    const y = position.y + (direction == Direction.vertical ? random : 0);

    return {
        position: { x, y },
        letter: randomWord.word[random]
    };
}

function getGroupedRevealedLetter(grid) {
    const toReveal = [];
    for (let i = 0; i < grid.words.length; i++) {
        const position = grid.words[i].position;
        const direction = grid.words[i].direction;
        const res = groupsContainsWord(grid, grid.words[i].word);
        if (res != null) {
            const { sameLetterIndex } = res;
            const x = position.x + (direction == Direction.horizontal ? sameLetterIndex : 0);
            const y = position.y + (direction == Direction.vertical ? sameLetterIndex : 0);
            toReveal.push({
                position: { x, y },
                letter: grid.words[i].word[sameLetterIndex]
            })
        }
    }
    return toReveal.length == 0 ? null : toReveal[randomInt(0, toReveal.length)];
}

function buildGridView(grid) {
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

    for (let i = 0; i < grid.words.length; i++) {
        const word = grid.words[i];
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

    for (let i = 0; i < maxGridCount; i++) {
        const grid = generate();

        const density = getGridDensity(grid);
        const sum = getGroupSummary(grid);
        grid.density = density;
        grid.groups.sum = sum;


        gridList.push(grid);
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
        grid.revealedCells = [getRandomRevealedLetter(grid)];
    } else {
        let revealed = getGroupedRevealedLetter(grid);
        if (revealed == null) {
            revealed = getRandomRevealedLetter(grid);
        }

        grid.revealedCells = [revealed];
        console.log(grid.revealedCells);
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
            number.innterText = x + y * gridWidth;

            gridElement.insertAdjacentElement('beforeend', cellElement);
            cellElement.style.backgroundColor = "#00000000";
        }
    }

    localStorage.setItem('gw', gridWidth);
    localStorage.setItem('gh', gridHeigth);

    start(x, y);
}
function exportCrossword() {

}
// createField(localStorage.getItem("gw") ?? 10, localStorage.getItem("gh") ?? 10);