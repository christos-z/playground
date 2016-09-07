"use strict";

//Load wrappers and libraries
const co = require("co");
const _ = require('lodash');

const apiRequest = require('./api');
const JourneyObject = require('./models/JourneyObject');
const tflApiUrl = `https://api.tfl.gov.uk/journey/journeyresults/`;

const RateLimiter = require('limiter').RateLimiter;

//Stations DB connection object.
const StationsDB = {
    DB: 'mongodb://localhost/stations',
    Table: 'list_of_stations',
    Schema: {
        'ICS Code': String,
        'Journeys' : Array,
        'notes' :  String
    }

};


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/stations');

// var Stations = mongoose.model('list_of_stations',  {
//     'ICS Code': Number,
//     'Journeys' : Array,
//     'Notes' :  String
// });
//
// var test = yield Stations.findOne({ 'ICS Code': 1000002 });
// console.log(test);
//
//
// Stations.findOne({ 'ICS Code': 1000002 }).exec()
//     .then(function(station) {
//         console.log(station);
//         //This is where I'd save also
//     })
//     .catch(function(err){
//         // just need one of these
//         console.log('error:', err);
//     });
// // Kitten.find({_id : '1000002'});
//
// // Kitten.findOne({ 'ICS Code': '/^1000002/' }, callback);
//
// Stations.findOne({ 'ICS Code': 1000002 }).exec()
//     .then(function(station) {
//         console.log(station);
//     });
//

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


//Loops through the list of stations, retrived from mongo DB and retrieves an array of
//each station together with the main station index. Once all adjoning stations have been retrieved
//for the choosen station index, the station index value is incremented and the function is looped again
//untill all stations and adjoining stations are retrieved.
function * retrieveStationPairs(mainStationIndex, listOfStations) {
    var stationIndex = 0;
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

    //Throttle the requests to alieviete strain on tfl's API server
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


                // stationToUpdate.Notes = 'changing notes test';
                // console.log(stationToUpdate);
                // stationToUpdate.save();
                // return;
                if (!stationToUpdate.Journeys) {
                    stationToUpdate.Journeys = {};
                }

                var journeyObject = new JourneyObject(shortestJourney);

                // stationToUpdate.Journeys[Object.keys(journeyObject)] = journeyObject;

                var apiReturnedJourney = {};
                apiReturnedJourney[Object.keys(journeyObject)[0]] = journeyObject[Object.keys(journeyObject)[0]];
                stationToUpdate.Journeys = _.merge(apiReturnedJourney, stationToUpdate.Journeys);
                stationToUpdate.save();
                // try {
                //     const savedStation = yield stationToUpdate.save();
                // } catch (e) {
                //     console.log(e);
                //     throw Error('Mongoose couldn\'t save for some reason');
                // }

                // stations.update({_id : station[0]._id},
                //     {
                //         //TODO change this from a push to a proper update with ICS code as a key
                //         $set: {
                //             Journeys : journeyObject
                //         }
                //
                //     },
                //     {
                //         upsert:true,
                //         multi:true
                //     },
                //     function(err,affected) {
                //     console.log(affected);
                // });

            }
            catch (e) {
                //TODO catch this error properly and do something should this ooccur
                //                console.log(e);
            }
        });
    });
    if(tflStations.next().done == false){
        limiter.removeTokens(1, function() {
            retrieveStationJourneyFromApi(tflStations);
            // return;
        });
    }
}