class Question {
	constructor(question, options, answer, category, key) {
		this.question = question;
		this.options = options;
		this.answer = answer;
		this.category = category;
		this.key = key;
	}

	toJSON() {
		return JSON.stringify({
			question: this.question,
			options: this.options,
			answer: this.answer,
			category: this.category
		});
	}

	static fromJSON(key, json) {
		var obj = JSON.parse(json);
		return new Question(obj.question, obj.options, obj.answer, obj.category, key);
	}
}


class QuestionManager {
	constructor(database, teacherId) {
		this.database = database
		this.categoryRef = this.database.ref(`teacher/${teacherId}/category`);
		this.questionRef = this.database.ref(`teacher/${teacherId}/question`);
		this.studentRef = this.database.ref(`teacher/${teacherId}/students`);

		this.categoriesUpdateListener = function (categories) { }
		this.questionsUpdateListener = function (questions) { }
		this.studentssUpdateListener = function (students) { }

		this.questionsList = [];
		this.questions = {};
		this.categories = [];
		this.students = [];
		this.startListening();
	}

	removeCategory(category) {
		this.categoryRef.child(category).remove()
	}

	addCategory(category) {
		return this.categoryRef.push(category).key;
	}

	addCategoryListener(callback) {
		this.categoriesUpdateListener = callback;
		this.categoriesUpdateListener(this.categories);
	}

	startListening() {
		this.categoryRef.on("value", this.categoryListener.bind(this));
		this.questionRef.on("value", this.questionListener.bind(this));
		this.studentRef.on("value", this.studentsListener.bind(this));
	}

	addStudentsListener(callback) {
		this.studentssUpdateListener = callback;
		this.studentssUpdateListener(this.students);
	}

	studentsListener(snapshot) {
		this.students = [];
		var self = this;
		snapshot.forEach(function (childSnapshot) {
			self.students.push(childSnapshot.val());
		});
		this.studentssUpdateListener(this.students);
	}

	categoryListener(snapshot) {
		this.categories = []
		var self = this;
		snapshot.forEach(function (childSnapshot) {
			self.categories.push([childSnapshot.key, childSnapshot.val()]);
		});
		this.categoriesUpdateListener(this.categories);
	}

	removeQuestion(question) {
		this.questionRef.child(question).remove()
	}

	addQuestion(question) {
		this.questionRef.push(question.toJSON());
	}

	addQuestionListener(callback) {
		this.questionsUpdateListener = callback;
		this.questionsUpdateListener(this.questionsList);
	}

	questionListener(snapshot) {
		this.questionsList = [];
		this.questions = {};
		var self = this;
		snapshot.forEach(function (childSnapshot) {
			var question = Question.fromJSON(childSnapshot.key, childSnapshot.val());
			self.questionsList.push(question);
			self.questions[question.key] = question;
		});
		this.questionsUpdateListener(this.questionsList);
	}

	getQuestion(category, filter) {
		// Shuffle
		this.questionsList = this.questionsList
			.map(value => ({ value, sort: Math.random() }))
			.sort((a, b) => a.sort - b.sort)
			.map(({ value }) => value);

		for (const question of this.questionsList) {
			if (question.category == category && !filter.has(question.key)) {
				return question;
			}
		}
		return this.questionsList[1]
	}

	getQuestionFromKey(key) {
		return this.questions[key];
	}
}