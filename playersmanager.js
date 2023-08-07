class Player {
	constructor(name, order, cellId = -1, wedges = [], ref) {
		this.name = name;
		this.order = order;
		this.cellId = cellId;
		this.wedges = wedges;
		this.ref = ref;
	}

	setRef(ref) {
		this.ref = ref;
	}

	addWedge(token) {
		this.wedges.push(token);
		this.wedges = [...new Set(this.wedges)];
	}

	save() {
		this.ref.set({
			'name': this.name,
			'order': this.order,
			'cellId': this.cellId,
			'wedges': this.wedges
		});
	}

	toJSON() {
		return JSON.stringify({
			name: this.name,
			order: this.order,
			cellId: this.cellId,
			wedges: this.wedges
		});
	}

	static fromJSON(json) {
		var obj = JSON.parse(json);
		return new Player(obj.name, obj.order, obj.cellId, obj.wedges == undefined ? [] : obj.wedges);
	}

	static createPlayer(name, order) {
		return new Player(name, order, Board.CENTER_CELL_ID);
	}
}

class PlayersManager {
	constructor(database, teacherId, gameId) {
		this.playerRef = database.ref(`teacher/${teacherId}/game/${gameId}/players`);

		this.players = {};
		this.playersList = [];

		this.updateListener = function () { }
		this.startListener();

	}

	createPlayers(players) {
		players.forEach(player => {
			var ref = this.playerRef.push();
			player.setRef(ref);
			player.save();
		})

	}

	createPlayer(key, player) {
		return new Player(player.name, player.order, player.cellId == -1 ? Board.CENTER_CELL_ID : player.cellId,
			player.wedges, this.playerRef.child(key));
	}

	getPlayerByOrder(order) {
		return this.playersList[order - 1];
	}

	getTotalPlayers() {
		return this.playersList.length;
	}

	getNextPlayer(order) {
		for (const player of this.playersList.concat(this.playersList).slice(order)) {
			if (player != undefined) return player.order;
		}
	}

	movePlayer(order, cellId) {
		var player = this.getPlayerByOrder(order);
		player.cellId = cellId;
		player.save();
	}

	updatePlayerWedge(order, token) {
		var player = this.getPlayerByOrder(order);
		player.addWedge(token);
		player.save();
	}

	playerCallback(snapshot) {
		this.players = snapshot.val();
		this.playersList = Array(4);
		for (const [key, player] of Object.entries(this.players)) {
			this.playersList[player.order - 1] = this.createPlayer(key, player)
		}
		this.updateListener(this.playersList.filter(x => x !== undefined));
	}

	setPlayerListener(callback) {
		this.updateListener = callback;
		this.updateListener(this.playersList.filter(x => x !== undefined));
	}

	startListener() {
		this.playerRef.on('value', this.playerCallback.bind(this));
	}
}