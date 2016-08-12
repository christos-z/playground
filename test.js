"use strict";

var
    app = require('koa')(),
    Router  = require('koa-router')();

//Middleware: request logger
function *reqlogger(next){
    console.log('%s - %s %s',new Date().toISOString(), this.req.method, this.req.url);
    console.log(this);
    yield next;
}
app.use(reqlogger);


Router.get('/', function *(){
    console.log('Express-style example');
    this.body = "This is root page ('/')";

});

const publicRouter = Router;

publicRouter.get('/auth/github', function *(){
    console.log("Middleware-style Example");
    this.body = "Authenticate with GitHub OAUTH API (Coming Soon)";
});

app
    .use(Router.routes())
    .use(Router.allowedMethods());
app.use(publicRouter.middleware());

app.use(function *(){
    this.body = 'Hello World';
});

app.listen(3000);

