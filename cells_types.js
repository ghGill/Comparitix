class baseCell {
    constructor(type, cellSize, c, r, draggable=false) {
        this.type = type;
        this.size = cellSize;
        this.c = c;
        this.r = r;
        this.draggable = draggable;
    }

    createCell() {
        this.cellElm = document.createElement('div');
        this.cellElm.classList.add('cell');
        this.cellElm.style.width = `${this.size}px`;
        this.cellElm.style.height = `${this.size}px`;
        if (this.c !== null)
            this.cellElm.dataset.coord = `${this.c}-${this.r}`;

        return this.cellElm;
    }
}

class contentCell extends baseCell {
    constructor(type, cellSize, c, r, draggable=false) {
        super(type, cellSize, c, r, draggable);
    }

    createCell() {
        super.createCell();
        
        this.createContentElement();

        this.getContentParentElement().classList.add(!this.draggable ? 'fixed' : 'draggable');

        return this.cellElm;
    }

    getContentParentElement() {
        return this.cellElm;
    }

    createContentElement() {
        this.contentElm = document.createElement('div');
        this.contentElm.classList.add('content');

        this.getContentParentElement().appendChild(this.contentElm);
    }

    setContent(val) {
        val = val.replaceAll("*", "x");
        this.contentElm.innerHTML = val;
    }
}

export class emptyCell extends baseCell {
    constructor(type, cellSize, c, r, draggable=false) {
        super(type, cellSize, c, r, draggable);
    }
}

export class numberCell extends contentCell {
    constructor(type, cellSize, c, r, draggable=false) {
        super(type, cellSize, c, r, draggable);
    }

    createCell() {
        super.createCell();
        this.cellElm.classList.add('cell-num');
        
        if (this.draggable) {
            this.cellElm.classList.add('draggable');
        }

        return this.cellElm
    }
}

export class relationCell extends contentCell {
    constructor(type, cellSize, c, r, draggable=false) {
        super(type, cellSize, c, r, draggable);
    }

    createCell() {
        this.circleElm = document.createElement('div');
        this.circleElm.classList.add('cell-rel');

        super.createCell();

        this.cellElm.appendChild(this.circleElm);
        if (this.draggable)
            this.circleElm.classList.add('draggable');

        return this.cellElm
    }

    getContentParentElement() {
        return this.circleElm;
    }
}

export class gridCell extends baseCell {
    constructor(type, cellSize, c, r, draggable=false) {
        super(type, cellSize, c, r, draggable);
        this.lines = {};
    }

    createCell() {
        super.createCell();
        this.cellElm.classList.add('cell-grid');

        this.leftLineElm = document.createElement('div');
        this.leftLineElm.classList.add('line', 'left');
        this.cellElm.appendChild(this.leftLineElm);
        this.lines.left = this.leftLineElm;

        this.rightLineElm = document.createElement('div');
        this.rightLineElm.classList.add('line', 'right');
        this.cellElm.appendChild(this.rightLineElm);
        this.lines.right = this.rightLineElm;

        this.upLineElm = document.createElement('div');
        this.upLineElm.classList.add('line', 'up');
        this.cellElm.appendChild(this.upLineElm);
        this.lines.up = this.upLineElm;

        this.downLineElm = document.createElement('div');
        this.downLineElm.classList.add('line', 'down');
        this.cellElm.appendChild(this.downLineElm);
        this.lines.down = this.downLineElm;

        return this.cellElm
    }

    displayLines(visibleSides) {
        ['left', 'right', 'up', 'down'].forEach(side => {
            this.lines[side].classList.remove('show-line');

            if (visibleSides.includes(side)) {
                this.lines[side].classList.add('show-line');
            }
        })
    }
}

