
var CurrentPlayer = 0;
var PlayerPositions = [CENTER_CELL_ID, CENTER_CELL_ID, CENTER_CELL_ID, CENTER_CELL_ID];

var PlayerWedges = [new Set(), new Set(), new Set(), new Set()];
var ColorToCategory = {
	"yellow": "Math",
	"red": "History",
	"green": "Geography",
	"blue": "Entertainment"
};
var PlayerNames = ["Ava", "Bartholomew", "Catherine", "Darius"];
var NUM_PLAYERS = 4;

function getCell(cell_id) {
	return document.querySelector('[data-cell-id="' + cell_id + '"]')
}

function showStatus(text) {
	var e = document.getElementsByClassName('status-text-big')[0];
	e.innerHTML = text
	e.style.display = "block";
	e.style.opacity = 1;
}

function showPlayerHome(player) {
	var cell_id = PLAYER_HOME[player];
	var elem = getCell(cell_id);
	var title_html = "<div class='home_title'>" + PlayerNames[player] + "</div>"
	var body_html = "<ul class='home_wedges'>";
	PlayerWedges[player].forEach(e => body_html += "<li>" + e + "</li>")
	body_html += "</ul>";
	elem.innerHTML = title_html + body_html;
}

function addWedge(player, wedge) {
	PlayerWedges[player].add(wedge);
	showPlayerHome(player);
}

function setPlayerInHeader() {
	document.getElementById("currentPlayer").innerHTML = PlayerNames[CurrentPlayer];
	if (CurrentPlayer == 0)
		document.getElementById("currentPlayer").className = "yellow-text"
	else if (CurrentPlayer == 1)
		document.getElementById("currentPlayer").className = "red-text"
	else if (CurrentPlayer == 2)
		document.getElementById("currentPlayer").className = "blue-text"
	else
		document.getElementById("currentPlayer").className = "green-text"
}

function nextPlayer() {
	// Global var
	CurrentPlayer = (CurrentPlayer + 1) % NUM_PLAYERS;
	// In the header
	setPlayerInHeader();
}

function SetupCategoryDialog(callback) {
	document.querySelector("dialog .tab1").style.display = "none";
	document.querySelector("dialog .tab2").style.display = "block";
	var html = ""
	getCategories().forEach(category => {
		html += '<option value="' + category + '">' + category + '</option>'

	});
	document.querySelector("dialog #category-select").innerHTML = html;
	document.querySelector("#category-button").onclick = function () {
		callback(document.querySelector("dialog #category-select").value)
	}
}

function SetupQADialog(question, callback) {
	document.querySelector("dialog .tab2").style.display = "none";
	document.querySelector("dialog .tab1").style.display = "block";
	var category = document.querySelector("dialog .category");
	var text = document.querySelector("dialog .text");
	var text2 = document.querySelector("dialog .text2");
	var reveal = document.querySelector("#reveal-button");
	var yes = document.querySelector("#yes-button");
	var no = document.querySelector("#no-button");

	if (reveal.style.display == "none") {
		category.innerHTML = question.category;
		text.innerHTML = question.question;
		text2.style.display = "none";
		yes.style.display = "none";
		no.style.display = "none";
		reveal.style.display = "inline-block";

		reveal.onclick = function () {
			SetupQADialog(question, callback)
		}
	} else {
		category.innerHTML = "Answer";
		text.innerHTML = question.answer;
		text2.innerHTML = "Did " + PlayerNames[CurrentPlayer] + " answer correctly?";
		text2.style.display = "block";
		yes.style.display = "inline-block";
		no.style.display = "inline-block";
		reveal.style.display = "none";

		yes.onclick = function () {
			callback(true);
			window.dialog.close();
		}
		no.onclick = function () {
			callback(false);
			window.dialog.close();
		}
	}
}

function getCategory(cell_id) {
	return ColorToCategory[getCell(cell_id).attributes['data-cell-type'].value.split('-')[0]];
}

