export class Grid {
    constructor(grid) {
        // fix grid
        grid = grid.map(row => row.split(" ").join("").split("|"));

        this.cols = grid[0].length;
        this.rows = grid.length;

        this.restartGrid = [];
        this.restartGrid = grid.map(row => [...row]);

        this.grid = [];
        this.grid = grid.map(row => row);
    }

    outOfGrid(c, r) {
        return ((c < 0) || (r < 0) || (c >= this.cols) || (r >= this.rows))
    }

    cellIsEmpty(c, r, checkGrid=true) {
        if (this.outOfGrid(c,r))
            return false;
        
        const res = ['.'].includes(checkGrid ? this.grid[r][c] : this.restartGrid[r][c]);

        return res;
    }

    cellIsRelation(c, r, checkGrid=true) {
        if (this.outOfGrid(c,r))
            return false;
        
        const res = ['<', '=', '>'].includes(checkGrid ? this.grid[r][c] : this.restartGrid[r][c]);

        return res;
    }

    cellIsValue(c, r, checkGrid=true) {
        if (this.outOfGrid(c,r))
            return false;

        try {
            eval(checkGrid ? this.grid[r][c] : this.restartGrid[r][c]);
        }
        catch(e) {
            return false;
        }
        
        return true;
    }

    clearCell(c, r) {
        this.updateCell(c,r,'.');
    }

    updateCell(c, r, val) {
        this.grid[r][c] = val;
    }

    completed(c, r) {
        if (c >= this.cols) {
            c = 0;
            r++;

            if (r >= this.rows)
                return true;
        }

        let result = true;

        if (this.cellIsValue(c, r, false)) {
            const val1 = this.grid[r][c];
    
            // right
            if (this.cellIsRelation(c+1, r, false)) {
                const rel = this.grid[r][c+1];
                const val2 = this.grid[r][c+2];
                result = result && this.checkRelation(val1, rel, val2);
            }

            // down
            if (this.cellIsRelation(c, r+1, false)) {
                const rel = this.grid[r+1][c];
                const val2 = this.grid[r+2][c];
                result = result && this.checkRelation(val1, rel, val2);
            }
        }

        return result && this.completed(c+1, r);
    }

    checkRelation(v1, rel, v2) {
        if ([v1, rel, v2].includes('.'))
            return false;

        let result = false;
        v1 = eval(v1);
        v2 = eval(v2);

        switch (rel) {
            case '=':
                result =  (v1 == v2);
                break;

            case '>':
                result =  (v1 > v2);
                break;
                
            case '<':
                result =  (v1 < v2);
                break;
        }

        return result;
    }

    restart() {
        this.grid = [];
        this.grid = this.restartGrid.map(row => [...row]);
    }
}
