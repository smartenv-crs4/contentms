const authField = require('propertiesmanager').conf.decodedTokenFieldName;
const auth = require('tokenmanager');
const rp = require('request-promise');
var content = require('../schemas/content.js').content;

module.exports = {
  //must be called AFTER authWrap if you want the no-check feature
  isContentAdmin: (req, res, next) => {
    let uid = req[authField].token._id;
    let content_id = req.params.id;
    let content_data = undefined;
    content.findById(content_id)
    .then((c) => {
      content_data = c;
      return req.app.get("nocheck") ? [] : rp(config.authUrl + (config.authUrl.endsWIth('/') ? '' : '/') + 'tokenactions/getsupeusertokenlist')
    })
    .then(tokenarray => {
      let isGlobalAdmin = tokenarray.indexOf(req[authField].token.type) != -1;
      if(!uid)
        res.boom.forbidden('User identifier missing')
      else if((content_data.admins.indexOf(uid) != -1) 
              || uid == content_data.owner
              || isGlobalAdmin)
        next();
      else
        res.boom.forbidden('You are not administrator for this content');
    })
    .catch(e => {
      console.log(e);
      res.boom.forbidden();
    });
  },

  authWrap : (req, res, next) => {
    if(req.app.get("nocheck")) { //In dev mode non richiede il ms authms, usa utente fake passato da url TODO rimuovere?
        req[authField] = {token:{}};
        req[authField].token._id = req.query.fakeuid;
        next();
    }
    else auth.checkAuthorization(req, res, next);
  }
}
