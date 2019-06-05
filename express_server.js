var cookies = require("cookie-parser");
var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookies());

app.set("view engine", "ejs");

// Function to generate random string - a shortURL from longURL
function generateRandomString() {
   return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0,5);
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// Implement the /logout endpoint so that it clears the username cookie and
// redirects the user back to the /urls page.
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

// Add a POST route that removes a URL resource: POST /urls/:shortURL/delete
// After the resource has been deleted, redirect the client back to the urls_index page ("/urls").
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(req.body);  // Log the POST request body to the console
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

// Add a POST route that updates a URL resource; POST /urls/:id
app.post("/urls/:shortURL", (req, res) => {
// Assigning new longURL to database
  urlDatabase[req.params.shortURL] = req.body.longURL;
  console.log(req.body);  // Log the POST request body to the console
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});