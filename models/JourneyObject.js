/**
 * Created by Christos on 14/08/2016.
 */
//TODO improve the structure of this object to allow for better storing inside mongodb
var _ = require('lodash');

module.exports = function (journeyObject) {

    var destinationIcsCode = journeyObject.legs[journeyObject.legs.length - 1].arrivalPoint.icsCode;

    this.journey = {};
    this.journey[destinationIcsCode] = {};
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
