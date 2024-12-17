let size = { x: 10, y: 10 };
let sameLetterWordCount = 2;
let sameLetterGroupCount = 0;
let isFirstLetterRandom = true;
let startWithGroupedWords = true;
let maxGridCount = 10;
let generationInterations = 500;
let wordSelectionIterations = 5;
let devOptionsEnabled = false;

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
    sameLetterWordCount = localStorage.getItem('slwc') ? Number.parseInt(localStorage.getItem('slwc')) : 2;
    sameLetterGroupCount = localStorage.getItem('slgc') ? Number.parseFloat(localStorage.getItem('slgc')) : 0;
    startWithGroupedWords = localStorage.getItem('swgi') ? localStorage.getItem('swgi') == '1' : startWithGroupedWords;

    const sameLetterButtons = [document.getElementById('same-letter-word-count-settings').children[0], document.getElementById('same-letter-word-count-settings').children[2]];
    const sameLetterCountText = document.getElementById('same-letter-word-count-settings').children[1];
    const sameGroupCountButtons = [document.getElementById('same-letter-group-count-settings').children[0], document.getElementById('same-letter-group-count-settings').children[2]];
    const sameGroupCountText = document.getElementById('same-letter-group-count-settings').children[1];

    function updateView() {
        sameLetterCountText.innerText = sameLetterWordCount;
        sameGroupCountText.innerText = sameLetterGroupCount;
    }

    sameLetterButtons[0].onclick = () => {
        sameLetterWordCount = Math.max(sameLetterWordCount - 1, 2);
        localStorage.setItem('slwc', sameLetterWordCount);
        updateView();
    };

    sameLetterButtons[1].onclick = () => {
        sameLetterWordCount = Math.min(sameLetterWordCount + 1, 5);
        localStorage.setItem('slwc', sameLetterWordCount);
        updateView();
    };

    sameGroupCountButtons[0].onclick = () => {
        sameLetterGroupCount = Math.max(sameLetterGroupCount - 1, 0);
        localStorage.setItem('slgc', sameLetterGroupCount);
        updateView();
    };

    sameGroupCountButtons[1].onclick = () => {
        sameLetterGroupCount = Math.min(sameLetterGroupCount + 1, 10);
        localStorage.setItem('slgc', sameLetterGroupCount);
        updateView();
    };

    const startWithGroupedToggle = document.getElementById('start-with-toggle');
    startWithGroupedToggle.checked = startWithGroupedWords;

    startWithGroupedToggle.onchange = () => {
        startWithGroupedWords = startWithGroupedToggle.checked;
        localStorage.setItem('swgi', startWithGroupedWords ? '1' : '0');
    };

    updateView();
}

function setupFirstLetter() {
    isFirstLetterRandom = localStorage.getItem('flrnd') ? localStorage.getItem('flrnd') == '1' : isFirstLetterRandom;

    const toggle = document.getElementById('first-letter-toggle');
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
        if (number > 1000) {
            number = 1000;
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
        localStorage.setItem('genC', wordSelectionIterations);
    }

    generatedGridCountInput.value = maxGridCount;

    updateInteractible();
}

setupSizeSettings();
setupGrouping();
setupFirstLetter();
setupIterationsSettings();