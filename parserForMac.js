var hashStreets = [];
var streetNamesArray = [];
var streetDelimiter = "\r\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\r\n";
var endOfLine = require('os').EOL;
var streetDelimiter = "\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n";

function startToParse(){

    var fs = require('fs');

    fs.readdir('./streets/',function (err, filesNames) {

        filesNames.forEach(function(fileName){

            fs.readFile('./streets/'+fileName, 'utf8', function (err,data) {
                if (err) {
                    return '';
                }
                else{
                    addToHash(prepareRawDataToJson(data));
                }
            });
        });
    });
}


function prepareRawDataToJson(filedata){

    var page = /\n \n(\d\d?\n.*\n|.*\n\d\d?\n)/ig;
    var newStreet = /\n\(\d\d?\d?\)\n/ig;
    var info = /\n \n([^@]*\n)*/ig;
    var wrongYear = /\(-\d\d\d\d\)|\(-\d\d\d\d~\)/ig;


    var remomvePages =  filedata.replace(page, endOfLine);
    var streetSplit = remomvePages.replace(newStreet, streetDelimiter);
    var str = streetSplit.replace(info, endOfLine);
    str = str.replace(wrongYear, "").trim();

    return str;
}

function addToHash(parseData){

    var currentStreet;
    var fullStreetName;
    var streetInfo;
    var partialStreetName = [];

    var allStreets = parseData.split(streetDelimiter);

    allStreets.forEach(function(street){

        currentStreet = new Object();

        fullStreetName = street.slice(0,street.indexOf('\r\n')).trim();
        fullStreetName = street.slice(0,street.indexOf(endOfLine)).trim();

        streetInfo = street.slice(street.indexOf(endOfLine),street.length);
        streetInfo = streetInfo.replace(/(\r\n|\n|\r)/g," ").trim();

        partialStreetName = fullStreetName.split(",");
        partialStreetName = partialStreetName[0].trim();
        streetNamesArray[partialStreetName] = fullStreetName;

        hashStreets[fullStreetName] = streetInfo;
    });
}

module.exports = {

    startToParse: function() {
        return startToParse()
    },

    getStreetValue: function(streetName){
        return hashStreets[streetName];
    },

    getAllStreets: function(){
        return hashStreets;
    },

    getStreetNamesArray: function(){
        return streetNamesArray;
    }
};