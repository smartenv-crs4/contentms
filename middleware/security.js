var authField = require('propertiesmanager').conf.security.decodedTokenFieldName;
var content = require('../schemas/content.js').content;

module.exports = {
  isContentAdmin: (req, res, next) => {
    let uid = req[authField]._id;
    let content_id = req.params.id;

    content.findById(content_id)
    .then(c => {
      if(!uid)
        res.boom.forbidden('User identifier missing')
      else if(uid in c.admins || uid == c.owner)
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
