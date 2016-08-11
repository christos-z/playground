/**
 * Created by Christos on 11/08/2016.
 */
module.exports = function (Router){

    Router.get('/', function () {
        console.log('loaded root');
        this.body = 'this is the homepage';
    });

};