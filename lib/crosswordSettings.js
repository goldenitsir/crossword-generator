let size = { x: 10, y: 10 };
let sameLetterWordCount = 2;
let sameLetterGroupCount = 0;
let isFirstLetterRandom = true;
let startWithGroupedWords = true;
let revealedLetterCount = 1;
let revealedWordCount = 0;
let maxGridCount = 10;
let gridGenerationIteration = 5;
let generationInterations = 500;
let wordSelectionIterations = 2;
let devOptionsEnabled = false;

function onNumberSelector({ elementId, saveId, initialValue, min, max, callback }) {
    let value = loadNumber(saveId, initialValue);

    const buttons = [document.getElementById(elementId).children[0], document.getElementById(elementId).children[2]];
    const text = document.getElementById(elementId).children[1];

    function updateValue() {
        text.innerText = value;
        callback?.(value);
    }

    buttons[0].onclick = () => {
        value = Math.max(value - 1, min);
        localStorage.setItem(saveId, value);

        updateValue();
    };

    buttons[1].onclick = () => {
        value = Math.min(value + 1, max);
        localStorage.setItem(saveId, value);

        updateValue();
    };

    updateValue();
}

function loadNumber(key, defaultValue) {
    const value = localStorage.getItem(key);
    if (value != null) {
        return Number.parseInt(value);
    }
    return defaultValue;
}

function loadBoolean(key, defaultValue) {
    const value = localStorage.getItem(key);
    if (value != null) {
        return value == '1';
    }
    return defaultValue;
}

function saveBoolean(key, value) {
    localStorage.setItem(key, value ? '1' : '0');
}

function setupSizeSettings() {
    const loadedWidth = localStorage.getItem('gw');
    const loadedHeight = localStorage.getItem('gh');

    const widthSlider = document.getElementById('width-range');
    widthSlider.value = loadedWidth;

    const widthValue = document.getElementById('width-range-value');
    widthValue.innerText = "W:" + loadedWidth;

    const heightSlider = document.getElementById('height-range');
    heightSlider.value = loadedHeight;

    const heightValue = document.getElementById('height-range-value');
    heightValue.innerText = "H:" + loadedHeight;


    widthSlider.onchange = () => {
        widthValue.innerText = "W:" + widthSlider.value;
        createField(widthSlider.value, heightSlider.value);
    }
    widthSlider.onmousemove = () => {
        widthValue.innerText = "W:" + widthSlider.value;
    }
    widthSlider.onmousedown = () => {
        widthValue.innerText = "W:" + widthSlider.value;
    }

    heightSlider.onchange = () => {
        heightValue.innerText = "H:" + heightSlider.value;
        createField(widthSlider.value, heightSlider.value);
    }
    heightSlider.onmousemove = () => {
        heightValue.innerText = "H:" + heightSlider.value;
    }
    heightSlider.onmousedown = () => {
        heightValue.innerText = "H:" + heightSlider.value;
    }

    createField(loadedWidth, loadedHeight);
}

function setupGrouping() {
    startWithGroupedWords = localStorage.getItem('swgi') ? localStorage.getItem('swgi') == '1' : startWithGroupedWords;

    onNumberSelector({
        elementId: 'same-letter-word-count-settings',
        saveId: 'slwc',
        initialValue: sameLetterWordCount,
        min: 2,
        max: 5,
        callback: (value) => {
            sameLetterWordCount = value;
        }
    });

    onNumberSelector({
        elementId: 'same-letter-group-count-settings',
        saveId: 'slgc',
        initialValue: sameLetterGroupCount,
        min: 0,
        max: 10,
        callback: (value) => {
            sameLetterGroupCount = value;
        }
    });

    const startWithGroupedToggle = document.getElementById('start-with-toggle');
    startWithGroupedToggle.checked = startWithGroupedWords;

    startWithGroupedToggle.onchange = () => {
        startWithGroupedWords = startWithGroupedToggle.checked;
        localStorage.setItem('swgi', startWithGroupedWords ? '1' : '0');
    };
}

