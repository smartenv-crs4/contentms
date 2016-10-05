var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("Cagliari Port 2020 contents api");
});

module.exports = router;
