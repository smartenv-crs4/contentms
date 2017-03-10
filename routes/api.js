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

router.get("/", (req, res, next) => {res.json({ms:"CAPORT2020 Contents microservice", version:require('../package.json').version})});

//search su contents e promotions
router.get("/search", security.authWrap, require('./search'));


//contents
router.get("/contents/",        security.authWrap, require('./contents/contents_search'));
router.get("/contents/:id",     security.authWrap, require('./contents/contents_get'));
router.post("/contents/",       security.authWrap, require('./contents/contents_insert'));
router.put("/contents/:id",     security.authWrap, security.isContentAdmin, require('./contents/contents_update'));
router.delete("/contents/:id",  security.authWrap, security.isContentAdmin, require('./contents/contents_delete'));


//content actions
router.post("/contents/:id/actions/addAdmin",       security.authWrap, security.isContentAdmin, require('./contents/contents_actions').addAdmin);
router.post("/contents/:id/actions/removeAdmin",    security.authWrap, security.isContentAdmin, require('./contents/contents_actions').removeAdmin);
router.post("/contents/:id/actions/addCategory",    security.authWrap, security.isContentAdmin, require('./contents/contents_actions').addCategory);
router.post("/contents/:id/actions/removeCategory", security.authWrap, security.isContentAdmin, require('./contents/contents_actions').removeCategory);
router.post("/contents/:id/actions/like",           security.authWrap, require('./contents/contents_actions').like);
router.post("/contents/:id/actions/unlike",         security.authWrap, require('./contents/contents_actions').unlike);
router.post("/contents/:id/actions/likes",          security.authWrap, require('./contents/contents_actions').likes);
router.post("/contents/:id/actions/rate",           security.authWrap, require('./contents/contents_actions').rate);


//promotions
router.get("/contents/:id/promotions/",         security.authWrap, require('./promotions/promo_search'));
router.get("/contents/:id/promotions/:pid",     security.authWrap, require('./promotions/promo_get'));
router.post("/contents/:id/promotions/",        security.authWrap, security.isContentAdmin, require('./promotions/promo_insert'));
router.put("/contents/:id/promotions/:pid",     security.authWrap, security.isContentAdmin, require('./promotions/promo_update'));
router.delete("/contents/:id/promotions/:pid",  security.authWrap, security.isContentAdmin, require('./promotions/promo_delete'));


//promotion actions
router.post("/contents/:id/promotions/:pid/actions/like",           security.authWrap, require('./promotions/promo_actions').like);
router.post("/contents/:id/promotions/:pid/actions/unlike",         security.authWrap, require('./promotions/promo_actions').unlike);
router.post("/contents/:id/promotions/:pid/actions/likes",          security.authWrap, require('./promotions/promo_actions').likes);
router.post("/contents/:id/promotions/:pid/actions/participate",    security.authWrap, require('./promotions/promo_actions').participate);
router.post("/contents/:id/promotions/:pid/actions/unparticipate",  security.authWrap, require('./promotions/promo_actions').unparticipate);
router.post("/contents/:id/promotions/:pid/actions/participants",   security.authWrap, require('./promotions/promo_actions').participants);
router.post("/contents/:id/promotions/:pid/actions/rate",           security.authWrap, require('./promotions/promo_actions').rate);


//categories crud
//TODO deve essere system admin
router.get("/categories/",        security.authWrap, require('./categories/cat_search'));
router.get("/categories/:id",     security.authWrap, require('./categories/cat_get'));
router.post("/categories/",       security.authWrap, require('./categories/cat_insert'));
router.put("/categories/:id",     security.authWrap, require('./categories/cat_update'));
router.delete("/categories/:id",  security.authWrap, require('./categories/cat_delete'));

module.exports = router;
