"use strict";

//Load wrappers and libraries
const co = require("co");
const _ = require('lodash');

const apiRequest = require('./api');
const JourneyObject = require('./models/JourneyObject');
const tflApiUrl = `https://api.tfl.gov.uk/journey/journeyresults/`;


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/workgo');

const TravelModel = mongoose.model('Travels',  {
    '_id': String,
    'stopType': String,
    'stationNaptan': String,
    'naptanId': String,
    'commonName': String,
    'modes' : Array
});

const JourneyModel = mongoose.model('Journeys',  {
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
//
co(function * () {
    try {
        var results = yield TravelModel.find({}).exec();
    } catch(e) {
        throw Error('Unable to retrieve travelObject from DB.');
    }
    return results;

}).then(function (results) {
    const requests = results.map(value => {
        // var from = value._id;
        // results.map(value => {
        //     var to = value._id;
        //     if(from != to)
        //     {
        //
        //         let params = {requestUrl : `${tflApiUrl}${from}/to/${to}`};
        //         console.log(params);
        //
        //         // let tflApiResponse = apiRequest(params);
        //         // var parsedTflApiResponse = JSON.parse(tflApiResponse.body);
        //         // var shortestJourney = _.minBy(parsedTflApiResponse.journeys, function(o) { return o.duration; });
        //     }
        //
        // })
    });
}, function (err) {
    console.error(err.stack);
});
