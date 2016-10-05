var promotion = require('../../schemas/promotion.js').promotion;

module.exports = function(req, res, next) {
  let cid = req.params.id;
  let pid = req.params.pid;
  promotion.findById(cid, pid)
  .then(result => {
    if(result == null || result == undefined || Object.getOwnPropertyNames(result).length === 0)
      res.boom.notFound();
    else 
      res.send(result);
  })
  .catch(e => {
    console.log(e);
    res.boom.badImplementation();
  });
}
