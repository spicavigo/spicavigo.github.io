
const State = Object.freeze({
    ToRoll: 0,
    ToSelectCell: 1,
    ToShowCategory: 2,
    ToShowQuestion: 3,
    ToShowAnswer: 4,
    Finished: 5
});

const CellType = Object.freeze({
    RED: 0,
    GREEN: 1,
    BLUE: 2,
    YELLOW: 3,
    RED_HQ: 4,
    GREEN_HQ: 5,
    BLUE_HQ: 6,
    YELLOW_HQ: 7,
    WHITE: 8,
    ROLL_AGAIN: 9
});

const Token = Object.freeze({
    YELLOW: 1,
    RED: 2,
    BLUE: 3,
    GREEN: 4,
});

class Cell {
    constructor(cellType, cellId) {
        this.cellType = cellType;
        this.cellId = cellId;
    }

    toJSON() {
        return JSON.stringify({
            cellType: this.cellType,
            cellId: this.cellId
        });
    }

    static fromJSON(json) {
        var obj = JSON.parse(json);
        return new Cell(obj.cellType, obj.cellId);
    }
}

