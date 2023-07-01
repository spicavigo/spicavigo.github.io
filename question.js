
Array.prototype.choose = function(){
  return this[Math.floor(Math.random()*this.length)];
}

function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

var Used = new Set();

function getCategories() {
	var ret = new Set();
	QuestionBank.forEach(e => ret.add(e.category))
	return ret;
}

function getQuestion(category) {
	if (category == undefined) {
		category = Array.from(getCategories()).choose();
	}

	for (var i=0; i<QuestionBank.length; i++) {
		if (QuestionBank[i].category == category && !Used.has(QuestionBank[i].id)) {
			Used.add(QuestionBank[i].id);
			return QuestionBank[i];
		}
	}
	
}

function InitQuestions() {
	shuffle(QuestionBank);
}