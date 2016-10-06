var promotion = require('../../schemas/promotion.js').promotion;

/**
 * @api {delete} /contents/:id/promotions/:pid Delete one promotion by id
 * @apiGroup Contents
 *
 * @apiDescription Removes promotions information from the db.
 * @apiParam {String} id The id of this promotion.
 *
 * @apiSuccess (200) {Object} body The Json representing the deleted promotion.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let cid = req.params.id
  let pid = req.params.pid
  promotion.delete(cid,pid)
  .then(del => {
    res.json(del);
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  }); 
}
