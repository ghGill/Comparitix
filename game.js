import { VisualGrid } from "./visual_grid.js";
import { gameLevels } from "./levels_data.js";

let activeGrid = null;

const LEVELS_ROWS = 4;
const LEVELS_COLS = 8;

let scrOrientation = null;
let bgMusic = null;
let clickEffect=null;
let completeEffect=null;
let volumeStatus = null;

let lastCompleteLevel = 0;

let screens = ["open", "levels", "board", "help", "complete", "disable"];

function getOrientation() {
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

window.addEventListener("resize", () => {
    scrOrientation = getOrientation();
    updateByOrientation();
});

function updateByOrientation() {
    if (scrOrientation == "portrait") {
        document.getElementById("rotate-msg").style.display = "block";
        document.getElementById("game").style.display = "none";
    }
    else {
        document.getElementById("rotate-msg").style.display = "none";
        document.getElementById("game").style.display = "block";
    }
}

function hideLoading() {
    document.getElementById("loading").style.visibility = "hidden";
}

export function init() {
    scrOrientation = getOrientation();
    updateByOrientation();

    bgMusic = new Audio("./assets/bg_music.mp3");
    bgMusic.loop = true;
    clickEffect = new Audio("./assets/click.mp3");
    completeEffect = new Audio("./assets/complete.mp3");

    volumeStatus = loadSoundStatus();
    
    updateSoundIcon();

    displayScreen("open");
    CreateLevelsItems();

    setTimeout(() => {
        hideLoading();
    }, 1000);
}

function displayScreen(id, over=false) {
    screens.forEach(scrId => {
        const scrVisibility = document.getElementById(scrId).style.visibility;
        document.getElementById(scrId).style.visibility = (scrId == id ? "visible" : over ? scrVisibility : "hidden");
    });
}

function hideScreen(id) {
    document.getElementById(id).style.visibility = "hidden";
}

function playClick() {
    playSound(clickEffect);
}

function playSound(snd) {
    if (volumeStatus === 0)
        return;

    snd.play();
}

function stopSound(snd) {
    snd.pause();
}

function loadLastCompleteLevel() {
    lastCompleteLevel = localStorage.getItem("lcl");
    if (lastCompleteLevel == null)
        lastCompleteLevel = 1;

    return lastCompleteLevel;
}

function saveLastCompleteLevel(lvl) {
    lastCompleteLevel = Math.max(lastCompleteLevel, lvl);
    
    localStorage.setItem("lcl", lastCompleteLevel)
}

function loadSoundStatus() {
    let soundStatus = localStorage.getItem("snd");
    if (soundStatus == null)
        soundStatus = 1;

    return parseInt(soundStatus);
}

function saveSoundStatus(status) {
    localStorage.setItem("snd", status)
}

export function start() {
    playSound(clickEffect);
    playSound(bgMusic);
    displayScreen("levels");
    displayScreen("help", true);
}

function CreateLevelsItems() {
    const lastCompleteLevel = parseInt(loadLastCompleteLevel());

    const itemsElemnt = document.getElementById("items");

    for (let r=0; r<LEVELS_ROWS; r++) {
        let levelsRow = document.createElement("div");
        levelsRow.classList.add("items-row");

        for (let c=1; c<=LEVELS_COLS; c++) {
            const index = (r * LEVELS_COLS) + c;
            const disabled = (index > lastCompleteLevel);
            let item = newLevelItem(index, disabled);
            levelsRow.appendChild(item);
        }

        itemsElemnt.appendChild(levelsRow);
    }
}

function newLevelItem(n, disabled) {
    let e = document.createElement("div");

    let num = document.createElement("div");
    num.id = `num-${n}`;
    num.innerHTML = n;
    num.classList.add("level-num");

    e.classList.add("level-item");
    e.id = `item-${n}`;
    e.dataset.value = n;
    e.appendChild(num);

    if (disabled) {
        num.onclick = null;
        e.classList.add('disabled');
    }
    else {
        num.onclick = (e) => { levelSelected(n); };
    }

    return e;
}

function enableLevelItem(n) {
    const itemElemnt = document.getElementById(`item-${n}`);
    itemElemnt.classList.remove('disabled');

    const numElemnt = document.getElementById(`num-${n}`);
    numElemnt.onclick = (e) => { levelSelected(n); };
}

function levelSelected(lvl) {
    playSound(clickEffect);

    let createLevelScreen = true;

    if (activeGrid !== null)
        createLevelScreen = (activeGrid.getplayedLevel() !== lvl-1);

    if (createLevelScreen) {
        const levelData = gameLevels[lvl-1]

        const gameParams = {
            disableScreen,
            checkLevelComplete,
            playClick,
            level:lvl-1
        };

        activeGrid = new VisualGrid(levelData.grid, levelData.hiddens, gameParams);

        activeGrid.draw();
    }

    displayScreen("board");
}

function checkLevelComplete() {
    const result = activeGrid.completed(0,0);

    if (result) {
        setTimeout(() => {
            playSound(completeEffect);
            displayScreen("complete", true);
            enableScreen();
        }, 500);
    }
    else {
        enableScreen();
    }
}

export function changeSoundStatus() {
    playSound(clickEffect);

    volumeStatus = (volumeStatus === 0) ? 1 : 0;

    updateSoundIcon();

    if (volumeStatus === 1)
        playSound(bgMusic);
    else
        stopSound(bgMusic);

    saveSoundStatus(volumeStatus);
}

function updateSoundIcon() {
    const elm = document.getElementById("sound");

    if (volumeStatus === 1) {
        elm.innerHTML = '<i class="fas fa-volume-high"></i>';
    }
    else {
        elm.innerHTML = '<i class="fas fa-volume-xmark"></i>';
    }
}

export function backToLevelsMenu() {
    playSound(clickEffect);
    displayScreen("levels");
}

export function showHelp() {
    playSound(clickEffect);
    displayScreen("help", true);
}

export function closeHelp() {
    playSound(clickEffect);
    hideScreen("help");
}

export function restartLevel() {
    playSound(clickEffect);
    activeGrid.restart();
    displayScreen("board");
}

export function playNextLevel() {
    playSound(clickEffect);
    let lvl = activeGrid.getplayedLevel();
    lvl = (lvl == gameLevels.length - 1) ? lvl : lvl + 1;
    saveLastCompleteLevel(lvl + 1);
    enableLevelItem(lvl + 1);
    levelSelected(lvl + 1);
}

function disableScreen() {
    displayScreen("disable", true);
}

function enableScreen() {
    hideScreen("disable");
}

window.init = init;
window.start = start;
window.changeSoundStatus = changeSoundStatus;
window.backToLevelsMenu = backToLevelsMenu;
window.showHelp = showHelp;
window.closeHelp = closeHelp;
window.restartLevel = restartLevel;
window.playNextLevel = playNextLevel;
