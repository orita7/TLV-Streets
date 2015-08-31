var streetDelimiter = "\r\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\r\n";
var fs = require('fs');
var hashStreets = [];



fs.readdir('streets/',function (err, filesNames) {

    filesNames.forEach(function(fileName){

        fs.readFile('streets/'+fileName, 'utf8', function (err,data) {
            console.log(fileName);
            if (err) {
                console.log(err);
                return '';
            }
            else{
                addToHash(prepareRawDataToJson(data));
            }
        });
    });
});

function prepareRawDataToJson(filedata){
    var page = /\r\n \r\n(\d\d?\r\n.*\r\n|.*\r\n\d\d?\r\n)/ig;
    var newStreet = /\r\n\(\d\d?\d?\)\r\n/ig;
    var info = /\r\n \r\n([^@]*\r\n)*/ig;
    var wrongYear = /\(-\d\d\d\d\)|\(-\d\d\d\d~\)/ig;


    var remomvePages =  filedata.replace(page, "\r\n");
    var streetSplit = remomvePages.replace(newStreet, streetDelimiter);
    var str = streetSplit.replace(info,"\r\n");
    str = str.replace(wrongYear, "").trim();

    return str;
}

function addToHash(parseData){
    var currentStreet;
    var streetName;
    var streetInfo;

    var allStreets = parseData.split(streetDelimiter);

    allStreets.forEach(function(street){


        currentStreet = new Object();

        streetName = street.slice(0,street.indexOf('\r\n')).trim();

        streetInfo = street.slice(street.indexOf('\r\n'),street.length);
        streetInfo = streetInfo.replace(/(\r\n|\n|\r)/g," ").trim();

        currentStreet[streetName] = streetInfo;
        hashStreets.push(currentStreet);
    });
}









