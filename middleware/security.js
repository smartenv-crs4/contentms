var config = require('config');
var request = require('request-promise');

var security = {
  checkTokenApi: function(req, res, next) {
    var authms = config.get("security").authms;
    var tokenUser  = req.headers.tokenuser;
    var tokenApi   = req.headers.authorization;
    console.log(tokenUser);
    console.log(authms);

    if(!tokenApi || tokenApi.length == 0) {
      var err = new Error("Missing Api Token");
      err.status = 401;
      return next(err);
    }
    tokenApi = tokenApi.replace(/bearer\s+/gi,'');
            
    var opt = {
      method:"POST",
      uri:authms,
      json:true,
      body: {
        access_token:config.get("security").key, 
        decode_token:tokenUser
      }
    }

    request(opt)
    .then(b => {
      if(!b.valid) {
        var err = new Error('Invalid token');
        err.status = 401;
        next(err);
      }
      else(next());
    })
    .catch(e => {
      next(e); 
    })
  }
}

module.exports = security;
