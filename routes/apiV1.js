var express = require('express');
var config = require('config');
var router = express.Router();
var auth = require('tokenAndAuthorizationManager'); 
var authField = config.security.decodedTokenFieldName;

auth.configure(config.security)

//wrapper for authms middleware
function mid(req, res, next) {
  if(req.app.get("env") === 'dev') { //In dev mode non richiede il ms authms, usa utente fake statico TODO rimuovere
    req[authField] = {};
    req[authField]._id = '5800aa9c25a4441bba494893'; 
    next();
  }
  else auth.checkAuthorization(req, res, next);
}


//contents
router.get("/contents/",        mid, require('./contents/contents_search.js'));
router.get("/contents/:id",     mid, require('./contents/contents_get.js'));
router.post("/contents/",       mid, require('./contents/contents_insert.js'));
router.put("/contents/:id",     mid, require('./contents/contents_update.js'));
router.delete("/contents/:id",  mid, require('./contents/contents_delete.js'));


//promotions
router.get("/contents/:id/promotions/",         mid, require('./promotions/promo_search.js'));
router.get("/contents/:id/promotions/:pid",     mid, require('./promotions/promo_get.js'));
router.post("/contents/:id/promotions/",        mid, require('./promotions/promo_insert.js'));
router.put("/contents/:id/promotions/:pid",     mid, require('./promotions/promo_update.js'));
router.delete("/contents/:id/promotions/:pid",  mid, require('./promotions/promo_delete.js'));


//promotion actions
router.post("/contents/:id/promotions/:pid/actions/like",           mid, require('./promotions/promo_involvement.js').like);
router.post("/contents/:id/promotions/:pid/actions/unlike",         mid, require('./promotions/promo_involvement.js').unlike);
router.post("/contents/:id/promotions/:pid/actions/likes",          mid, require('./promotions/promo_involvement.js').likes);
router.post("/contents/:id/promotions/:pid/actions/participate",    mid, require('./promotions/promo_involvement.js').participate);
router.post("/contents/:id/promotions/:pid/actions/unparticipate",  mid, require('./promotions/promo_involvement.js').unparticipate);
router.post("/contents/:id/promotions/:pid/actions/participants",   mid, require('./promotions/promo_involvement.js').participants);


module.exports = router;
