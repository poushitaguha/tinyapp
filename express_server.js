const cookies = require("cookie-parser");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    // password: "purple-monkey-dinosaur"
    password: "$2b$10$UaeB4I1Bhx/SmerQvwmDUuP5H7oZTEUXG7lWwpF3TMQmSPEDugzme"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    // email: "user2@example.com",
    email: "posh@xyz.com", 
    // password: "123"
    password: "$2b$10$aWEVAbbBMakMGMsn1xwq6eL6MF41Cuf/eHwV3a2Mp/N62whYHDkLC"
  }
}

// Function to generate random string - a shortURL from longURL
function generateRandomString() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0,5);
}

// Function to generate random string - a shortURL from longURL
function generateRandomUserId() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(2, 10);
}

// Function to lookup for existing email
function lookupEmail (email) {
  for (let key in users) {
    if (email === users[key].email){
      return users[key];
    }
  }
  return false;
}

// Function to filter URLS as per logged in user
function urlsForUser(id) {
    let filteredUrls = {};
    for (let url in urlDatabase) {
      if (urlDatabase[url].userID === id) {
        filteredUrls[url] = urlDatabase[url]
      }
    }
    return filteredUrls;
}

app.get("/login", (req, res) => {
  let templateVars = { email: req.body.login, password: req.body.password };
  res.render("urls_login", templateVars);  
});

app.post("/login", (req, res) => {

  const enteredEmail = req.body.login
  const enteredPswd =  req.body.password
  let loggedUser;
  for (let userId in users) {
    let user = users[userId];
      if (user.email === enteredEmail) {
        loggedUser = user;
      }
  }

  if (loggedUser === undefined) {
    res.status(400).send('User doesnt exist in database, Register!');
  // } else if (loggedUser.password !== enteredPswd) {
  } else if (!bcrypt.compareSync(enteredPswd, loggedUser.password)) {
    res.status(400).send('Incorrect Password! Please try again!');          
    }
    else {
      // res.cookie('user_id', loggedUser.id);
      req.session.user_id = loggedUser.id;  
      res.redirect('/urls');
    }

});

app.get("/register", (req, res) => {
  let templateVars = {};
  res.render("urls_register", templateVars);  
});
 
app.post("/register", (req, res) => {

  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Email or password is empty.");
  }
  else if (lookupEmail(req.body.email)){
    res.status(400).send("Email is already registered. Try another.");
  }
  else {
    let id = generateRandomUserId();
    let email = req.body.email;
    // let password = req.body.password;
    let password = bcrypt.hashSync(req.body.password, 10);  
      users[id] = { 
          id: id, 
          email: email, 
          password: password
        }
  // res.cookie("user_id", id);
  req.session.user_id = id;
  // console.log(users);     // Log the object to the console
  res.redirect("/urls");
  }

});

// Implement the /logout endpoint so that it clears the username cookie and
// redirects the user back to the /urls page.
app.post("/logout", (req, res) => {
  // res.clearCookie("user_id"); 
  req.session = null; 
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {

  // const userId = req.cookies["user_id"];
  const userId = req.session.user_id;   
  const user = users[userId];

  if (!user) {
    res.redirect("/login");
  } else {
  let templateVars = { urls: urlDatabase, user: user, filteredUrls: urlsForUser(userId) };
  // console.log(urlsForUser(userId));
  res.render("urls_index", templateVars);  // Displays html in urls_index.ejs
  }
});

// Add a POST route that removes a URL resource: POST /urls/:shortURL/delete
// After the resource has been deleted, redirect the client back to the urls_index page ("/urls").
app.post("/urls/:shortURL/delete", (req, res) => {

  // const userId = req.cookies["user_id"];
  const userId = req.session.user_id;  

  if (userId && userId in users) {  
  delete urlDatabase[req.params.shortURL];
  // console.log(req.body);  // Log the POST request body to the console
  res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {

  // const userId = req.cookies["user_id"];
  const userId = req.session.user_id;  
  const user = users[userId];

  let shortURL = generateRandomString();
  if (userId && userId in users) {
    urlDatabase[shortURL] = {
      longURL: req.body.newLongURL,
      userID: userId
    };

  // console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);
  }
});

app.get("/urls/new", (req, res) => {

  // const userId = req.cookies["user_id"];
  const userId = req.session.user_id;    
  const user = users[userId];

  let templateVars = { user: user };

  // Only registered and logged in users can create new tiny URLs 
  if (!userId) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {

  // const userId = req.cookies["user_id"];
  const userId = req.session.user_id;    
  const user = users[userId];

  if (!user) {
    res.redirect("/login");
  } else {
  let templateVars = { shortURL: req.params.shortURL,
                       longURL: urlDatabase[req.params.shortURL].longURL, 
                       user: user, filteredUrls: urlsForUser(userId) };
  res.render("urls_show", templateVars);
  }
});

// Add a POST route that updates a URL resource; POST /urls/:id
app.post("/urls/:shortURL", (req, res) => {
// Assigning new longURL to database
  urlDatabase[req.params.shortURL].longURL = req.body.newLongURL;
  // console. log(req.body);  // Log the POST request body to the console
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const newLongURL = urlDatabase[req.params.shortURL].longURL; 
  res.redirect(newLongURL);
  if (!newLongURL) {
    res.redirect("/urls");    
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the TinyApp - Type /urls to proceed");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});