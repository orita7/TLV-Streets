var fileParser = require('./parser.js');
var levenshteinDistanceAlgo = require('./levenshteinDistance.js');
var http = require('https');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var googleAPI = 'AIzaSyAFIeUM9E0jdkLT7aNsizf_Iove6TvCj6Y';

// tel aviv yafo in hebrew
var strTlv = decodeURIComponent('%D7%AA%D7%9C%20%D7%90%D7%91%D7%99%D7%91%20%D7%99%D7%A4%D7%95');
var allStreets = fileParser.getAllStreets();
var allShortStreetNames = fileParser.getStreetNamesArray();
var predictionsCache = [];
var app = express();
fileParser.startToParse();

app.use(express.static('/static'));

// uncomment after placing your favicon in /static
//app.use(favicon(__dirname + '/static/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));

app.get('/getRandomPage', function(request, response) {
    var keys = Object.keys(allStreets);
    var randomIndex = Math.floor(keys.length * Math.random());
    var randomName = keys[randomIndex];
    var randomValue = allStreets[randomName];
    response.send(JSON.stringify({streetName: randomName , streetInfo: randomValue}));
});

app.get('/streets/:name', function(request, response) {
    var streetNameFromGoogle = request.params.name;
    var streetsNames = Object.keys(allStreets);
    var shortStreetsNames = Object.keys(allShortStreetNames);
    var index;
    var similarWords = [];
    if (streetNameFromGoogle.length < 2) {
        response.send("");
    }
    else if (allShortStreetNames.hasOwnProperty(streetNameFromGoogle)) {
        response.send(fileParser.getStreetValue(allShortStreetNames[streetNameFromGoogle]));
    } else {
        if (allStreets.hasOwnProperty(streetNameFromGoogle)) {
            response.send(fileParser.getStreetValue(streetNameFromGoogle));
        } else {
            for (i = 0; i < streetsNames.length; i++) {
                index = streetsNames[i].indexOf(streetNameFromGoogle);
                if (index !== -1) {
                    if (shortStreetsNames[i] === undefined) {
                        continue;
                    }
                    response.send(fileParser.getStreetValue(streetsNames[i]));
                    break;
                }
            }
            for (i = 0; i < streetsNames.length; i++) {
                if (shortStreetsNames[i] === undefined) {
                    continue;
                }
                var distance = levenshteinDistanceAlgo.levenshteinDistance(shortStreetsNames[i], streetNameFromGoogle);
                if ((streetNameFromGoogle.length) === 2) {
                    if (distance < 2) {
                        similarWords.push(shortStreetsNames[i]);
                    }
                } else if ((streetNameFromGoogle.length) === 3) {
                    if (distance < 3) {
                        similarWords.push(shortStreetsNames[i]);
                    }
                } else if (distance < 4) {
                    similarWords.push(shortStreetsNames[i]);
                }
            }
            response.send(fileParser.getStreetValue(allShortStreetNames[similarWords[0]]));
        }
    }
});

app.get('/getGeoFromName/:name', function(request, response) {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?' +
            // the street name you want to search in google places,
            // streetname must be sent as UTF8 in order google servie acccept the request
        'address=' + encodeURIComponent(strTlv + " " + request.params.name) +
            // types - only address result from israel
        '&language=il' +
        '&key='+googleAPI;
    http.get(url, function(res){
        var body = '';
        res.on('data', function(chunk){
            body += chunk;
        });
        res.on('end', function(){
            var geoResponse = '';
            if(body !== ''){
                var googleAnswer = JSON.parse(body);
                if (googleAnswer.status == "OK"){
                    if(googleAnswer.results[0].types == "route"){
                        geoResponse = {lat: googleAnswer.results[0].geometry.location.lat, lng: googleAnswer.results[0].geometry.location.lng};
                    }
                }
                response.send(JSON.stringify(geoResponse));
            }
        });
    }).on('error', function(e){
        // error do noting
    });
});

app.get('/predictions/:prediction',function(request,response){
    if(predictionsCache[request.params.prediction] !== undefined){
        // send cache
        response.send(JSON.stringify(predictionsCache[request.params.prediction]));
    }
    else {
        var url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
                // the street name you want to search in google places,
                // streetname must be sent as UTF8 in order google servie acccept the request
            'input=' + encodeURIComponent(request.params.prediction) +
                // types - only address result from israel
            '&types=address&language=il' +
            '&key=' + googleAPI;
        http.get(url, function (res) {
            var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                if (body !== '') {
                    var filteredPredictionResults = [];
                    var predictionResults = JSON.parse(body);
                    if (predictionResults.status == "OK") {
                        filteredPredictionResults = getStreetFromTlv(predictionResults);
                    }
                    response.send(JSON.stringify(filteredPredictionResults));
                }
            });
        }).on('error', function (e) {
            // error do noting
        });
    }
    function getStreetFromTlv(data){
        var filtered = [];
        data.predictions.forEach(function (result){
            // if the city is tlv aviv
            if (result.terms[1].value == strTlv) {
                // push the street name
                filtered.push(result.terms[0].value);
            }
        });
        // save result to cache
        predictionsCache[request.params.prediction] = filtered;
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