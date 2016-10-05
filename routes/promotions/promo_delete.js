var promotion = require('../../schemas/promotion.js').promotion;

module.exports = function(req, res, next) {
  let cid = req.params.id
  let pid = req.params.pid
  //TODO SEE IF IS ADMIN (middleware ale)
  promotion.delete(cid,pid)
  .then(del => {
    res.json(del);
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  }); 
}
