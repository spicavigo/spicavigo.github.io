
class DashboardController {
    constructor(database) {
        this.database = database;
        this.user = new User(database);
        this.user.init(this.init.bind(this));
    }

    categorySubmit(e) {
        var category = document.getElementById("newcat").value;
        if (e.keyCode === 13) {
            e.preventDefault();
            if (category == "") {
                return false;
            }
            this.qm.addCategory(category);
            document.getElementById("newcat").value = "";
            document.getElementById("newcat").focus();
            return true;
        }
    }

    removeCategory(e) {
        this.qm.removeCategory(e.target.dataset.key);
    }


    updateCategories(categories) {
        var sel = document.getElementById("cat-options").options;
        for (var i = 1; i < sel.length; i++) { // looping over the options
            sel.remove(i);
        }
        document.querySelectorAll(".cat").forEach(e => e.remove());
        categories.forEach(elem => {
            var key = elem[0];
            var e = elem[1]
            var li = document.createElement("li");
            li.className = "cat";
            li.textContent = e;
            var trashIcon = document.createElement("i")
            trashIcon.className = "gg-trash";
            trashIcon.dataset.key = key;
            trashIcon.addEventListener("click", this.removeCategory.bind(this));
            li.appendChild(trashIcon)
            document.querySelector('#categories ul').appendChild(li);

            document.getElementById("cat-options").add(new Option(e));
        });
    }

    resetQuestion() {
        quill.setContents();
        var sel = document.getElementById("options").options;
        while (sel.length > 1) { // looping over the options
            sel.remove(1);
        }
        document.getElementById("options").options[0].selected = true;
    }

    optionAdd(e) {
        var option = document.getElementById("newoption").value;
        if (e.keyCode === 13) {
            e.preventDefault();
            if (option == "") {
                return false;
            }
            document.getElementById("options").add(new Option(option));
            document.getElementById("newoption").value = "";
            document.getElementById("newoption").focus();
            return true;
        }
    }

    showAddQuestionError(msg) {
        document.getElementById("error").innerHTML = msg;
    }

    showLoader() {
        document.querySelector(".loader").style.display = "block"
    }

    hideLoader() {
        document.querySelector(".loader").style.display = "none"
    }

    addQuestion() {
        var question = quill.getContents();
        var options = [];
        var optSet = new Set();
        var sel = document.getElementById("options").options;
        var answer = "";
        var category = document.getElementById("cat-options").selectedOptions[0].value;
        for (var i = 0; i < sel.length; i++) { // looping over the options
            if (optSet.has(sel[i].value)) {
                continue;
            }
            optSet.add(sel[i].value);
            if (!sel[i].disabled) {
                options.push(sel[i].value);
                if (sel[i].selected) answer = sel[i].value;
            }
        }
        if (answer == "") {
            this.showAddQuestionError("Please select and answer");
            return false;
        }

        if (options.length < 2) {
            this.showAddQuestionError("Please add atleast 2 options");
            return false;
        }

        if (document.getElementById("cat-options").selectedIndex == 0) {
            this.showAddQuestionError("Please select a category");
            return false;
        }

        this.showLoader();
        var q = new Question(question, options, answer, category)
        this.qm.addQuestion(q);
        this.hideLoader();

    }

    removeQuestion(e) {
        this.qm.removeQuestion(e.target.dataset.key);
    }

    updateQuestions(questions) {
        document.querySelectorAll('#questions .question').forEach(e => e.remove());
        var elem = document.getElementById("questions");
        questions.forEach(question => {
            var container = document.createElement("div");
            container.className = "question";

            var editor = document.createElement("div")
            editor.className = "question-content";


            var optionHeading = document.createElement("h2")
            optionHeading.textContent = "Answer Options";

            var options = document.createElement("ul");
            options.className = "qoptions";
            question.options.forEach(option => {
                var li = document.createElement("li");
                li.textContent = option;

                if (option == question.answer) {
                    var i = document.createElement("i")
                    i.className = "gg-check";
                    li.appendChild(i);
                }
                options.appendChild(li)
            })

            var catHeading = document.createElement("h2")
            catHeading.textContent = "Category";
            var category = document.createElement("div")
            category.textContent = question.category;

            var trashIcon = document.createElement("i")
            trashIcon.className = "gg-trash";
            trashIcon.dataset.key = question.key;
            trashIcon.addEventListener("click", this.removeQuestion.bind(this));

            container.appendChild(trashIcon);
            container.appendChild(editor);
            container.appendChild(optionHeading);
            container.appendChild(options);
            container.appendChild(catHeading);
            container.appendChild(category);


            elem.appendChild(container);

            var q = new Quill(editor, {
                modules: {
                    toolbar: null
                },
                readOnly: true,
                theme: 'snow'  // or 'bubble'
            });
            q.setContents(question.question);
        })
    }

    updateInviteLink() {
        var self = this;
        var ref = database.ref(`teacher/${this.user.username}`);
        ref.once('value', function (snapshot) {
            if (snapshot.val() == null || !snapshot.val().icode) {
                var icode = database.ref('invites/').push();
                icode.set({
                    "teacher": self.user.username,
                    "displayName": self.user.displayName
                });
                ref.update({ "icode": icode.key });
                self.displayInviteLink(icode.key);
            } else {
                self.displayInviteLink(snapshot.val().icode);
            }
        });
    }

    displayInviteLink(icode) {
        document.querySelector('.copylink').innerHTML = window.location.origin + "/invite.html?icode=" + icode;
    }

    init() {
        this.qm = new QuestionManager(database, this.user.username);

        this.updateInviteLink()

        document.getElementById("newcat").addEventListener("keyup", this.categorySubmit.bind(this));
        document.getElementById("newoption").addEventListener("keyup", this.optionAdd.bind(this));
        document.getElementById("submit-button").addEventListener("click", this.addQuestion.bind(this));
        document.getElementById("reset-button").addEventListener("click", this.resetQuestion.bind(this));

        this.qm.addCategoryListener(this.updateCategories.bind(this));
        this.qm.addQuestionListener(this.updateQuestions.bind(this));
    }
}

function init() {
    const controller = new DashboardController(database);
}

window.onload = init;