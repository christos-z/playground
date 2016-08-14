/**
 * Created by Christos on 14/08/2016.
 */
"use strict";

var request = require("co-request");
//TODO rewrite this so we can reuse this with additional params, GET POST etc.
const apiRequest = function* (params) {
    try {

        let result = yield request(params.requestUrl);
        return result
    }
    catch (e) {
        console.log(e);
        return false;
    }
};

module.exports = apiRequest;
