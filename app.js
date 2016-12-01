var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var request = require('request-promise');
var boom = require('express-boom');

var cors = require('./middleware/cors');
var apiV1 = require('./routes/apiV1');
var config = require('propertiesmanager').conf;

var app = express();

if(app.get('env') != 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(boom());

if (app.get('env') === 'dev' || app.get('env') === 'test' ) {
  app.set('nocheck', true);
  console.log("INFO: Development/test mode, skipping token checks"); 
}

if(config.enableCors === true) {
  console.log("INFO: Enabling cross origin");
  app.use(cors);
}

//routes
app.use('/doc', express.static('doc',{root:'doc'}));
app.use('/', apiV1);

//catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
/*
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
*/
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || err.statusCode || 500).send();
});


module.exports = app;
