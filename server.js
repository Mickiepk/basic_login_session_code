const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');  // Import express-session

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',    // Your database host
  user: 'root',         // Your MySQL username
  password: 'mickie123', // Your MySQL password
  database: 'my_database', // Your MySQL database name
  port: 3306            // MySQL default port
});

const app = express();
app.use(bodyParser.json()); // To parse JSON bodies

// Set up session middleware
app.use(session({
  secret: 'your-secret-key',  // Change this to a secure, random value
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }  // Session expires after 1 minute (adjust as needed)
}));

// Middleware to check if the user is logged in and disable caching
function checkLogin(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  if (req.session.loggedIn) {
    next();  // If logged in, proceed to the next middleware or route
  } else {
    res.redirect('/');  // If not logged in, redirect to login page
  }
}

// Handle POST request to /login
app.post('/login', (req, res) => {
  const inputEmail = req.body.email;

  // Query to check if the email exists and fetch first and last name
  const query = 'SELECT first_name, last_name FROM mickie WHERE email = ? LIMIT 1';

  connection.query(query, [inputEmail], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.json({ message: 'Error occurred during login' });
    }

    // Check if the query returned a result
    if (results.length > 0) {
      const user = results[0]; // The first row returned by the query
      req.session.loggedIn = true;  // Set session variable for login status
      req.session.firstName = user.first_name;  // Store first name in session
      req.session.lastName = user.last_name;    // Store last name in session
      return res.json({ 
        message: `Welcome back, ${user.first_name} ${user.last_name}!`,
        first_name: user.first_name,
        last_name: user.last_name
      });
    } else {
      return res.json({ message: 'Login failed: Email does not exist.' });
    }
  });
});

// Serve the welcome page only if logged in and no cache
app.get('/welcome.html', checkLogin, (req, res) => {
  res.sendFile(__dirname + '/public/welcome.html');
});

// Logout route to destroy the session
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/');  // Redirect to login page after logging out
  });
});

// Serve the front-end (static HTML)
app.use(express.static('public'));

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});