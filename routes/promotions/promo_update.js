var promotion = require('../../schemas/promotion.js').promotion;

module.exports = function(req, res, next) {
  let cid = req.params.id
  let pid = req.params.pid
  //TODO SEE IF IS ADMIN (middleware ale)
  promotion.update(cid, pid, req.body)
  .then(up => {
    res.setHeader("Location", "localhost:3010/api/v1/contents/" + up.idcontent 
      + "/promotions/" + up._id);
    res.json(up)
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  });  
}
