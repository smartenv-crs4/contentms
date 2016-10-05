var promotion = require('../../schemas/promotion.js').promotion;

module.exports = function(req, res, next) {
  let cid = req.params.id;
  promotion.findFiltered()
  .then(result => {
    res.send(result);
  })
  .catch(e => {
    console.log(e);
    res.boom.badImplementation();
  })
}
