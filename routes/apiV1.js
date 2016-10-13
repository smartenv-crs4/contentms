var express = require('express');
var router = express.Router();
var auth = require('tokenAndAuthorizationManager');

auth.configure({ decodedTokenFieldName: "xxx", access_token:"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJtb2RlIjoibXMiLCJpc3MiOiJub3QgdXNlZCBmbyBtcyIsImVtYWlsIjoibm90IHVzZWQgZm8gbXMiLCJ0eXBlIjoidXNlcm1zIiwiZW5hYmxlZCI6dHJ1ZSwiZXhwIjoxNzg5OTk2OTE5MzEyfQ.P78RVNGK9m0pY1nehyDGd8v-q28y_43GMECluzNTbEw",  authoritationMicroserviceUrl:"http://156.148.36.184:3005"});

//contents
//router.get("/contents/",        auth.checkAuthorization, require('./contents/contents_search.js'));
router.get("/contents/",        require('./contents/contents_search.js'));
router.get("/contents/:id",     require('./contents/contents_get.js'));
router.post("/contents/",       require('./contents/contents_insert.js'));
router.put("/contents/:id",     require('./contents/contents_update.js'));
router.delete("/contents/:id",  require('./contents/contents_delete.js'));


//promotions
router.get("/contents/:id/promotions/",         require('./promotions/promo_search.js'));
router.get("/contents/:id/promotions/:pid",     require('./promotions/promo_get.js'));
router.post("/contents/:id/promotions/",        require('./promotions/promo_insert.js'));
router.put("/contents/:id/promotions/:pid",     require('./promotions/promo_update.js'));
router.delete("/contents/:id/promotions/:pid",  require('./promotions/promo_delete.js'));
router.post("/contents/:id/promotions/:pid/actions/like",   require('./promotions/promo_like.js').like);
router.post("/contents/:id/promotions/:pid/actions/unlike", require('./promotions/promo_like.js').unlike);
router.post("/contents/:id/promotions/:pid/actions/count",  require('./promotions/promo_like.js').count);


module.exports = router;
