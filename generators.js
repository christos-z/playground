var suspend = require('suspend'),
    resume = suspend.resume;


suspend.run(function*() {
    console.log('asdasd')
    var data = yield 'a';
    console.log(data);
});