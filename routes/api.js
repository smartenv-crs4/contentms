var express = require('express');
var config = require('propertiesmanager').conf;
var router = express.Router();
var _=require('underscore');

var security = require('../middleware/security');
var auth = require('tokenmanager'); 
var authField = config.decodedTokenFieldName;

var gwBase=_.isEmpty(config.apiGwAuthBaseUrl) ? "" : config.apiGwAuthBaseUrl;
gwBase=_.isEmpty(config.apiVersion) ? gwBase : gwBase + "/" + config.apiVersion;

auth.configure({
  authorizationMicroserviceUrl:config.authProtocol + "://" + config.authHost + ":" + config.authPort + gwBase + '/tokenactions/checkiftokenisauth',
  decodedTokenFieldName:config.decodedTokenFieldName,
  authorizationMicroserviceToken:config.auth_token
});


//authms middleware wrapper for dev environment (no authms required)
function authWrap(req, res, next) {
  if(req.app.get("nocheck")) { //In dev mode non richiede il ms authms, usa utente fake passato da url TODO rimuovere?
    req[authField] = {};
    req[authField]._id = req.query.fakeuid;
    next();
  }
  else auth.checkAuthorization(req, res, next);
}


router.get("/", (req, res, next) => {res.json({ms:"CAPORT2020 Contents microservice", version:require('../package.json').version})});

//search su contents e promotions
router.get("/search", authWrap, require('./search'));


//contents
router.get("/contents/",        authWrap, require('./contents/contents_search'));
router.get("/contents/:id",     authWrap, require('./contents/contents_get'));
router.post("/contents/",       authWrap, require('./contents/contents_insert'));
router.put("/contents/:id",     authWrap, security.isContentAdmin, require('./contents/contents_update'));
router.delete("/contents/:id",  authWrap, security.isContentAdmin, require('./contents/contents_delete'));


//content actions
router.post("/contents/:id/actions/addAdmin",       authWrap, security.isContentAdmin, require('./contents/contents_actions').addAdmin);
router.post("/contents/:id/actions/removeAdmin",    authWrap, security.isContentAdmin, require('./contents/contents_actions').removeAdmin);
router.post("/contents/:id/actions/addCategory",    authWrap, security.isContentAdmin, require('./contents/contents_actions').addCategory);
router.post("/contents/:id/actions/removeCategory", authWrap, security.isContentAdmin, require('./contents/contents_actions').removeCategory);
router.post("/contents/:id/actions/like",           authWrap, require('./contents/contents_actions').like);
router.post("/contents/:id/actions/unlike",         authWrap, require('./contents/contents_actions').unlike);
router.post("/contents/:id/actions/likes",          authWrap, require('./contents/contents_actions').likes);
router.post("/contents/:id/actions/rate",           authWrap, require('./contents/contents_actions').rate);


//promotions
router.get("/contents/:id/promotions/",         authWrap, require('./promotions/promo_search'));
router.get("/contents/:id/promotions/:pid",     authWrap, require('./promotions/promo_get'));
router.post("/contents/:id/promotions/",        authWrap, security.isContentAdmin, require('./promotions/promo_insert'));
router.put("/contents/:id/promotions/:pid",     authWrap, security.isContentAdmin, require('./promotions/promo_update'));
router.delete("/contents/:id/promotions/:pid",  authWrap, security.isContentAdmin, require('./promotions/promo_delete'));


//promotion actions
router.post("/contents/:id/promotions/:pid/actions/like",           authWrap, require('./promotions/promo_actions').like);
router.post("/contents/:id/promotions/:pid/actions/unlike",         authWrap, require('./promotions/promo_actions').unlike);
router.post("/contents/:id/promotions/:pid/actions/likes",          authWrap, require('./promotions/promo_actions').likes);
router.post("/contents/:id/promotions/:pid/actions/participate",    authWrap, require('./promotions/promo_actions').participate);
router.post("/contents/:id/promotions/:pid/actions/unparticipate",  authWrap, require('./promotions/promo_actions').unparticipate);
router.post("/contents/:id/promotions/:pid/actions/participants",   authWrap, require('./promotions/promo_actions').participants);
router.post("/contents/:id/promotions/:pid/actions/rate",           authWrap, require('./promotions/promo_actions').rate);


//categories crud
//TODO deve essere system admin
router.get("/categories/",        authWrap, require('./categories/cat_search'));
router.get("/categories/:id",     authWrap, require('./categories/cat_get'));
router.post("/categories/",       authWrap, require('./categories/cat_insert'));
router.put("/categories/:id",     authWrap, require('./categories/cat_update'));
router.delete("/categories/:id",  authWrap, require('./categories/cat_delete'));

module.exports = router;
