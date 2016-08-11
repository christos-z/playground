/**
 * Created by Christos on 11/08/2016.
 */


module.exports = function(app, Router) {
    app
        .use(Router.routes())
        .listen(3000);
};


