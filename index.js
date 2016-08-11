/**
 * Created by Christos on 11/08/2016.
 */
var app = require('koa')();
var Router = require('koa-router')();

require('./routes')(Router);

require('./server')(app, Router);