var express = require('express');
var config = require('propertiesmanager').conf;
var router = express.Router();
var _=require('underscore');

var security = require('../middleware/security');
var auth = require('tokenmanager'); 
var authField = config.decodedTokenFieldName;


auth.configure({
    authorizationMicroserviceUrl:config.authUrl + '/tokenactions/checkiftokenisauth',
    decodedTokenFieldName:config.decodedTokenFieldName,
    authorizationMicroserviceToken:config.auth_token
});

router.get("/", (req, res, next) => {res.json({ms:"CAPORT2020 Contents microservice", version:require('../package.json').version})});

//search su contents e promotions
router.get("/search", require('./search'));

//lista partecipate espressi dall'utente (user id nel token)
router.get("/involvements",  security.checkAuthorization, require('./involvement/involvement').involvements);

//opendata api
router.get("/od", require('./od'));


//contents
router.get("/contents/",        require('./search'));
router.get("/contents/:id",     security.checkTokenAuthorizationOnReq,   require('./contents/contents_get'));
router.post("/contents/",       security.checkAuthorization, security.canWrite,       require('./contents/contents_insert'));
router.put("/contents/:id",     security.checkAuthorization, security.isContentAdmin, require('./contents/contents_update'));
router.delete("/contents/:id",  security.checkAuthorization, security.isContentAdmin, require('./contents/contents_delete'));


//content actions
router.post("/contents/:id/actions/addAdmin",       security.checkAuthorization, security.isContentAdmin, require('./contents/contents_actions').addAdmin);
router.post("/contents/:id/actions/removeAdmin",    security.checkAuthorization, security.isContentAdmin, require('./contents/contents_actions').removeAdmin);
router.post("/contents/:id/actions/addCategory",    security.checkAuthorization, security.isContentAdmin, require('./contents/contents_actions').addCategory);
router.post("/contents/:id/actions/removeCategory", security.checkAuthorization, security.isContentAdmin, require('./contents/contents_actions').removeCategory);
router.post("/contents/:id/actions/like",           security.checkAuthorization, require('./contents/contents_actions').like);
router.post("/contents/:id/actions/doilike",        security.checkAuthorization, require('./contents/contents_actions').doilike);
router.post("/contents/:id/actions/unlike",         security.checkAuthorization, require('./contents/contents_actions').unlike);
router.post("/contents/:id/actions/likes",          require('./contents/contents_actions').likes);
router.post("/contents/:id/actions/rate",           security.checkAuthorization, require('./contents/contents_actions').rate);
router.post("/contents/:id/actions/lock",           security.checkAuthorization, security.isSuperuser, require('./contents/contents_actions').lock);
router.post("/contents/:id/actions/unlock",         security.checkAuthorization, security.isSuperuser, require('./contents/contents_actions').unlock);


//promotions
router.get("/contents/:id/promotions/",         require('./search'));
router.get("/contents/:id/promotions/:pid",     require('./promotions/promo_get'));
router.post("/contents/:id/promotions/",        security.checkAuthorization, security.isContentAdmin, require('./promotions/promo_insert'));
router.put("/contents/:id/promotions/:pid",     security.checkAuthorization, security.isContentAdmin, require('./promotions/promo_update'));
router.delete("/contents/:id/promotions/:pid",  security.checkAuthorization, security.isContentAdmin, require('./promotions/promo_delete')); 
router.get("/contents/:id/promotions/:pid/participants",     security.checkAuthorization, require('./involvement/involvement').participants);

//promotion actions
router.post("/contents/:id/promotions/:pid/actions/like",           security.checkAuthorization, require('./promotions/promo_actions').like);
router.post("/contents/:id/promotions/:pid/actions/doilike",        security.checkAuthorization, require('./promotions/promo_actions').doilike);
router.post("/contents/:id/promotions/:pid/actions/unlike",         security.checkAuthorization, require('./promotions/promo_actions').unlike);
router.post("/contents/:id/promotions/:pid/actions/likes",          require('./promotions/promo_actions').likes);
router.post("/contents/:id/promotions/:pid/actions/participate",    security.checkAuthorization, require('./promotions/promo_actions').participate);
router.post("/contents/:id/promotions/:pid/actions/doiparticipate", security.checkAuthorization, require('./promotions/promo_actions').doiparticipate);
router.post("/contents/:id/promotions/:pid/actions/unparticipate",  security.checkAuthorization, require('./promotions/promo_actions').unparticipate);
router.post("/contents/:id/promotions/:pid/actions/participants",   require('./promotions/promo_actions').participants);
router.post("/contents/:id/promotions/:pid/actions/rate",           security.checkAuthorization, require('./promotions/promo_actions').rate);
router.post("/contents/:id/promotions/:pid/actions/lock",           security.checkAuthorization, security.isSuperuser, require('./promotions/promo_actions').lock);
router.post("/contents/:id/promotions/:pid/actions/unlock",         security.checkAuthorization, security.isSuperuser, require('./promotions/promo_actions').unlock);


//categories crud
router.get("/categories/",        require('./categories/cat_search'));
router.get("/categories/:id",     require('./categories/cat_get'));

//TODO deve essere system admin
router.post("/categories/",       security.checkAuthorization, require('./categories/cat_insert'));
router.put("/categories/:id",     security.checkAuthorization, require('./categories/cat_update'));
router.delete("/categories/:id",  security.checkAuthorization, require('./categories/cat_delete'));

//promotype crud
router.get("/promotype/",        require('./promotype/promotype').search);
router.get("/promotype/:id",     require('./promotype/promotype').get);
router.post("/promotype/",       security.checkAuthorization, require('./promotype/promotype').insert);
router.put("/promotype/:id",     security.checkAuthorization, require('./promotype/promotype').update);
router.delete("/promotype/:id",  security.checkAuthorization, require('./promotype/promotype').delete);


/* GET environment info page. */
router.get('/env', function(req, res) {
    var env;
    if (process.env['NODE_ENV'] === 'dev')
        env='dev';
    else
        env='production';

    res.status(200).send({env:env});
});

module.exports = router;