function setupFirstLetter() {
    isFirstLetterRandom = localStorage.getItem('flrnd') ? localStorage.getItem('flrnd') == '1' : isFirstLetterRandom;

    const toggle = document.getElementById('first-letter-toggle');

    onNumberSelector({
        elementId: 'revealed-letter-count-settings',
        saveId: 'rlc',
        initialValue: revealedLetterCount,
        min: 0,
        max: 10,
        callback: (value) => {
            revealedLetterCount = value;
        }
    });

    onNumberSelector({
        elementId: 'revealed-word-count-settings',
        saveId: 'rwc',
        initialValue: revealedWordCount,
        min: 0,
        max: 10,
        callback: (value) => {
            revealedWordCount = value;
        }
    });

    toggle.onchange = () => {
        isFirstLetterRandom = toggle.checked;
        localStorage.setItem('flrnd', toggle.checked ? '1' : '0')
    }

    toggle.checked = isFirstLetterRandom;
}

function setupIterationsSettings() {
    generationInterations = loadNumber('insrIter', generationInterations);
    wordSelectionIterations = loadNumber('wordIter', wordSelectionIterations);
    maxGridCount = loadNumber('genC', maxGridCount);
    devOptionsEnabled = loadBoolean('devEnabled', devOptionsEnabled);

    const devOptionsContainer = document.getElementById('dev-option-container');
    const devOptionsToggle = document.getElementById('dev-options-toggle');
    const insertInterationsInput = document.getElementById('insert-iterations');
    const wordInterationsInput = document.getElementById('word-interations');
    const generatedGridCountInput = document.getElementById('grid-count');

    function updateInteractible() {
        if (devOptionsEnabled) {
            devOptionsContainer.classList.remove('disabled-inactive');
        } else if (!devOptionsContainer.classList.contains('disabled-inactive')) {
            devOptionsContainer.classList.add('disabled-inactive');
        }
    }

    devOptionsToggle.checked = devOptionsEnabled;

    devOptionsToggle.onchange = () => {
        devOptionsEnabled = devOptionsToggle.checked;
        updateInteractible();
        saveBoolean('devEnabled', devOptionsEnabled);
    }

    insertInterationsInput.onchange = () => {
        const value = insertInterationsInput.value;
        let number = Number.parseInt(value);
        if (number > 2000) {
            number = 2000;
            insertInterationsInput.value = number;
        } else if (number < 1) {
            number = 1;
            insertInterationsInput.value = number;
        }
        generationInterations = number;
        localStorage.setItem('insrIter', generationInterations);
    }

    insertInterationsInput.value = generationInterations;

    wordInterationsInput.onchange = () => {
        const value = wordInterationsInput.value;
        let number = Number.parseInt(value);
        if (number > 200) {
            number = 200;
            wordInterationsInput.value = number;
        } else if (number < 1) {
            number = 1;
            wordInterationsInput.value = number;
        }
        wordSelectionIterations = number;
        localStorage.setItem('wordIter', wordSelectionIterations);
    }

    wordInterationsInput.value = wordSelectionIterations;

    generatedGridCountInput.onchange = () => {
        const value = generatedGridCountInput.value;
        let number = Number.parseInt(value);
        if (number > 20) {
            number = 20;
            generatedGridCountInput.value = number;
        } else if (number < 1) {
            number = 1;
            generatedGridCountInput.value = number;
        }
        maxGridCount = number;
        localStorage.setItem('genC', maxGridCount);
    }

    generatedGridCountInput.value = maxGridCount;

    updateInteractible();
}

function setupWordList() {
    let opened = false;
    const button = document.getElementById('word-list-open-button');
    const list = document.getElementById('word-list');

    function updateView() {
        if (opened) {
            list.style.visibility = 'visible';
        } else {
            list.style.visibility = 'hidden';
        }
    }
    button.onclick = () => {
        opened = !opened;
        updateView();
    }

    updateView();
}

setupWordList();
setupSizeSettings();
setupGrouping();
setupFirstLetter();
setupIterationsSettings();