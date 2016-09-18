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

const Joruney = mongoose.model('Journeys',  {
    '_id': String,
    'Destination From': String,
    'Destination To': String,
    'ICS Code From': Number,
    'ICS Code To': Number,
    'Duration': Number,
    'Start Date Time': Date,
    'End Date Time': Date,
    'Journey Legs': Object,
    'mode': Object
});

var from = 1000001;
var to = 1000002;

function retrieveStationJourneyFromApi () {

    //Throttle the requests to alleviate strain on tfl's API server
    var limiter = new RateLimiter(1, 1000);
    limiter.removeTokens(1, function() {

        let params = {requestUrl : `${tflApiUrl}${from}/to/${to}`};
        co(function * () {
            try {
                let tflApiResponse = yield apiRequest(params);
                var parsedTflApiResponse = JSON.parse(tflApiResponse.body);
                var shortestJourney = _.minBy(parsedTflApiResponse.journeys, function(o) { return o.duration; });

                var journeyLegs = {};

                _.forEach(shortestJourney.legs, function(value, key) {

                    journeyLegs[key] = {
                        'stationName' : value.departurePoint.commonName,
                        'duration' : value.duration,
                        'summary' : value.instruction.summary,
                        'departureTime' : value.departureTime,
                        'arrivalTime' : value.arrivalTime,
                        'stationArrival' : value.arrivalPoint.commonName,
                        'mode' : {
                            'type' : value.mode.type,
                            'name' : value.mode.name,
                            'id' : value.mode.id
                        }

                    }

                });

                console.log(journeyLegs);
                var destinationFrom = shortestJourney.legs[0].departurePoint.commonName;
                var destinationTo = shortestJourney.legs[shortestJourney.legs.length -1].arrivalPoint.commonName;

                var testStation = new Joruney({
                    '_id' : `${from}/${to}`,
                    'Destination From' : destinationFrom,
                    'Destination To' : destinationTo,
                    'ICS Code From' : from,
                    'ICS Code To' : to,
                    'Duration' : shortestJourney.duration,
                    'Start Date Time' : shortestJourney.departureTime,
                    'End Date Time' : shortestJourney.arrivalTime,
                    'Journey Legs' : journeyLegs
                });

                try {
                    yield testStation.save();
                    console.log(shortestJourney);

                } catch (e)
                {
                    console.log(e);
                    //TODO update if key already exists and new duration is less
                    //TODO add proper error logging.
                    throw Error('Mongoose couldn\'t save for some reason');
                }

            }
            catch (e) {
                //TODO catch this error properly and do something should this occur
                throw Error('Something has gone seriously wrong.');
            }
        });
    });


    limiter.removeTokens(1, function() {
        if(from == 1018000) {
            from = 1000001
            to++;
        }else{
            from++
        }
        if(to !== 1018000) {
            retrieveStationJourneyFromApi();
        }
    });
}

retrieveStationJourneyFromApi();