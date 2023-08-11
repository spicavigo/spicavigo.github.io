class User {
    constructor(database) {
        this.database = database;
        this.displayName = "";
        this.username = "";
        this.type = "";
        this.photoURL = "";
        this.class = {};
        this.isReady = false;
    }

    hideSignOut() {
        document.getElementById("signout").style.display = "none";
    }

    showSignOut() {
        document.getElementById("signout").style.display = "inline-block";
        document.getElementById("signout").onclick = this.signOut.bind(this);
        document.getElementById("signout").style.backgroundImage = `url(${this.photoURL})`;
    }

    isLoginPage() {
        return window.location.pathname == '/login.html';
    }

    gotoLoginPage() {
        window.location.href = "/login.html";
    }

    gotoLoggedInInPage() {
        if (this.isLoginPage()) {
            if (this.type == "teacher") {
                window.location.href = "/dashboard.html";
            } else {
                window.location.href = "/index.html";
            }
        }
    }

    showTypeForm() {
        document.getElementById("main-form").innerHTML = document.getElementById("hidden").innerHTML;
        document.getElementById("main-form").querySelector('#submit-button').onclick = this.saveType.bind(this);
    }

    saveType() {
        this.type = document.getElementById("main-form").querySelector('#type').value;
        this.processUserData();
    }

    config() {
        return {
            signInSuccessUrl: '/login.html',
            signInOptions: [
                // Leave the lines as is for the providers you want to offer your users.
                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            ],
            signInFlow: 'popup',
            // tosUrl and privacyPolicyUrl accept either url string or a callback
            // function.
            // Terms of service url/callback.
            tosUrl: '<your-tos-url>',
            // Privacy policy url/callback.
            privacyPolicyUrl: function () {
                window.location.assign('<your-privacy-policy-url>');
            }
        };
    }

    getUserDetailsFromDB() {
        var ref = database.ref(`users/${this.username}`);
        ref.once('value', this.updateFromDB.bind(this))
    }

    async updateFromDB(snapshot) {
        var ref = database.ref(`users/${this.username}`);
        if (snapshot.val() == null) {
            await ref.set({
                'displayName': this.displayName,
                'username': this.username,
                'photoURL': this.photoURL
            });
        } else {
            this.type = snapshot.val().type;
            this.class = snapshot.val().class || {};
        }

        this.processUserData();
    }

    async updateDB() {
        var ref = database.ref(`users/${this.username}`);
        await ref.update({
            'displayName': this.displayName,
            'username': this.username,
            'type': this.type,
            'photoURL': this.photoURL,
            "class": this.class || {}
        })
    }

    hasVal() {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] == "" || arguments[i] == undefined) return false
        }
        return true;
    }

    isUserComplete() {
        return this.hasVal(this.displayName, this.username, this.photoURL, this.type);
    }

    processUserData() {
        // Our instance has been updated with login data as well as firebase data
        // The only thing missing could be type
        // If I am not on login page, we should redirect to login page
        // Else just show the form to update type

        if (this.isUserComplete()) {
            this.updateDB();
            this.isReady = true;
            if (!this.isLoginPage()) {
                return this.callback();
            } else {
                return this.gotoLoggedInInPage();
            }
        }

        if (!this.isLoginPage()) {
            return this.gotoLoginPage();
        }

        this.showTypeForm();

    }

    onAuthStateChanged(user) {
        if (user) {
            // User is signed in.
            this.displayName = user.displayName;
            this.username = user.email.split('@')[0];
            this.photoURL = user.photoURL;
            this.showSignOut();
            this.getUserDetailsFromDB();
        } else {
            this.hideSignOut();
            this.setupLoginUI();
        }
    }

    setupLoginUI() {
        if (firebase.auth().currentUser == null) {
            if (this.isLoginPage()) {
                this.displayName = "";
                this.username = "";
                this.photoURL = "";
                this.type = "";
                // Initialize the FirebaseUI Widget using Firebase.
                var ui = new firebaseui.auth.AuthUI(firebase.auth());
                // The start method will wait until the DOM is loaded.
                ui.start('#main-form', this.config());
            } else {
                this.gotoLoginPage();
            }
        } else {
            onAuthStateChanged(firebase.auth().currentUser);
        }
    }

    signOut() {
        firebase.auth().signOut();
    }

    init(callback) {
        this.callback = callback;
        firebase.auth().onAuthStateChanged(
            this.onAuthStateChanged.bind(this),
            function (error) {
                console.log(error);
            });
    }
}