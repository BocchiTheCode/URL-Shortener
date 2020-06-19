'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;
app.use(cors());

mongoose.connect(process.env.MONGO_URI);
console.log(mongoose.connection.readyState);

var Schema = mongoose.Schema;
var urlshort = new Schema({
  _id:  String,
  url: String
});
const URL = mongoose.model('URL', urlshort);

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get("/:id", function (req, res) {
  URL.findOne({_id: req.params.id}, (err,data) => {
    console.log(data);
    if(err) res.send(err);
    else if(data) res.redirect(data.url);
    else res.send("Error :(");
  });
});


var urlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/|www\.)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

function makeShortenedURL() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

app.post("/api/shorturl/new", function (req, res) {
  console.log(mongoose.connection.readyState);
  if (urlRegex.test(req.body.url)) {
    URL.findOne({ url: req.body.url }, function (err, matchFound) {
      if (err) res.send(err);
      if (matchFound) res.send('A shortened URL already exists- https://twilight-headline.glitch.me/' + matchFound._id)
      else {
        var rand = makeShortenedURL();
        console.log(req.body.url + ' is valid')
        var document = new URL({
          "_id": rand,
          "url": req.body.url
        });
        document.save(function(err) {
          if (err) res.send(err);
          res.send(req.body.url+' has been shortened to: '+ 'https://twilight-headline.glitch.me/' + rand);
        });
      }
    });
  }
});

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});