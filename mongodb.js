"use strict";

//Load wrappers and libraries
var co = require("co");
var request = require("co-request");
var mongoose = require('mongoose');
var _ = require('lodash')

//Connect to stations database
mongoose.connect('mongodb://localhost/stations');
var stationSchema = mongoose.Schema({'ICS Code': String, 'Journeys' : Array, 'notes' :  String});
var ListOfStations = mongoose.model('list_of_stations', stationSchema);


const tflApiRequest = function* (apiParams) {
    let from = apiParams.from;
    let to = apiParams.to;
    try {

        let result = yield request(`https://api.tfl.gov.uk/journey/journeyresults/${from}/to/${to}`);
        return result
    }
    catch (e) {
        return false;
    }


};

ListOfStations.find({}, function (err, listOfStations) {
        for (let n of loopThroughListOfStations(listOfStations, 0) ) {
            let apiParams = new TflApiObject(n[0]['ICS Code'], n[1]['ICS Code']);

            co(function * () {
                try {
                    // console.log('am I yielding?')
                    const value = yield tflApiRequest(apiParams);
                    // console.log('Yes I am')

                    var tfl = JSON.parse(value.body);
                    var shortestJourney = _.minBy(tfl.journeys, function(o) { return o.duration; });
                    var journeyObject = new JourneyObject(shortestJourney);
                    ListOfStations.update({_id : n[0]._id},{ 'Journeys' : journeyObject}, function(err,affected) {
                        console.log(err);
                        console.log(affected);
                    });

                }
                catch (e) {
                    console.log('failed')
                    console.log(e);
                }
            });
        }
    }
);

//todo fix this. (remove the 5 limiter)
function * loopThroughListOfStations(listOfStations, mainStationIndex) {
    for (var stationIndex in listOfStations){
        if(stationIndex == mainStationIndex || stationIndex > 5){
            continue;
        }
        yield [listOfStations[mainStationIndex], listOfStations[stationIndex]];

    }
    if(mainStationIndex in listOfStations){
        if(mainStationIndex < 5){
            mainStationIndex++;
            yield* loopThroughListOfStations(listOfStations, mainStationIndex);
        }

    }
}

function TflApiObject(from, to) {
    this.from = from;
    this.to = to;
}

function JourneyObject(journeyObject) {

    var destinationIcsCode = journeyObject.legs[journeyObject.legs.length - 1].arrivalPoint.icsCode;

    this.journey = {}
    this.journey[destinationIcsCode] = {}
    this.journey[destinationIcsCode].duration = journeyObject.duration;
    this.journey[destinationIcsCode].startDateTime = journeyObject.startDateTime;
    this.journey[destinationIcsCode].arrivalDateTime = journeyObject.arrivalDateTime;
    this.journey[destinationIcsCode].journeyLegs = {};

    var journeyLegs = {};

    _.forEach(journeyObject.legs, function(value, key) {
        journeyLegs[key] = {
            'stationName' : journeyObject.legs[key].departurePoint.commonName,
            'duration' : journeyObject.legs[key].duration,
            'summary' :journeyObject.legs[key].instruction.summary,
            'departureTime' :journeyObject.legs[key].departureTime,
            'arrivalTime' :journeyObject.legs[key].arrivalTime,
            'stationArrival' :journeyObject.legs[key].arrivalPoint.commonName

        }

    });

    this.journey[destinationIcsCode].journeyLegs = journeyLegs;
}