function askQuestion(callback) {
	if (ROLL_AGAIN_CELLS.includes(PlayerPositions[CurrentPlayer])) {
		callback(true);
		return
	}
	window.dialog.showModal();
	if (PlayerPositions[CurrentPlayer] == CENTER_CELL_ID) {
		SetupCategoryDialog(function (category) {
			var question = getQuestion(category);
			SetupQADialog(question, callback);
		})
	} else {
		var category = getCategory(PlayerPositions[CurrentPlayer]);
		var question = getQuestion(category);
		SetupQADialog(question, callback);
	}

}

function doRoll() {
	// Disable roll button
	document.getElementById("roll-button").style.visibility = "hidden";
	// Display Roll Value
	var value = Math.floor(Math.random() * 6 + 1)
	document.getElementById("roll-value").innerHTML = value;

	var circle = "<div class='circle' data-player-id='" + CurrentPlayer + "'></div>";
	getDestinations(PlayerPositions[CurrentPlayer], -1, value).forEach((val) => {
		// Pulsate cell
		const elem = getCell(val);
		elem.classList.add("pulsate-cell");
		elem.onclick = function () {
			// Stop pulsating cells
			var elements = document.querySelectorAll(".pulsate-cell");
			for (let i = 0; i < elements.length; i++) {
				elements[i].onclick = function () { }
				elements[i].classList.remove("pulsate-cell");
			}
			// Remove the player's circle and Update current player's position to the selected cell
			document.querySelector('[data-player-id="' + CurrentPlayer + '"]').remove();
			PlayerPositions[CurrentPlayer] = parseInt(elem.attributes["data-cell-id"].value);
			// Put the player in the select cell
			elem.innerHTML += circle;

			askQuestion(function (isCorrect) {
				// Enable roll button
				document.getElementById("roll-button").style.visibility = "visible";
				if (!isCorrect) {
					// Updae current player
					nextPlayer();
					//showStatus(PlayerNames[CurrentPlayer] + "'s Turn");
				} else {
					//showStatus("Roll Again");
					if (HQ_CELLS.includes(PlayerPositions[CurrentPlayer])) {
						var category = getCategory(PlayerPositions[CurrentPlayer]);
						addWedge(CurrentPlayer, category);
					}
					if (PlayerPositions[CurrentPlayer] == CENTER_CELL_ID && PlayerWedges[CurrentPlayer].size == 4) {
						showStatus(PlayerNames[CurrentPlayer] + " Won!!!");
						// Disable roll button
						document.getElementById("roll-button").style.visibility = "hidden";
					}
				}
			});
		}

	})
}

function initBoard() {
	var u = new URLSearchParams(window.location.search);
	PlayerNames = [];
	if (u.get("player1")) {
		PlayerNames.push(u.get("player1"))
	}
	if (u.get("player2")) {
		PlayerNames.push(u.get("player2"))
	}
	if (u.get("player3")) {
		PlayerNames.push(u.get("player3"))
	}
	if (u.get("player4")) {
		PlayerNames.push(u.get("player4"))
	}
	NUM_PLAYERS = PlayerNames.length;

	ColorToCategory = {
		"yellow": u.get("yellowcat"),
		"red": u.get("redcat"),
		"blue": u.get("bluecat"),
		"green": u.get("greencat")
	};
	var info = document.querySelector(".info")
	info.innerHTML += '<div class="yellow">' + ColorToCategory["yellow"] + '</div>'
	info.innerHTML += '<div class="red">' + ColorToCategory["red"] + '</div>'
	info.innerHTML += '<div class="blue">' + ColorToCategory["blue"] + '</div>'
	info.innerHTML += '<div class="green">' + ColorToCategory["green"] + '</div>'
	// Set all players to center
	var center = getCell(CENTER_CELL_ID);
	var html = "";
	for (var i = 0; i < NUM_PLAYERS; i++) {
		html += "<div class='circle' data-player-id='" + i + "'></div>";
		showPlayerHome(i);
	}

	center.innerHTML = html;

	document.getElementById('actions').style.width = (document.getElementById('board').clientWidth - 20) + "px";
	document.getElementById("roll-button").onclick = doRoll;
	setPlayerInHeader();

	InitQuestions();
}

window.onload = initBoard




