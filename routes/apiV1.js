var express = require('express');
var router = express.Router();


//contents
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

module.exports = router;
