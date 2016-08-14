/**
 * Created by Christos on 14/08/2016.
 */
"use strict";

const mongoose = require('mongoose');

//TODO rewrite the to detect if a current connection is already established.
module.exports = function(connectionObject) {
    mongoose.connect(connectionObject.DB);
    return mongoose.model(connectionObject.Table, mongoose.Schema(connectionObject.Schema))
}
