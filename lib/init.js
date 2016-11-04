
/**
 * Module dependencies.
 */

var app   = require('../app');
var debug = require('debug')('contents-ms:server');
var http  = require('http');
var db    = require('../lib/db');

/**
 * Get port from environment and store in Express.
 */

var port = undefined;
var server = undefined;

var init = {

  start : (cb) => {
    port = normalizePort(process.env.PORT || '3000');
    app.set('port', port);

    server = http.createServer(app);
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    try {
      db.connect(() => {
        if(cb) cb(port);
      });
    }
    catch(e) {
      console.log('FATAL: db connection failed');
      console.log(e);
      process.exit();
    }
  },

  stop: (cb) => {
    server.close(cb);
  }
}


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

module.exports = exports = init;