//jshint esversion: 6

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
                        username: req.cookies["username"]
                      };
  res.render("urls_index", templateVars);
});

app.post("/login", (req,res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req,res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.post("/urls/:id", (req,res) => {
  console.log(req.body.updatedURL);
  urlDatabase[req.params.id] = req.body.updatedURL;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                        longURL: urlDatabase[req.params.id],
                        username: req.cookies["username"]
                       };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  var newLongURL = req.body["longURL"];
  var newShortURL = generateRandomString();
  console.log(req.body);  // debug statement to see POST parameters
  res.redirect("/urls/" + newShortURL);
  urlDatabase[newShortURL] = newLongURL;         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = req.params["shortURL"];
  res.redirect(urlDatabase[longURL]);
});

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});