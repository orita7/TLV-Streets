var fileParser = require('./Parser.js');
var http = require('https');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var googleAPI = 'AIzaSyAFIeUM9E0jdkLT7aNsizf_Iove6TvCj6Y';


var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
fileParser.startToParse();

//My function - orit
app.use(express.static('public/static'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.get('/streets/:name', function(request, response) {
  response.send(fileParser.getStreets(request.params.name));
});

app.get('/search/:search',function(request,response){

  var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
      // the street name you want to search in google places,
      // streetname must be sent as UTF8 in order google servie acccept the request
      'input=' + encodeURIComponent(request.params.search)+
      // types - only address result from israel
      '&types=address&language=il' +
      '&key='+googleAPI;

  http.get(url, function(res){
    var body = '';

    res.on('data', function(chunk){
      body += chunk;
    });

    res.on('end', function(){
      var predictionResults = JSON.parse(body);

      // TODO handel status: OK, zero_results, ....
      var filteredPredictionResults = getStreetFromTlv(predictionResults);

      response.send(filteredPredictionResults);
      console.log("Got a response: ", body);
    });
  }).on('error', function(e){
    console.log("Got an error: ", e);
  });


  function getStreetFromTlv(data){
    var filtered;

    data.predictions.forEach(function (result){
      // if the city is tlv aviv

      console.log('value:#' + result.terms[1].value + '#');
      console.log('tosrtinrg:#' + result.terms[1].value+ '#');
      console.log('compare:' + result.terms[1].value === 'תל אביב יפו');

      //TODO: the hewbrew hard coded string making the comperasion to fail
      if (result.terms[1].value == new String("תל אביב יפו").valueOf()) {
        // push the street name
        filtered.push(result.terms[0]);
      }
    });

    return filtered;
  }


});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
