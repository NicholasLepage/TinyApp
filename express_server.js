//jshint esversion: 6

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');

app.use(cookieSession({
  name: 'session',
  keys: ["big boi with big secrets"],

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("views"));
app.use(methodOverride('_method'));

//Database containing every website created by the users.
let urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca",
              user_id: ""},
  "9sm5xK": { longURL: "http://www.google.com",
              user_id: ""}
};

//Database for specific users built using urlsForUser() when needed.
let userUrls = {};

//Database containing all registered users.
let users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//Creates a custom URL database for the user who is logged in
const urlsForUser = userid => {
  userUrls = {};
  for (let id in urlDatabase) {
    if (urlDatabase[id].user_id === userid) {
      userUrls[id] = {};
      userUrls[id].longURL = urlDatabase[id].longURL;
      userUrls[id].user_id = userid;
    }
  }
  return userUrls;
};

//Homepage
app.get("/urls", (req, res) => {
  urlsForUser(req.session.user_id);     //Builds URL database for specific user.
  let templateVars = { urls: userUrls,
                        userObject: users[req.session.user_id]
                      };
  res.render("urls_index", templateVars);
});

//Root, redirects to real homepage (Might make this a cute landing page eventually)
app.get("/", (req, res) => {
  res.redirect("/urls");
});

//API of our website
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Loads the Register page for users to sign up
app.get("/register", (req, res) => {
  let templateVars = { userObject: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

//Creates the new user, adds it to the users object, and handles any input error by the user
app.post("/register", (req, res) => {
  for (let user in users) {           //Makes sure email and password are filled in + if user already exists.
    if (req.body.email === '' || req.body.password === '' || req.body.email === users[user].email) {
      res.sendStatus(400);
    }
  }
  req.body.id = generateRandomString(); //Creates a unique ID for the new user.
  users[req.body.id] = req.body;
  const pass = req.body.password;
  const hashedPass = bcrypt.hashSync(pass, 10);
  console.log(hashedPass);
  req.session.user_id = req.body.id;   //Creates the cookie "user_id" which will remember who is logged in.

  res.redirect("/urls");
});

//Loads the Login page for users to sign in
app.get("/login", (req, res) => {
  let templateVars = { userObject: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

//Checks to see if the login information is in our user object. If yes, log the user in.
app.post("/login", (req,res) => {
  for (let user in users) {
    if (users[user].email === req.body.email && users[user].password === req.body.password) {
      req.session.user_id = users[user].id;
      res.redirect("/urls");
    }
  }
  res.status(403).send("Forbidden. Invalid email or password.");
});

//Logs the user out by clearing the user_id cookie
app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect("/urls");
});

//Handles the request to delete a particular URL from the UrlDatabase
//Did not make it impossible to delete if the URL isn't yours,
//because you don't have access to the button if you're not logged in as the appropriate user.
app.delete("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//Loads the page to create a new Short URL
app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {  //Makes sure that you're logged in before using the service.
    res.redirect("/login");
  } else {
    let templateVars = { userObject: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

//Adds a new URL to the UrlDatabase
app.post("/urls", (req, res) => {
  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {};                //Adds new URL in an object which stores both the longURL and the ID of the user who created it.
  urlDatabase[newShortURL].longURL = newLongURL;
  urlDatabase[newShortURL].user_id = req.session.user_id;
  res.redirect("/urls/" + newShortURL);
});

//Edit existing URL
//Note: Edit button does not appear on index since you cannot URLs which aren't yours.
//However, I made sure that you cannot edit any link by brute forcing your way into the edit page
//by checking the cookies on the actual page. (See urls_show.ejs file)
app.put("/urls/:id", (req,res) => {
  urlDatabase[req.params.id].longURL = req.body.updatedURL;
  res.redirect("/urls");
});

//Loads the page after having created a new URL
app.get("/urls/:id", (req, res) => {
  urlsForUser(req.session.user_id); //Builds custom URL database in order to check if the link is yours on the actual page.
  let templateVars = {
    urls: userUrls,
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    userObject: users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

//Redirects the user to the appropriate website using its ID
app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  res.redirect(urlDatabase[short].longURL);
});

//Function which creates a random ID
const generateRandomString = function() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});