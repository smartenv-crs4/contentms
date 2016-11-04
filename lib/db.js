var mongoose = require('mongoose');
var config = require('propertiesmanager').conf;


module.exports = {
  connect : function(cb){
    if(mongoose.connection.readyState == mongoose.STATES.disconnected) {
      mongoose.Promise = global.Promise;
      mongoose.connect(config.db.connection, function(error) {
        if(error) {
          console.log('FATAL: unable to connect to mongo db:');
          console.log(error);
          process.exit();
        }
      });
    }
    if(cb) cb();
  }
}
