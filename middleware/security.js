const config = require('propertiesmanager').conf;
const authField = config.decodedTokenFieldName;
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
            return req.app.get("nocheck") ? [] : getSuperusers();
        })
        .then(tokenarray => {
            let isGlobalAdmin = tokenarray.indexOf(req[authField].token.type) != -1;
            if(!uid) res.boom.forbidden('User identifier missing')

            else if((content_data.admins.indexOf(uid) != -1) 
                    || uid == content_data.owner
                    || isGlobalAdmin)
            next();
            else res.boom.forbidden('You are not administrator for this content');
        })
        .catch(e => {
            console.log(e);
            res.boom.forbidden();
        });
    },

    isSuperuser: (req, res, next) => {
        if(req.app.get("nocheck")) next();
        else {
            getSuperusers()
            .then(tokenarray => {            
                let ttype = req[authField].token.type;        
                if(tokenarray.indexOf(ttype) != -1) next();
                else res.boom.forbidden('Only superuser can access this resource');
            })
            .catch(e => {
                console.log(e);
                res.boom.forbidden();
            })
        }
    },

    //check if the user can write a new content
    canWrite: (req, res, next) => {
        if(req.app.get("nocheck")) next();
        else {            
            getSuperusers()
            .then(tokenarray => {                
                let ttype = req[authField].token.type;        
                let isGlobalAdmin = tokenarray.indexOf(ttype) != -1;
                let canWrite = config.contentAdminTokenType.indexOf(ttype) != -1;
                if(canWrite || isGlobalAdmin) {          
                    next();
                }
                else res.boom.forbidden('You are not allowed to write a new content');
            })
            .catch(e => {
                console.log(e);
                res.boom.forbidden();
            });
        }
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

function getSuperusers() {
    return rp({
        uri: config.authUrl + (config.authUrl.endsWith('/') ? '' : '/') + 'tokenactions/getsupeusertokenlist',
        method:"GET",
        headers: {
            Authorization: "Bearer " + config.auth_token
        }
    })
}