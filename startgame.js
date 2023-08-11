class StartGameController {
	constructor(database) {
		this.database = database;
		this.user = new User(database);
		this.user.init(this.init.bind(this));
	}

	showError(message, closeable = true) {
		document.getElementById("errorDialog").querySelector("p").innerHTML = message;
		if (closeable) {
			document.querySelector(".details-modal-close").style.display = "flex";
		} else {
			document.querySelector(".details-modal-close").style.display = "none";
			document.getElementById("errorDialog").addEventListener('cancel', (event) => {
				event.preventDefault();
			});
		}
		document.getElementById("errorDialog").showModal();
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

	updateStudents(students) {
		if (this.studentsAdded) return;
		students.forEach(item => {
			document.querySelector("#player1").innerHTML += '<option value="' + item.username + '">' + item.displayName + '</option>'
			document.querySelector("#player2").innerHTML += '<option value="' + item.username + '">' + item.displayName + '</option>'
			document.querySelector("#player3").innerHTML += '<option value="' + item.username + '">' + item.displayName + '</option>'
			document.querySelector("#player4").innerHTML += '<option value="' + item.username + '">' + item.displayName + '</option>'
		});
		this.studentsAdded = students.length > 0;
	}

	validateForm(categories, players) {
		if (new Set(categories).size != 4) {
			this.showError("Select 4 different categories");
			return false;
		}
		if (players.length == 0) {
			this.showError("Specify the name atleast 1 player");
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
		var players = new Set();
		if (document.forms["newgame"].player1.selectedIndex != 0) {
			var username = document.forms["newgame"].player1.selectedOptions[0].value
			var displayName = document.forms["newgame"].player1.selectedOptions[0].text
			players.add(Player.createPlayer(username, displayName, 1));
		}
		if (document.forms["newgame"].player2.selectedIndex != 0) {
			var username = document.forms["newgame"].player2.selectedOptions[0].value
			var displayName = document.forms["newgame"].player2.selectedOptions[0].text
			players.add(Player.createPlayer(username, displayName, 2));
		}
		if (document.forms["newgame"].player3.selectedIndex != 0) {
			var username = document.forms["newgame"].player3.selectedOptions[0].value
			var displayName = document.forms["newgame"].player3.selectedOptions[0].text
			players.add(Player.createPlayer(username, displayName, 3));
		}
		if (document.forms["newgame"].player4.selectedIndex != 0) {
			var username = document.forms["newgame"].player4.selectedOptions[0].value
			var displayName = document.forms["newgame"].player4.selectedOptions[0].text
			players.add(Player.createPlayer(username, displayName, 4));
		}
		if (this.validateForm(categories, players)) {
			var gm = GameManager.createGame(this.database, this.teacherId, categories, Array.from(players));
			window.location.href = "game.html?gameid=" + gm.gameId
		}

	}


	init() {
		document.getElementById("submit-button").addEventListener("click", this.createGame.bind(this));
		document.getElementById("errorDialog").querySelector(".details-modal-close").addEventListener("click", (event) => {
			document.getElementById("errorDialog").close();
		});
		if (Object.keys(this.user.class).length == 0) {
			this.showError("You are not part of any class. Please ask your teacher to send you an invite.", false);
			return;
		}

		this.teacherId = Object.keys(this.user.class)[0];
		this.qm = new QuestionManager(database, this.teacherId);
		this.categories = [];
		this.categoriesAdded = false;
		this.studentsAdded = false;

		this.qm.addCategoryListener(this.updateCategories.bind(this));
		this.qm.addStudentsListener(this.updateStudents.bind(this));

	}
}

function init() {
	const controller = new StartGameController(database);
}

window.onload = init;