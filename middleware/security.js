var config = require('config');
var content = require('../schemas/content.js').content;

module.exports = {
  isContentAdmin: (req, res, next) => {
    let authField = config.security.decodedTokenFieldName;
    let uid = req[authField]._id;
    let content_id = req.params.id;

    content.findById(content_id)
    .then(c => {
      if(uid in c.admins || c.owner == uid)
        next();
      else
        res.boom.forbidden('You are not administrator for this content');
    })
    .catch(e => {
      console.log(e);
      res.boom.forbidden();
    });
  }  
}
