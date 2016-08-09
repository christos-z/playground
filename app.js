var express = require('express');
var app = express();
app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

var mongodb = require('./mongodb');
app.use('/mongo-db-test', mongodb);
// handler for the /user/:id path, which prints the user ID
app.get('/user/:id', function (req, res, next) {
    // if the user ID is 0, skip to the next route
    if (req.params.id == 0) next('route');
    // otherwise pass the control to the next middleware function in this stack
    else next(); //
}, function (req, res, next) {
    // render a regular page
    res.render('index', { title: 'Hey', message: 'Hello there!'});
});

// handler for the /user/:id path, which renders a special page
app.get('/user/:id', function (req, res, next) {
    res.render('special');
});