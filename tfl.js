"use strict";

//Load wrappers and libraries
const co = require("co");
const mongoose = require('mongoose');
const _ = require('lodash');

const apiRequest = require('./api');
const JourneyObject = require('./models/JourneyObject');
const tflApiUrl = `https://api.tfl.gov.uk/journey/journeyresults/`;

//Connect to stations database
const StationsDB = {
    DB: 'mongodb://localhost/stations',
    Table: 'list_of_stations',
    Schema: {
        'ICS Code': String,
        'Journeys' : Array,
        'notes' :  String
    }

};

//retrieve list of stations from mongo db
const stations = require('./mongoConnection')(StationsDB);

stations.find({}, function (err, listOfStations) {

        for (let station of loopThroughListOfStations(listOfStations, 0) ) {

            let from = station[0]['ICS Code'];
            let to = station[1]['ICS Code'];

            let params = {requestUrl : `${tflApiUrl}${from}/to/${to}`};

            co(function * () {
                try {

                    let tflApiResponse = yield apiRequest(params);
                    var parsedTflApiResponse = JSON.parse(tflApiResponse.body);
                    var shortestJourney = _.minBy(parsedTflApiResponse.journeys, function(o) { return o.duration; });

                    var journeyObject = new JourneyObject(shortestJourney);
                    stations.update({_id : station[0]._id},{ 'Journeys' : journeyObject}, function(err,affected) {
                        console.log(affected);
                    });

                }
                catch (e) {
                    console.log(e);
                }
            });
        }
    }
);

//todo fix this. (remove the 5 limiter)
function * loopThroughListOfStations(listOfStations, mainStationIndex) {
    for (var stationIndex in listOfStations){
        if(stationIndex == mainStationIndex){
            continue;
        }
        yield [listOfStations[mainStationIndex], listOfStations[stationIndex]];

    }
    if(mainStationIndex in listOfStations){
        mainStationIndex++;
        //if the index is undefined, it means we've run through all the stations and should just simply return;
        if (listOfStations[mainStationIndex] == null) {
            return;
        }
        yield* loopThroughListOfStations(listOfStations, mainStationIndex);
    }
}