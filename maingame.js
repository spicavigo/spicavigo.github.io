class MainGameController {
    constructor(database, gameId) {
        this.database = database;
        this.user = new User(database);
        this.gameId = gameId;
        this.user.init(this.init.bind(this));
    }

    roll(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Actions/Callbacks

    selectRoll() {
        // Generate random value between 1 and 6
        // Update the roll value and new state (ToSelectCell) in game manager
        this.gm.updateGameState({
            "rollValue": this.roll(1, 6),
            "state": State.ToSelectCell
        });
    }

    selectCell(cellId) {
        // Move player to the new cell
        this.gm.movePlayer(this.gm.getCurrentPlayer().order, cellId);
        // Update current player location to cellId
        // If this cell is roll again, update state to ToRoll
        // If this cell is while, update state to ToShowCategory
        // else update state to ToShowQuestion
        // For the last two, we need to get the question too
        var cellType = Board.getCellType(cellId);
        var state = State.ToShowQuestion;
        var update = {};
        switch (cellType) {
            case CellType.ROLL_AGAIN:
                state = State.ToRoll;
                break;
            case CellType.WHITE:
                state = State.ToShowCategory;
                break;
            case CellType.YELLOW:
            case CellType.YELLOW_HQ:
                update["category"] = this.gm.getCategories()[0];
                break;
            case CellType.RED:
            case CellType.RED_HQ:
                update["category"] = this.gm.getCategories()[1];
                break;
            case CellType.BLUE:
            case CellType.BLUE_HQ:
                update["category"] = this.gm.getCategories()[2];
                break;
            case CellType.GREEN:
            case CellType.GREEN_HQ:
                update["category"] = this.gm.getCategories()[3];
                break;
        }
        if ("category" in update) {
            update["question"] = this.gm.getNewQuestion(update["category"]).key;
        }
        update['state'] = state;
        this.gm.updateGameState(update);
    }

    selectCategory(category) {
        // Update the category, question, and state (ToShowQuestion)
        this.gm.updateGameState({
            "category": category,
            "question": this.gm.getNewQuestion(category).key,
            "state": State.ToShowQuestion
        });
    }

    addAnswer(answer, isCorrect) {
        this.gm.updateGameState({
            "answer": answer,
            "isCorrect": isCorrect,
            "state": State.ToShowAnswer
        });
    }

    selectAnswer(isCorrect) {
        // new state will be toroll
        // if answer is correct and the current cell is HQ, then player's wedge will be updated
        // if the answer is incorrect, currentPlayer will get updated
        var cellId = this.gm.getCurrentPlayer().cellId;
        var cellType = Board.getCellType(cellId);
        var update = { "state": State.ToRoll };
        if (isCorrect) {
            switch (cellType) {
                case CellType.YELLOW_HQ:
                    this.gm.updatePlayerWedge(Token.YELLOW);
                    break;
                case CellType.RED_HQ:
                    this.gm.updatePlayerWedge(Token.RED);
                    break;
                case CellType.BLUE_HQ:
                    this.gm.updatePlayerWedge(Token.BLUE);
                    break;
                case CellType.GREEN_HQ:
                    this.gm.updatePlayerWedge(Token.GREEN);
                    break;
            }
        } else {
            update["currentPlayer"] = this.gm.getNextPlayer(); //this.gm.getCurrentPlayer().order % this.gm.getTotalPlayers() + 1;
        }
        if (this.gm.hasPlayerWon(this.gm.getCurrentPlayer())) {
            update["state"] = State.Finished;
            update["winner"] = this.gm.getCurrentPlayer().username;
        }
        this.gm.updateGameState(update);
    }

    // Player State Listener

    updatePlayers(players) {
        this.showPlayerInfo(players)
        // This will be used to show
        // 1. Player position
        // 2. Player wedges
        // 3. (Optional) Online state of player
        players.forEach(player => {
            this.movePlayer(player.order, player.cellId);
            this.showPlayerWedges(player.displayName, player.order, player.wedges);
        }, this);

    }

    updateGameState(state) {
        this.showCategoryInfo(this.gm.getCategories());
        var currentPlayer = this.gm.getCurrentPlayer();
        this.showCurrentPlayer(currentPlayer.displayName);
        this.showHideButtons();
        // If I am current player, then
        // 	1. If the state is toroll, enable roll button
        // 	2. If the state is ToSelectCell,
        //		2.1 Disable roll
        //		2.2 Show previous roll value
        //		2.3 Pulsate the cells
        //	3. If the state is ShowCategories, open the dialog with categories
        //	4. If the state is ShowQuestion, open the dialog with the question in state
        // If I am not the current player, then all buttons are disabled for me, but the flow is almost the same as above.

        // Right now, we are not doing networked game, so the primary if condition doesnt apply
        switch (state) {
            case State.ToRoll:
                this.toRollState(state);
                break;
            case State.ToSelectCell:
                this.toSelectCell(state);
                break;
            case State.ToShowCategory:
                this.toShowCategories(state);
                break;
            case State.ToShowQuestion:
                this.toShowQuestion(state);
                break;
            case State.ToShowAnswer:
                this.toShowAnswer(state);
                break;
            case State.Finished:
                this.finishGame();
        }
    }

    toRollState(state) {
        this.hideDialog();
        this.hideRollValue();
        this.stopPulsatingCells();
        this.enableRoll();
        this.addRollEvent(this.selectRoll.bind(this));
    }

    toSelectCell(state) {
        this.hideDialog();
        this.disableRoll();
        this.showRollValue(this.gm.getRollValue());
        var currentPlayer = this.gm.getCurrentPlayer();
        var destCellIds = Board.getDestinations(currentPlayer.cellId, this.gm.getRollValue());
        this.pulsateCells(destCellIds);
        this.addSelectCellEvent(destCellIds, this.selectCell.bind(this));
    }

    toShowCategories(state) {
        this.disableRoll();
        this.stopPulsatingCells();
        this.showCategoryDialog(this.gm.getCategories());
        this.addSelectCategoryEvent(this.selectCategory.bind(this));
    }

    toShowQuestion(state) {
        this.disableRoll();
        this.stopPulsatingCells();
        this.showQADialog(this.gm.getCurrentQuestion());
        this.addSelectAnswerEvent(this.addAnswer.bind(this), this.gm.getCurrentQuestion());
    }

    toShowAnswer(state) {
        this.disableRoll();
        this.stopPulsatingCells();
        this.showQADialog(this.gm.getCurrentQuestion());
        this.addSubmitAnswerEvent(this.selectAnswer.bind(this), this.gm.getCurrentQuestion(), this.gm.getIsCorrect(), this.gm.getAnswer())
    }

    finishGame() {
        this.showStatus(this.gm.getCurrentPlayer().displayName + ' has Won!!!');
        this.hideDialog();
        this.hideRollValue();
        this.stopPulsatingCells();
        this.disableRoll();
    }
    // View functions

    removeElements(selector) {
        document.querySelectorAll(selector).forEach(element => {
            element.remove();
        });
    }

    getCell(cellId) {
        return document.querySelector('[data-cell-id="' + cellId + '"]')
    }

    movePlayer(playerOrder, cellId) {
        this.removeElements('[data-player-id="' + playerOrder + '"]')
        var circle = "<div class='circle' data-player-id='" + playerOrder + "'></div>";
        var elem = this.getCell(cellId);
        elem.innerHTML += circle;
    }

    showPlayerWedges(playerName, playerOrder, wedges) {
        if (wedges == undefined) wedges = [];
        var cellId = Board.PLAYER_HOMES[playerOrder];
        var elem = this.getCell(cellId);
        elem.querySelector('.home_title').innerHTML = playerName;
        const square = elem.querySelectorAll('.inner div');
        for (const w of wedges) {
            square[w - 1].dataset.wedgeId = w;
        }
    }

    showCurrentPlayer(playerName) {
        document.getElementById("currentPlayer").innerHTML = playerName;
    }

    isMyTurn() {
        return this.user.username == this.gm.getCurrentPlayer().username;
    }

    showHideButtons() {
        if (this.isMyTurn()) {
            document.getElementById("answer-button").parentElement.parentElement.style.visibility = "visible";
            document.getElementById("category-button").parentElement.parentElement.style.visibility = "visible";
        } else {
            document.getElementById("answer-button").parentElement.parentElement.style.visibility = "hidden";
            document.getElementById("category-button").parentElement.parentElement.style.visibility = "hidden";
        }
    }

    enableRoll() {
        // Only enable if the current player is me
        if (this.isMyTurn()) {
            document.getElementById("roll-button").style.visibility = "visible";
        } else {
            this.disableRoll();
        }

    }

    disableRoll() {
        document.getElementById("roll-button").style.visibility = "hidden";
    }

    showRollValue(value) {
        document.getElementById("roll-value").innerHTML = value;
    }

    hideRollValue() {
        document.getElementById("roll-value").innerHTML = "Waiting...";
    }

    pulsateCells(cellIds) {
        this.stopPulsatingCells();
        cellIds.forEach(cellId => {
            var elem = this.getCell(cellId);
            elem.classList.add("pulsate-cell");
        }, this)
    }

    stopPulsatingCells() {
        var elements = document.querySelectorAll(".pulsate-cell");
        elements.forEach(element => {
            element.onclick = function () { }
            element.classList.remove("pulsate-cell");
        });
    }

    showDialog() {
        if (!window.dialog.open) {
            window.dialog.showModal();
        }
    }

    hideDialog() {
        if (window.dialog.open) {
            window.dialog.close();
        }
    }

    showCategoryDialog(categories) {
        document.querySelector("dialog .tab1").style.display = "none";
        document.querySelector("dialog .tab2").style.display = "block";
        var html = ""
        categories.forEach(category => {
            html += '<option value="' + category + '">' + category + '</option>'

        });
        document.querySelector("dialog #category-select").innerHTML = html;

        this.showDialog();
    }

    showQADialog(question) {
        if (document.querySelector("dialog .tab1").id == question.key) {
            return;
        }
        document.querySelector("dialog .tab2").style.display = "none";
        document.querySelector("dialog .tab1").style.display = "block";
        document.querySelector("dialog .tab1").id = question.key;
        document.querySelector("#answer-button").textContent = "Reveal Answer";

        this.qContainer.setContents(question.question);

        var cat = document.querySelector("dialog .category");
        cat.textContent = question.category;

        var answerElem = document.querySelector('dialog .answer');
        answerElem.querySelectorAll('div').forEach(e => e.remove());

        var count = 0
        question.options.forEach(option => {
            var container = document.createElement('div');
            container.className = 'nice-form-group';
            var radioInput = document.createElement('input');
            radioInput.setAttribute('type', 'radio');
            radioInput.setAttribute('name', 'answer');
            radioInput.setAttribute('value', option);
            radioInput.setAttribute('id', 'answer-' + count);
            var radioLabel = document.createElement('label');
            radioLabel.textContent = option;
            radioLabel.setAttribute('for', 'answer-' + count);

            container.appendChild(radioInput);
            container.appendChild(radioLabel);
            answerElem.appendChild(container);
            count += 1;
        });

        this.showDialog();
    }

    showCategoryInfo(categories) {
        var info = document.querySelector(".info .game-cat");
        info.innerHTML = '<span>Categories</span>'
        info.innerHTML += '<div class="yellow">' + categories[0] + '</div>'
        info.innerHTML += '<div class="red">' + categories[1] + '</div>'
        info.innerHTML += '<div class="blue">' + categories[2] + '</div>'
        info.innerHTML += '<div class="green">' + categories[3] + '</div>'
    }

    showPlayerInfo(players) {
        if (players.length == 0) return
        var info = document.querySelector(".info .game-players");
        info.innerHTML = '<span>Players</span>'
        for (const player of players) {
            var color;
            switch (player.order) {
                case 1:
                    color = "yellow";
                    break;
                case 2:
                    color = "red";
                    break;
                case 3:
                    color = "blue";
                    break;
                case 4:
                    color = "green";
                    break;
            }
            var suffix = " (Online)"
            //if (!player.isOnline) {
            //    color += " offline";
            //    suffix = " (Offline)"
            //}
            info.innerHTML += '<div class="' + color + '">' + player.displayName + suffix + '</div>';
        }
    }

    showStatus(text) {
        var e = document.getElementsByClassName('status-text-big')[0];
        e.innerHTML = text
        e.style.display = "block";
        e.style.opacity = 1;
    }

    // Event handlers
    addRollEvent(callback) {
        document.getElementById("roll-button").onclick = callback;
    }

    addSelectCellEvent(cellIds, callback) {
        if (!this.isMyTurn()) {
            return;
        }
        cellIds.forEach(cellId => {
            var elem = this.getCell(cellId);
            elem.onclick = function () { callback(cellId) };
        }, this);
    }

    addSelectCategoryEvent(callback) {
        document.querySelector("#category-button").onclick = function () {
            var category = document.querySelector("dialog #category-select").value;
            callback(category);
        }
    }

    addSelectAnswerEvent(callback, question) {
        var self = this;
        document.querySelector("#answer-button").onclick = function () {
            document.querySelector("#answer-button").textContent = "Submit Answer";
            var elem = document.querySelector('input[name="answer"]:checked');
            if (elem == null) {
                return;
            }
            var answer = elem.value;
            var isCorrect = answer == question.answer;

            // Add check and cross to answers
            document.querySelectorAll('input[name="answer"]').forEach(node => {
                if (node.value == question.answer) {
                    if (!node.parentElement.classList.contains('gg-check')) {
                        node.parentElement.classList.add('gg-check');
                    }
                } else if (node.checked) {
                    if (!node.parentElement.classList.contains('gg-close')) {
                        node.parentElement.classList.add('gg-close');
                    }
                }

            });
            callback(answer, isCorrect);

        }
    }

    addSubmitAnswerEvent(callback, question, isCorrect, answer) {
        var self = this;
        document.querySelector("#answer-button").textContent = "Submit Answer";
        // Add check and cross to answers
        document.querySelectorAll('input[name="answer"]').forEach(node => {
            if (node.value == answer) {
                node.checked = true;
            }
            if (node.value == question.answer) {
                if (!node.parentElement.classList.contains('gg-check')) {
                    node.parentElement.classList.add('gg-check');
                }
            } else if (node.value == answer) {
                if (!node.parentElement.classList.contains('gg-close')) {
                    node.parentElement.classList.add('gg-close');
                }
            }

        });
        document.querySelector("#answer-button").onclick = function () {
            self.hideDialog();
            callback(isCorrect);
        }
    }

    init() {
        this.teacherId = Object.keys(this.user.class)[0];
        this.gm = new GameManager(database, this.teacherId, this.gameId, this.user);
        this.qm = new QuestionManager(database, this.teacherId);

        // View param
        this.qContainer = new Quill("#question-container", {
            modules: {
                toolbar: null
            },
            readOnly: true,
            theme: 'snow'  // or 'bubble'
        });

        this.gm.setPlayerListener(this.updatePlayers.bind(this));
        this.gm.setGameStateListener(this.updateGameState.bind(this));
    }
}


function init() {
    var u = new URLSearchParams(window.location.search);
    const controller = new MainGameController(database, u.get("gameid"));
}

window.onload = init;
