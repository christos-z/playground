"use strict";

//Load wrappers and libraries
const co = require("co");
const _ = require('lodash');

const apiRequest = require('./api');
const tflApiUrl = `https://api.tfl.gov.uk/StopPoint/Mode/`;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/workgo');

const TravelModel = mongoose.model('Travel',  {
    '_id': String,
    'stopType': String,
    'stationNaptan': String,
    'naptanId': String,
    'commonName': String,
    'modes' : Array
});

co(function * () {
    const params = {requestUrl : `${tflApiUrl}tube`};
    let tflApiResponse;
    let parsedTflApiResponse;

    try {
        tflApiResponse = yield apiRequest(params);
        parsedTflApiResponse = JSON.parse(tflApiResponse.body);
    } catch(e) {
        throw Error('Request failed'); // you can also do custom error for every type of error
    }

    const promises = parsedTflApiResponse.stopPoints.map((value, key) => {
        var travelObject = new TravelModel({
            '_id': value.icsCode,
            'stopType': value.stopType,
            'stationNaptan': value.stationNaptan,
            'naptanId': value.naptanId,
            'commonName': value.commonName,
            'modes' : value.modes
        });

        return travelObject.save();
    });

    const result = yield promises;

    return result;
}).then(function (result) {
    console.log(result);
}, function (err) {
    console.error(err.stack);
});