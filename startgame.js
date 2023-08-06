
const teacherId = 1;

class StartGameController {
	constructor(database) {
		this.database = database;
		this.teacherId = teacherId;
		this.qm = new QuestionManager(database, this.teacherId);
		this.categories = [];
		this.categoriesAdded = false
	}

	updateCategories(categories) {
		if (this.categoriesAdded) return;
		categories.forEach(item => {
			var e = item[1];
			document.querySelector("#yellowcat").innerHTML += '<option value="' + e + '">' + e + '</option>'
			document.querySelector("#redcat").innerHTML += '<option value="' + e + '">' + e + '</option>'
			document.querySelector("#bluecat").innerHTML += '<option value="' + e + '">' + e + '</option>'
			document.querySelector("#greencat").innerHTML += '<option value="' + e + '">' + e + '</option>'
		});
		this.categoriesAdded = categories.length > 0;
	}

	validateForm(categories, players) {
		if (new Set(categories).size != 4) {
			document.getElementById("errorDialog").querySelector("p").innerHTML = "Select 4 different categories"
			document.getElementById("errorDialog").showModal();
			return false;
		}
		if (players.length == 0) {
			document.getElementById("errorDialog").querySelector("p").innerHTML = "Specify the name atleast 1 player"
			document.getElementById("errorDialog").showModal();
			return false;
		}
		return true;
	}

	createGame() {
		var categories = [
			document.forms["newgame"].yellowcat.value,
			document.forms["newgame"].redcat.value,
			document.forms["newgame"].bluecat.value,
			document.forms["newgame"].greencat.value];
		var players = [];
		if (document.forms["newgame"].player1.value != '') {
			var p = Player.createPlayer(document.forms["newgame"].player1.value, 1);
			players.push(p);
		}
		if (document.forms["newgame"].player2.value != '') {
			var p = Player.createPlayer(document.forms["newgame"].player2.value, 2);
			players.push(p);
		}
		if (document.forms["newgame"].player3.value != '') {
			var p = Player.createPlayer(document.forms["newgame"].player3.value, 3);
			players.push(p);
		}
		if (document.forms["newgame"].player4.value != '') {
			var p = Player.createPlayer(document.forms["newgame"].player4.value, 4);
			players.push(p);
		}
		if (this.validateForm(categories, players)) {
			var gm = GameManager.createGame(this.database, this.teacherId, categories, players);
			window.location.href = "game.html?gameid=" + gm.gameId
			console.log(gm)
		}

	}

	init() {

		document.getElementById("submit-button").addEventListener("click", this.createGame.bind(this));
		document.getElementById("errorDialog").querySelector(".details-modal-close").addEventListener("click", (event) => {
			document.getElementById("errorDialog").close();
		});

		this.qm.addCategoryListener(this.updateCategories.bind(this));

	}
}

function init() {
	const controller = new StartGameController(database);
	controller.init();
}

window.onload = init;