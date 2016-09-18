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

    let params = {requestUrl : `${tflApiUrl}tube,tflrail,overground,national-rail`};
    // let params = {requestUrl : `${tflApiUrl}tube`};

    try {


        let tflApiResponse = yield apiRequest(params);
        var parsedTflApiResponse = JSON.parse(tflApiResponse.body);

        //rewrite this to use native foreach funciton, so that a
        //travelObject.save method can be yielded instead.
        _.forEach(parsedTflApiResponse.stopPoints, function(value, key) {
            var travelObject = new TravelModel({
                '_id': value.icsCode,
                'stopType': value.stopType,
                'stationNaptan': value.stationNaptan,
                'naptanId': value.naptanId,
                'commonName': value.commonName,
                'modes' : value.modes
            });

            try {
                travelObject.save();

            } catch (e)
            {
                console.log(e);
                //TODO update if key already exists and new duration is less
                //TODO add proper error logging.
                throw Error('Mongoose couldn\'t save for some reason');
            }
    
        });

    
    }
    catch (e) {
        //TODO catch this error properly and do something should this occur
        throw Error('Something has gone seriously wrong.');
    }
});