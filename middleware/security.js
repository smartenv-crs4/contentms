var authField = require('propertiesmanager').conf.decodedTokenFieldName;
var content = require('../schemas/content.js').content;

module.exports = {
  isContentAdmin: (req, res, next) => {
    let uid = req[authField]._id;
    let content_id = req.params.id;

    content.findById(content_id)
    .then(c => {
      if(!uid)
        res.boom.forbidden('User identifier missing')
      else if((c.admins.indexOf(uid) != -1) || uid == c.owner) 
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
