/**
 * Created by Christos on 11/08/2016.
 */
module.exports = function (Router){

    Router.get('/', index);

    function *index() {
        this.body = 'this is the homepage';
    };

};