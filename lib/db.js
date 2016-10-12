var mongoose = require('mongoose');
var config = require('config');


module.exports = {
  connect : function(){
    if(mongoose.connection.readyState == mongoose.STATES.disconnected) {
      mongoose.Promise = global.Promise;
      mongoose.connect(config.get("db").connection, function(error) {
        if(error) {
          console.log('FATAL: unable to connect to mongo db:');
          console.log(error);
          process.exit();
        }
      });
    }
  }
}
