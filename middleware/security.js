const config = require('propertiesmanager').conf;
const authField = config.decodedTokenFieldName;
const auth = require('tokenmanager');
const rp = require('request-promise');
const common = require('../lib/common');
var content = require('../schemas/content.js').content;

module.exports = {
    //must be called AFTER checkAuthorization if you want the no-check feature
    isContentAdmin: (req, res, next) => {
        if(req.app.get("nocheck")) next();
        else {
            let content_id = req.params.id;
            
            content.findById(content_id)
            .then((c) => {
                return common.isContentAdmin(c, req);
            })
            .then(isAdm => {
                if(isAdm) next();
                else res.boom.forbidden('You are not administrator for this content');
            })
            .catch(e => {
                console.log(e);
                res.boom.forbidden();
            });
        }
    },

    isSuperuser: (req, res, next) => {
        if(req.app.get("nocheck")) next();
        else {
            common.getSuperusers()
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
            common.getSuperusers()
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

    checkAuthorization: (req, res, next) => {
	    if(req.app.get("nocheck")) { //In dev mode non richiede il ms authms, usa utente fake passato da url TODO rimuovere?
	        req[authField] = {token:{}};
	        req[authField].token = {_id:req.query.fakeuid};
	        next();
	    }
	    else auth.checkAuthorization(req, res, next);
	},

	checkTokenAuthorizationOnReq: (req, res, next) => {		
	    if(req.app.get("nocheck")) {
	    	req[authField] = {valid:true};
	    	next();
	    }
	    else auth.checkAuthorizationOnReq(req, res, next);
	}
}

