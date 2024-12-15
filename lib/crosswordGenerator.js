const maxGridCount = 25;
const normalGridDensity = 0.65;
const generationInterations = 500;
const wordSelectionIterations = 5;
let gridWidth = 5;
let gridHeigth = 5;

const longWordThreshold = 8;
const maxLongWords = 3;

const Direction = {
    horizontal: 'h',
    vertical: 'v'
}

let filtredLibrary = []
let cachedLibrary = [];
let categoriedLibrary;
var grid;



function getWord(density) {
    if (categoriedLibrary == null) return cachedLibrary[randomInt(0, cachedLibrary.length - 1)];
    function getWordPriority(density) {
        const longPriority = Math.max(0.5 - density, 0.1); // От 0.5 до 0.1
        const mediumPriority = Math.max(0.6 - density / 2, 0.2); // От 0.6 до 0.2
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
        return null; // Если все категории пусты
    }
    const priority = getWordPriority(density);
    const word = chooseWord(categoriedLibrary, priority);

    return word;
}

function filterWordsMinMax(words, minLength, maxLength) {
    return words
        .filter(word => word.length >= minLength && word.length <= maxLength)
        .sort((a, b) => a.length - b.length);
}

function filterWordsLengthByCount(words, maxLongWords, longWordThreshold) {
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


    const word = getWord(density);
    const horizontalFirstly = randomInt(0, 2) == 1;
    for (let x = 0; x < grid.size.x; x++) {
        // const word = cachedLibrary[randomInt(0, cachedLibrary.length)];

        for (let y = 0; y < grid.size.y; y++) {
            // const horizontalFirstly = true;

            if (!tryPlaceWord(grid, word, x, y, horizontalFirstly ? Direction.horizontal : Direction.vertical)) {
                if (!tryPlaceWord(grid, word, x, y, horizontalFirstly ? Direction.vertical : Direction.horizontal)) {
                    continue;
                }
                return createWord(word, x, y, horizontalFirstly ? Direction.vertical : Direction.horizontal);
            }
            return createWord(word, x, y, horizontalFirstly ? Direction.horizontal : Direction.vertical);
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

async function generateCrossword() {
    document.getElementById("loading").style.visibility = "visible";
    await new Promise((p) => setTimeout(() => p(), 10));

    const gridList = [];

    for (let i = 0; i < maxGridCount; i++) {
        const grid = generate();

        const density = getGridDensity(grid);
        grid.density = density;

        gridList.push(grid);

        console.log(`Grid_${i} density: ${density}`);

        if (density >= normalGridDensity) {
            //break;
        }
    }

    const gridElement = document.getElementById("grid-wrapper");

    function getGridWithHighestDinsity() {
        if (gridList.length == maxGridCount) {
            let highest = gridList[0];
            for (let i = 1; i < gridList.length; i++) {
                const element = gridList[i];
                if (element.words.length > highest.words.length) {
                    highest = element;
                }
            }
            return highest;
        }

        return gridList[gridList.length - 1];
    }

    let finalGrid = getGridWithHighestDinsity();
    console.log(`Selected grid with density ${finalGrid.density}`);

    document.getElementById("density-title").innerText = `Density: ${Math.floor(finalGrid.density * 100)}% | Words: ${finalGrid.words.length}`;

    for (let x = 0; x < finalGrid.size.x; x++) {
        for (let y = 0; y < finalGrid.size.y; y++) {
            const character = getCellCharacter(finalGrid, x, y);
            cellElement = gridElement.children[x + y * finalGrid.size.x];
            if (character != null) {
                cellElement.innerHTML = `<span>${character}</span>`;
                cellElement.style.backgroundColor = "white";
                if (!cellElement.classList.contains('filled-cell')) {
                    cellElement.classList.add('filled-cell');
                }
            } else {
                cellElement.style.backgroundColor = "#00000000";
                cellElement.innerHTML = ``;
                cellElement.classList.remove('filled-cell');
            }
        }
    }

    await new Promise((p) => setTimeout(() => p(), 10));
    document.getElementById("loading").style.visibility = "hidden";
}

function generate() {
    cachedLibrary = [...filtredLibrary];
    cachedLibrary = filterWordsLengthByCount(cachedLibrary, maxLongWords, Math.min(longWordThreshold, Math.max(gridWidth, gridHeigth)));
    categoriedLibrary = categorizeWords(cachedLibrary);

    const grid = createGrid(gridWidth, gridHeigth);

    for (let it = 0; it < 1; it++) {
        for (let iteration = 0; iteration < generationInterations; iteration++) {
            const density = getGridDensity(grid);
            const result = tryInsertWord(grid, density, wordSelectionIterations);
            if (result != null) {
                if (categoriedLibrary != null) {
                    if (result.word.length <= 4) {
                        for (let i = 0; i < categoriedLibrary.shortWords.length; i++) {
                            if (categoriedLibrary.shortWords[i] == result.word) {
                                categoriedLibrary.shortWords.splice(i, 1);
                            }
                        }
                    } else if (result.word.length <= 7) {
                        for (let i = 0; i < categoriedLibrary.mediumWords.length; i++) {
                            if (categoriedLibrary.mediumWords[i] == result.word) {
                                categoriedLibrary.mediumWords.splice(i, 1);
                            }
                        }
                    } else {
                        for (let i = 0; i < categoriedLibrary.longWords.length; i++) {
                            if (categoriedLibrary.longWords[i] == result.word) {
                                categoriedLibrary.longWords.splice(i, 1);
                            }
                        }
                    }
                } else {
                    for (let i = 0; i < cachedLibrary.length; i++) {
                        if (cachedLibrary[i] == result.word) {
                            cachedLibrary.splice(i, 1);
                        }
                    }
                }
                grid.words.push(result);
            }
        }
    }

    return grid;
}

function start() {
    filtredLibrary = filterWordsMinMax(wordsLibrary, 3, Math.max(gridWidth, gridHeigth));

    for (let i = 0; i < filtredLibrary.length; i++) {
        filtredLibrary[i] = filtredLibrary[i].toLocaleLowerCase();
    }
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

    gridElement.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;

    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeigth; y++) {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');

            gridElement.insertAdjacentElement('beforeend', cellElement);
            cellElement.style.backgroundColor = "#00000000";
        }
    }

    localStorage.setItem('gw', gridWidth);
    localStorage.setItem('gh', gridHeigth);

    start(x, y);
}

createField(localStorage.getItem("gw") ?? 10, localStorage.getItem("gh") ?? 10);