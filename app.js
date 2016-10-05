var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request-promise');
var config = require('config');
var boom = require('express-boom');

var security = require('./middleware/security.js');
var routes = require('./routes/index');
var apiV1 = require('./routes/apiV1');

var app = express();

//TODO spostare
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(config.get("db").connection, function(error) {
  if(error) {
    console.log('FATAL: unable to connect to mongo db:');
    console.log(error);
    process.exit();
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(boom());

//Token check
if (app.get('env') === 'dev') {
  console.log("INFO: Development mode, skipping token checks");
}
else {
  app.use(security.checkTokenApi);
}

app.use('/', routes);
app.use('/doc', express.static('doc',{root:'doc'}));
app.use('/api/v1/', apiV1);

// catch 404 and forward to error handler
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
  res.status(err.status || err.statusCode || 500);
  res.send(err.message);
});


module.exports = app;
