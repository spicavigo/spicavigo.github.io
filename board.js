class Board {
    static CENTER_CELL_ID = 24;
    static AdjList = {
        0: [1, 9],
        1: [0, 2],
        2: [1, 3],
        3: [2, 4],
        4: [3, 5, 11],
        5: [4, 6],
        6: [5, 7],
        7: [6, 8],
        8: [7, 13],
        9: [0, 14],
        11: [4, 15],
        13: [8, 16],
        14: [9, 17],
        15: [11, 18],
        16: [13, 19],
        17: [14, 20],
        18: [15, 24],
        19: [16, 28],
        20: [17, 21, 29],
        21: [20, 22],
        22: [21, 23],
        23: [22, 24],
        24: [18, 23, 25, 31],
        25: [24, 26],
        26: [25, 27],
        27: [26, 28],
        28: [19, 27, 33],
        29: [20, 34],
        31: [24, 35],
        33: [28, 36],
        34: [29, 37],
        35: [31, 38],
        36: [33, 39],
        37: [34, 40],
        38: [35, 44],
        39: [36, 48],
        40: [37, 41],
        41: [40, 42],
        42: [41, 43],
        43: [42, 44],
        44: [38, 43, 45],
        45: [44, 46],
        46: [45, 47],
        47: [46, 48],
        48: [39, 47]
    }
    static ROLL_AGAIN_CELLS = [0, 8, 40, 48];
    static HQ_CELLS = [4, 20, 28, 44];
    static PLAYER_HOMES = {
        1: 10,
        2: 12,
        3: 30,
        4: 32
    };
    static CELL_TYPES = {
        0: CellType.ROLL_AGAIN,
        1: CellType.YELLOW,
        2: CellType.BLUE,
        3: CellType.GREEN,
        4: CellType.RED_HQ,
        5: CellType.YELLOW,
        6: CellType.BLUE,
        7: CellType.GREEN,
        8: CellType.ROLL_AGAIN,
        9: CellType.RED,
        11: CellType.YELLOW,
        13: CellType.RED,
        14: CellType.GREEN,
        15: CellType.BLUE,
        16: CellType.YELLOW,
        17: CellType.BLUE,
        18: CellType.GREEN,
        19: CellType.BLUE,
        20: CellType.YELLOW_HQ,
        21: CellType.BLUE,
        22: CellType.GREEN,
        23: CellType.RED,
        24: CellType.WHITE,
        25: CellType.BLUE,
        26: CellType.YELLOW,
        27: CellType.RED,
        28: CellType.GREEN_HQ,
        29: CellType.RED,
        31: CellType.YELLOW,
        33: CellType.RED,
        34: CellType.GREEN,
        35: CellType.RED,
        36: CellType.YELLOW,
        37: CellType.BLUE,
        38: CellType.GREEN,
        39: CellType.BLUE,
        40: CellType.ROLL_AGAIN,
        41: CellType.YELLOW,
        42: CellType.RED,
        43: CellType.GREEN,
        44: CellType.BLUE_HQ,
        45: CellType.YELLOW,
        46: CellType.RED,
        47: CellType.GREEN,
        48: CellType.ROLL_AGAIN
    };

    static getCellType(cellId) {
        return Board.CELL_TYPES[cellId];
    }

    static getDestinations(curr, moves, prev = -1) {
        if (moves == 0) {
            return new Set([curr]);
        }
        var ret = new Set([]);
        for (var i = 0; i < Board.AdjList[curr].length; i++) {
            if (Board.AdjList[curr][i] == prev) {
                continue;
            }
            var dests = Board.getDestinations(Board.AdjList[curr][i], moves - 1, curr);
            dests.forEach(val => { ret.add(val); })

        }
        return ret;

    }


}
