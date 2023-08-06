
class GameManager {
	static createGame(database, teacherId, categories, players) {
		var gameRef = database.ref(`teacher/${teacherId}/game`).push();
		var pm = new PlayersManager(database, teacherId, gameRef.key);
		pm.createPlayers(players);
		gameRef.child('categories').set(categories);
		gameRef.child('state').set({
			'state': State.ToRoll,
			'currentPlayer': 1,
			'rollValue': 0
		})
		return new GameManager(database, teacherId, gameRef.key);
	}

	constructor(datanase, teacherId, gameId) {
		this.gameId = gameId
		this.gameRef = database.ref(`teacher/${teacherId}/game/${gameId}`);
		this.pm = new PlayersManager(database, teacherId, gameId);
		this.qm = new QuestionManager(database, teacherId);

		this.categories = [];
		this.state = {};
		this.usedQuestions = new Set();

		this._getCategories();
		this.updateListener = function () { }
		this.startStateListener();
		this.startUsedQuestionsListener();
	}

	updateGameState(update) {
		if (update.hasOwnProperty("question")) {
			this.gameRef.child('usedQuestions').push(update.question);
		}
		this.gameRef.child('state').update(update);
	}

	async _getCategories() {
		var snapshot = await this.gameRef.child('categories').once('value');
		this.categories = snapshot.val();
	}

	getCategories() {
		return this.categories;
	}

	getRollValue() {
		return this.state.rollValue;
	}

	getCurrentQuestion() {
		return this.qm.getQuestionFromKey(this.state.question);
	}

	getNewQuestion(category) {
		return this.qm.getQuestion(category, this.usedQuestions);
	}

	getPlayer(playerOrder) {
		return this.pm.getPlayerByOrder(playerOrder);
	}

	getCurrentPlayer() {
		return this.getPlayer(this.state.currentPlayer);
	}

	getTotalPlayers() {
		return this.pm.getTotalPlayers();
	}

	movePlayer(playerOrder, cellId) {
		this.pm.movePlayer(playerOrder, cellId);
	}

	updatePlayerWedge(token) {
		this.pm.updatePlayerWedge(this.state.currentPlayer, token);
	}

	setPlayerListener(callback) {
		this.pm.setPlayerListener(callback);
	}

	setGameStateListener(callback) {
		this.updateListener = callback;
	}

	gameStateCallback(snapshot) {
		this.state = snapshot.val();
		this.updateListener(this.state.state);
	}

	startStateListener() {
		this.gameRef.child('state').on('value', this.gameStateCallback.bind(this));
	}

	usedQuestionsCallback(snapshot) {
		var self = this;
		snapshot.forEach(function (childSnapshot) {
			self.usedQuestions.add(childSnapshot.val());
		});
	}

	startUsedQuestionsListener() {
		this.gameRef.child('usedQuestions').on('value', this.usedQuestionsCallback.bind(this));
	}
}