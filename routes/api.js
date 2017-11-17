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

//search su contents e promotions (auth??????)
router.get("/search", require('./search'));

//opendata api (auth??????)
router.get("/od", require('./od'));


//contents
router.get("/contents/",        require('./contents/contents_search'));
router.get("/contents/:id",     require('./contents/contents_get'));
router.post("/contents/",       security.authWrap, security.canWrite,       require('./contents/contents_insert'));
router.put("/contents/:id",     security.authWrap, security.isContentAdmin, require('./contents/contents_update'));
router.delete("/contents/:id",  security.authWrap, security.isContentAdmin, require('./contents/contents_delete'));


//content actions
router.post("/contents/:id/actions/addAdmin",       security.authWrap, security.isContentAdmin, require('./contents/contents_actions').addAdmin);
router.post("/contents/:id/actions/removeAdmin",    security.authWrap, security.isContentAdmin, require('./contents/contents_actions').removeAdmin);
router.post("/contents/:id/actions/addCategory",    security.authWrap, security.isContentAdmin, require('./contents/contents_actions').addCategory);
router.post("/contents/:id/actions/removeCategory", security.authWrap, security.isContentAdmin, require('./contents/contents_actions').removeCategory);
router.post("/contents/:id/actions/like",           security.authWrap, require('./contents/contents_actions').like);
router.post("/contents/:id/actions/doilike",        security.authWrap, require('./contents/contents_actions').doilike);
router.post("/contents/:id/actions/unlike",         security.authWrap, require('./contents/contents_actions').unlike);
router.post("/contents/:id/actions/likes",          require('./contents/contents_actions').likes);
router.post("/contents/:id/actions/rate",           security.authWrap, require('./contents/contents_actions').rate);


//promotions
router.get("/contents/:id/promotions/",         require('./promotions/promo_search'));
router.get("/contents/:id/promotions/:pid",     require('./promotions/promo_get'));
router.post("/contents/:id/promotions/",        security.authWrap, security.isContentAdmin, require('./promotions/promo_insert'));
router.put("/contents/:id/promotions/:pid",     security.authWrap, security.isContentAdmin, require('./promotions/promo_update'));
router.delete("/contents/:id/promotions/:pid",  security.authWrap, security.isContentAdmin, require('./promotions/promo_delete')); 

//promotion actions
router.post("/contents/:id/promotions/:pid/actions/like",           security.authWrap, require('./promotions/promo_actions').like);
router.post("/contents/:id/promotions/:pid/actions/doilike",        security.authWrap, require('./promotions/promo_actions').doilike);
router.post("/contents/:id/promotions/:pid/actions/unlike",         security.authWrap, require('./promotions/promo_actions').unlike);
router.post("/contents/:id/promotions/:pid/actions/likes",          require('./promotions/promo_actions').likes);
router.post("/contents/:id/promotions/:pid/actions/participate",    security.authWrap, require('./promotions/promo_actions').participate);
router.post("/contents/:id/promotions/:pid/actions/doiparticipate", security.authWrap, require('./promotions/promo_actions').doiparticipate);
router.post("/contents/:id/promotions/:pid/actions/unparticipate",  security.authWrap, require('./promotions/promo_actions').unparticipate);
router.post("/contents/:id/promotions/:pid/actions/participants",   require('./promotions/promo_actions').participants);
router.post("/contents/:id/promotions/:pid/actions/rate",           security.authWrap, require('./promotions/promo_actions').rate);


//categories crud
router.get("/categories/",        require('./categories/cat_search'));
router.get("/categories/:id",     require('./categories/cat_get'));

//TODO deve essere system admin
router.post("/categories/",       security.authWrap, require('./categories/cat_insert'));
router.put("/categories/:id",     security.authWrap, require('./categories/cat_update'));
router.delete("/categories/:id",  security.authWrap, require('./categories/cat_delete'));

//promotype crud
router.get("/promotype/",        require('./promotype/promotype').search);
router.get("/promotype/:id",     require('./promotype/promotype').get);
router.post("/promotype/",       security.authWrap, require('./promotype/promotype').insert);
router.put("/promotype/:id",     security.authWrap, require('./promotype/promotype').update);
router.delete("/promotype/:id",  security.authWrap, require('./promotype/promotype').delete);


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
