import { Grid } from "./grid.js";
import { emptyCell, numberCell, relationCell, gridCell } from "./cells_types.js";

export class VisualGrid extends Grid {
    constructor(grid, hiddenItems, gameManager) {
        super(grid);

        this.hiddenItems = hiddenItems.map(row => row.split(" ").join("").split("|"));
        
        this.gameManager = gameManager;
    }

    activeGrid() {
        return document.getElementById('active-grid');
    }

    partsGrid() {
        return document.getElementById('parts-grid');
    }

    draw() {
        this.activeGrid().innerHTML = '';
        this.partsGrid().innerHTML = '';

        // Calculate grid size for this level
        const windowW = document.querySelector('.grid-container').offsetWidth;
        const cellSizeW = Math.floor((windowW * 0.9) / this.cols);

        const windowH = document.querySelector('.grid-container').offsetHeight;
        const cellSizeH = Math.floor((windowH * 0.9) / this.rows);

        this.cellSize = Math.min(cellSizeW, cellSizeH, 70);

        this.activeGrid().style.gridTemplateColumns = `repeat(${this.cols}, ${this.cellSize}px)`;
        this.activeGrid().style.gridTemplateRows = `repeat(${this.rows}, ${this.cellSize}px)`;

        // Set the parts grid dimensions
        const partsWindowW = document.querySelector('.parts-container').offsetWidth;
        this.partsCols = Math.floor((partsWindowW * 0.8) / this.cellSize);

        this.partsGrid().style.gridTemplateColumns = `repeat(${this.partsCols}, ${this.cellSize}px)`;

        this.totalParts = 0;

        // all the empty locations that should be filled with parts
        this.emptyLocations = [];
        this.partsElements = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // check if this value should be filled with part
                const removeValue = this.hiddenItems[r][c] == "?";

                const cellValue = this.grid[r][c];
                let cellElemnts = [];  // all the elements that should be located in the same grid cell

                let type = '';

                switch (cellValue) {
                    case '.':
                        const [, newEmptyCellElm] = this.createNewCell('empty', false, c, r, false);
                        cellElemnts.push(newEmptyCellElm);
                        break;

                    case '<':
                    case '>':
                    case '=':
                        const [newGridCell, newGridCellElm] = this.createNewCell('grid', false, c, r, false);
                        
                        let directions = [];

                        if (this.cellIsValue(c, r - 1, false))
                            directions.push('up');

                        if (this.cellIsValue(c, r + 1, false))
                            directions.push('down');

                        if (this.cellIsValue(c - 1, r, false))
                            directions.push('left');

                        if (this.cellIsValue(c + 1, r, false))
                            directions.push('right');

                        newGridCell.displayLines(directions);
                        cellElemnts.push(newGridCellElm);

                        type = 'rel';
                        const [, newRelCellElm] = this.createNewCell(type, removeValue ? '' : cellValue, c, r, removeValue);
                        cellElemnts.push(newRelCellElm);

                        if (removeValue) {
                            // add the relation to the right side of the screen
                            const [, partRelCellElm] = this.createNewCell(type, cellValue, c, r, true);
                            this.addPart(partRelCellElm, cellValue, type);
                            this.emptyLocations.push({elm:newGridCellElm, c:c, r:r, type:'rel', locatedElm:null});
                            this.clearCell(c, r);
                        }
                        break;

                    default:
                        type = 'number';
                        const [, newNumberCellElm] = this.createNewCell(type, removeValue ? '' : cellValue, c, r, removeValue);
                        cellElemnts.push(newNumberCellElm);

                        if (removeValue) {
                            // add the number to the right side of the screen
                            const [, partNumberCellElm] = this.createNewCell(type, cellValue, null, null, true);
                            this.addPart(partNumberCellElm, cellValue, type);
                            this.emptyLocations.push({elm:newNumberCellElm, c:c, r:r, type:type, locatedElm:null});
                            this.clearCell(c, r);
                        }
                        break;
                }

                // add elemnts in active grid
                cellElemnts.forEach(elm => {
                    elm.style.gridColumn = c + 1;
                    elm.style.gridRow = r + 1;

                    this.activeGrid().appendChild(elm);
                })
            }
        }

        // update parts grid rows
        const partsRows = Math.ceil(this.totalParts / this.partsCols);
        this.partsGrid().style.gridTemplateRows = `repeat(${partsRows}, ${this.cellSize}px)`;

        this.locateParts();

        document.getElementById("level-num").innerHTML = this.gameManager.level + 1;
    }

    createNewCell(type, value = false, c = null, r = null, draggable=false) {
        let newCell = null;

        switch (type) {
            case 'empty':
                newCell = new emptyCell(type, this.cellSize, c, r, draggable);
                break;

            case 'grid':
                newCell = new gridCell(type, this.cellSize, c, r, draggable);
                break;

            case 'rel':
                newCell = new relationCell(type, this.cellSize, c, r, draggable);
                break;

            case 'number':
                newCell = new numberCell(type, this.cellSize, c, r, draggable);
                break;
        }

        const newCellElm = newCell.createCell();

        if (value !== false)
            newCell.setContent(value);

        return [newCell, newCellElm];
    }

    locateParts() {
        this.shuffleParts();

        let n = 0;
        this.partsElements.forEach(elm => {
            const c = (n % this.partsCols) + 1;
            const r = Math.floor((n / this.partsCols)) + 1;
            
            elm.style.gridColumn = c;
            elm.style.gridRow = r;
            elm.dataset.orgGridArea = elm.style.gridArea;

            n++;
        })
    }

    shuffleParts(steps=10) {
        for (let i=0; i<steps; i++) {
            const p1 = Math.floor(Math.random() * this.partsElements.length);
            const p2 = Math.floor(Math.random() * this.partsElements.length);

            const temp = this.partsElements[p1];
            this.partsElements[p1] = this.partsElements[p2];
            this.partsElements[p2] = temp;
        }
    }

    addPart(partElm, cellValue, type) {
        this.partsElements.push(partElm);

        this.totalParts++;

        this.partsGrid().appendChild(partElm);

        partElm.addEventListener("pointerdown", (e) => {
            if (this.isDragging) return;

            // cehck if we drag a located item
            const emptyCell = this.getEmptyCell(e.clientX, e.clientY);
            if (emptyCell !== null) {
                this.clearCell(emptyCell.c, emptyCell.r);
                emptyCell.locatedElm = null;
            }

            const rect = partElm.getBoundingClientRect();
            partElm.style.position = "fixed";
            partElm.style.left = rect.left + "px";
            partElm.style.top = rect.top + "px";
            partElm.style.zIndex = '200';
            this.activeGrid().appendChild(partElm);

            this.isDragging = true;

            partElm.setPointerCapture(e.pointerId);

            this.offsetX = e.clientX - partElm.offsetLeft;
            this.offsetY = e.clientY - partElm.offsetTop;
        });

        partElm.addEventListener("pointermove", (e) => {
            if (!this.isDragging) return;

            partElm.style.left = `${e.clientX - this.offsetX}px`;
            partElm.style.top = `${e.clientY - this.offsetY}px`;
        });

        partElm.addEventListener("pointerup", (e) => {
            if (!this.isDragging) return;

            this.isDragging = false;
            partElm.releasePointerCapture(e.pointerId);

            let ok = false;

            const emptyCell = this.getEmptyCell(e.clientX, e.clientY);
            if (emptyCell !== null) {
                if (emptyCell.type == type) {
                    if (emptyCell.locatedElm != null) {
                        this.returnToPartsArea(emptyCell.locatedElm);
                    }

                    partElm.style.position = 'relative';
                    partElm.style.gridArea = emptyCell.elm.style.gridArea;
                    partElm.style.left = '';
                    partElm.style.top = '';
                    ok = true;
                    // update grid with the located value
                    this.updateCell(emptyCell.c, emptyCell.r, cellValue);
                    emptyCell.locatedElm = partElm;
                }
            }

            if (!ok)
                this.returnToPartsArea(partElm);
            else
                this.gameManager.checkLevelComplete();
        });
    }

    getEmptyCell(x, y) {
        for (let i=0; i<this.emptyLocations.length; i++) {
            const elm = this.emptyLocations[i].elm;
            if (this.pointInRect(x, y, elm.getBoundingClientRect())) {
                return this.emptyLocations[i];
            }
        };

        return null;
    }

    pointInRect(px, py, rect) {
        return (
            px >= rect.left &&
            px <= rect.left + rect.width &&
            py >= rect.top &&
            py <= rect.top + rect.height
        );
    }

    returnToPartsArea(partElm) {
        this.partsGrid().appendChild(partElm);
        partElm.style.position = "";
        partElm.style.left = "";
        partElm.style.top = "";
        partElm.style.gridArea = partElm.dataset.orgGridArea;
        partElm.style.zIndex = 'unset';
    }

    getplayedLevel() {
        return this.gameManager.level;
    }

    restart() {
        super.restart();
        this.draw();
    }
}
