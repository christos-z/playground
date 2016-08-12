var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/stations');
var stationSchema = mongoose.Schema({});


var ListOfStations = mongoose.model('list_of_stations', stationSchema);

function * loopThroughListOfStations(listOfStations, mainStationIndex) {
    for (var StationInformation of listOfStations){
        yield StationInformation;
    }
    if(mainStationIndex in listOfStations){
        mainStationIndex++;
        yield* loopThroughListOfStations(listOfStations, mainStationIndex);

    }
}

function returnStation(StationInformation){

}
ListOfStations.find({}, function (err, listOfStations) {
        var stationLoop = loopThroughListOfStations;
        for (var n of stationLoop(listOfStations, 0) ) {
            console.log(n);
        }
    }
);


