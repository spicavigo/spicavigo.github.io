var CENTER_CELL_ID = 24;
var AdjList = {
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
var ROLL_AGAIN_CELLS = [0, 8, 40, 48];
var HQ_CELLS = [4, 20, 28, 44];
var PLAYER_HOME = [10, 12, 30, 32];
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
	setTimeout(function() {
		e.style.display = "none";
		e.style.opacity = 0;
	}, 2000)
	
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
	CurrentPlayer = (CurrentPlayer + 1)%4;
  	// In the header
  	setPlayerInHeader();
}

function SetupCategoryDialog(callback) {
	document.querySelector("dialog .tab1").style.display = "none";
	document.querySelector("dialog .tab2").style.display = "block";
	var html = ""
	getCategories().forEach(category => {
		html += '<option value="'+category+'">' + category + '</option>'

	});
	document.querySelector("dialog #category-select").innerHTML = html;
	document.querySelector("#category-button").onclick = function() {
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

		reveal.onclick = function() {
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

		yes.onclick = function() {
			callback(true);
			window.dialog.close();
		}
		no.onclick = function() {
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
		SetupCategoryDialog(function(category) {
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
  	var value = Math.floor(Math.random() * 5) + 1;
  	document.getElementById("roll-value").innerHTML = value;

  	var circle = "<div class='circle' data-player-id='" + CurrentPlayer + "'></div>";
  	getDestinations(PlayerPositions[CurrentPlayer], -1, value).forEach((val) => {
  		// Pulsate cell
  		const elem = getCell(val);
  		elem.classList.add("pulsate-cell");
  		elem.onclick = function() {
  			// Stop pulsating cells
  			var elements = document.querySelectorAll(".pulsate-cell");
			for (let i = 0; i < elements.length; i++) {
				elements[i].onclick = function() {}
				elements[i].classList.remove("pulsate-cell");
			}
  			// Remove the player's circle and Update current player's position to the selected cell
  			document.querySelector('[data-player-id="'+CurrentPlayer+'"]').remove();
  			PlayerPositions[CurrentPlayer] = parseInt(elem.attributes["data-cell-id"].value);
  			// Put the player in the select cell
  			elem.innerHTML += circle;

  			askQuestion(function(isCorrect) {
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
		"yellow": u.getAll("categories")[0],
		"red": u.getAll("categories")[1],
		"blue": u.getAll("categories")[2],
		"green": u.getAll("categories")[3]
	};
	var info = document.querySelector(".info")
	info.innerHTML += '<div class="yellow">'+ColorToCategory["yellow"] + '</div>'
	info.innerHTML += '<div class="red">'+ColorToCategory["red"] + '</div>'
	info.innerHTML += '<div class="blue">'+ColorToCategory["blue"] + '</div>'
	info.innerHTML += '<div class="green">'+ColorToCategory["green"] + '</div>'
	// Set all players to center
	var center = getCell(CENTER_CELL_ID);
	var html = "";
	for (var i=0; i<NUM_PLAYERS; i++) {
		html += "<div class='circle' data-player-id='" + i + "'></div>";
		showPlayerHome(i);
	}

	center.innerHTML = html;

	document.getElementById('actions').style.width = (document.getElementById('board').clientWidth-20)+"px";
	document.getElementById("roll-button").onclick = doRoll;
	setPlayerInHeader();

	InitQuestions();
}

window.onload = initBoard

function getDestinations(curr, prev, moves) {
	if (moves == 0) {
		return new Set([curr]);
	}
	var ret = new Set([]);
	for (var i = 0; i < AdjList[curr].length; i++) {
		if (AdjList[curr][i] == prev) {
			continue;
		}
		var dests = getDestinations(AdjList[curr][i], curr, moves-1);
		dests.forEach(val => { ret.add(val); })
		
	}
	return ret;

}



