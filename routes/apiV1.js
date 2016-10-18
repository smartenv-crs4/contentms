var express = require('express');
var config = require('config');
var router = express.Router();

var security = require('../middleware/security');
var auth = require('tokenAndAuthorizationManager'); 
var authField = config.security.decodedTokenFieldName;

auth.configure(config.security)

//authms middleware wrapper for dev environment (no authms required)
function authWrap(req, res, next) {
  if(req.app.get("env") === 'dev') { //In dev mode non richiede il ms authms, usa utente fake passato da url TODO rimuovere?
    req[authField] = {};
    req[authField]._id = req.query.fakeuid;
    next();
  }
  else auth.checkAuthorization(req, res, next);
}


//contents
router.get("/contents/",        authWrap, require('./contents/contents_search.js'));
router.get("/contents/:id",     authWrap, require('./contents/contents_get.js'));
router.post("/contents/",       authWrap, require('./contents/contents_insert.js'));
router.put("/contents/:id",     authWrap, security.isContentAdmin, require('./contents/contents_update.js'));
router.delete("/contents/:id",  authWrap, security.isContentAdmin, require('./contents/contents_delete.js'));


//promotions
router.get("/contents/:id/promotions/",         authWrap, require('./promotions/promo_search.js'));
router.get("/contents/:id/promotions/:pid",     authWrap, require('./promotions/promo_get.js'));
router.post("/contents/:id/promotions/",        authWrap, security.isContentAdmin, require('./promotions/promo_insert.js'));
router.put("/contents/:id/promotions/:pid",     authWrap, security.isContentAdmin, require('./promotions/promo_update.js'));
router.delete("/contents/:id/promotions/:pid",  authWrap, security.isContentAdmin, require('./promotions/promo_delete.js'));


//promotion actions
router.post("/contents/:id/promotions/:pid/actions/like",           authWrap, require('./promotions/promo_involvement.js').like);
router.post("/contents/:id/promotions/:pid/actions/unlike",         authWrap, require('./promotions/promo_involvement.js').unlike);
router.post("/contents/:id/promotions/:pid/actions/likes",          authWrap, require('./promotions/promo_involvement.js').likes);
router.post("/contents/:id/promotions/:pid/actions/participate",    authWrap, require('./promotions/promo_involvement.js').participate);
router.post("/contents/:id/promotions/:pid/actions/unparticipate",  authWrap, require('./promotions/promo_involvement.js').unparticipate);
router.post("/contents/:id/promotions/:pid/actions/participants",   authWrap, require('./promotions/promo_involvement.js').participants);


module.exports = router;
