"use strict";

//Load wrappers and libraries
const co = require("co");
const _ = require('lodash');

const apiRequest = require('./api');
const JourneyObject = require('./models/JourneyObject');
const tflApiUrl = `https://api.tfl.gov.uk/journey/journeyresults/`;

const RateLimiter = require('limiter').RateLimiter;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/stations');


//Selects the list_of_stations table from the stations DB.
const Stations = mongoose.model('list_of_stations',  {
    'ICS Code': Number,
    'Journeys' : Object,
    'Notes' :  String
});
//retrieves every single station object stored inside the mongo database.
Stations.find({}, function (err, listOfStations) {
        var tflStations = retrieveStationPairs(0, listOfStations);
        retrieveStationJourneyFromApi(tflStations);
    }
);


//Loops through the list of stations, retrieved from mongo DB and retrieves an array of
//each station together with the main station index. Once all adjoining stations have been retrieved
//for the chosen station index, the station index value is incremented and the function is looped again
//until all stations and adjoining stations are retrieved.

//TODO can this be refactored to not need any param inputs? It seems reduntant to pass through a
//main station index if it's going to be incrementing through all station indexes anyway.
function * retrieveStationPairs(mainStationIndex, listOfStations) {

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
        yield* retrieveStationPairs(mainStationIndex, listOfStations);
    }
}

function retrieveStationJourneyFromApi (tflStations) {
    var station = tflStations.next().value;

    //Throttle the requests to alleviate strain on tfl's API server
    var limiter = new RateLimiter(1, 3000);
    limiter.removeTokens(1, function() {

        let from = station[0]['ICS Code'];
        let to = station[1]['ICS Code'];

        let params = {requestUrl : `${tflApiUrl}${from}/to/${to}`};

        co(function * () {
            try {
                let tflApiResponse = yield apiRequest(params);
                var parsedTflApiResponse = JSON.parse(tflApiResponse.body);
                var shortestJourney = _.minBy(parsedTflApiResponse.journeys, function(o) { return o.duration; });
                var stationToUpdate = yield Stations.findOne({_id : station[0]._id});

                if (!stationToUpdate.Journeys) {
                    stationToUpdate.Journeys = {};
                }

                var journeyObject = new JourneyObject(shortestJourney);

                var icsCode = Object.keys(journeyObject)[0];
                var apiReturnedJourney = {};
                apiReturnedJourney[icsCode] = journeyObject[icsCode];
                stationToUpdate.Journeys = _.merge(apiReturnedJourney, stationToUpdate.Journeys);
                try {
                    //TODO instead of saving/overwriting the DB with the new set of data. We should check to see
                    //if the new set of data has a shorter duration than the exisiting one. And only if it does should we
                    //overwrite
                    yield stationToUpdate.save();
                } catch (e) {
                    console.log(e);
                    //TODO add proper error logging.
                    throw Error('Mongoose couldn\'t save for some reason');
                }

            }
            catch (e) {
                //TODO catch this error properly and do something should this ooccur
                throw Error('Something has gone seriously wrong.');
            }
        });
    });
    if(tflStations.next().done == false){
        limiter.removeTokens(1, function() {
            retrieveStationJourneyFromApi(tflStations);
        });
    }
}