class Player {
	constructor(username, displayName, order, cellId = -1, wedges = [], ref, isOnline = false) {
		this.username = username;
		this.displayName = displayName;
		this.order = order;
		this.cellId = cellId;
		this.wedges = wedges;
		this.ref = ref;
		this.isOnline = isOnline;
	}

	setRef(ref) {
		this.ref = ref;
	}

	addWedge(token) {
		this.wedges.push(token);
		this.wedges = [...new Set(this.wedges)];
	}

	save() {
		this.ref.update({
			'username': this.username,
			'displayName': this.displayName,
			'order': this.order,
			'cellId': this.cellId,
			'wedges': this.wedges
		});
	}

	toJSON() {
		return JSON.stringify({
			username: this.username,
			displayName: this.displayName,
			order: this.order,
			cellId: this.cellId,
			wedges: this.wedges
		});
	}

	static fromJSON(json) {
		var obj = JSON.parse(json);
		return new Player(obj.username, obj.displayName, obj.order, obj.cellId, obj.wedges == undefined ? [] : obj.wedges);
	}

	static createPlayer(username, displayName, order) {
		return new Player(username, displayName, order, Board.CENTER_CELL_ID);
	}
}

class PlayersManager {
	constructor(database, teacherId, gameId, me) {
		this.me = me;
		this.playerRef = database.ref(`teacher/${teacherId}/game/${gameId}/players`);

		this.players = {};
		this.playersList = [];

		this.updateOnlineStatus();
		this.updateListener = function () { }
		this.startListener();

	}

	updateOnlineStatus() {
		var self = this;
		this.playerRef.once('value', function (snapshot) {
			var players = snapshot.val();
			for (const [key, player] of Object.entries(players)) {
				if (player.username == self.me.username) {
					self.playerRef.child(key).onDisconnect().update({ 'online': false });
					self.playerRef.child(key).update({ 'online': true });
				}
			}
		});
	}

	createPlayers(players) {
		players.forEach(player => {
			var ref = this.playerRef.push();
			player.setRef(ref);
			player.save();
		})

	}

	createPlayer(key, player) {
		return new Player(player.username, player.displayName, player.order,
			player.cellId == -1 ? Board.CENTER_CELL_ID : player.cellId,
			player.wedges, this.playerRef.child(key), player.online);
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