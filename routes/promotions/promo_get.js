var promotion = require('../../schemas/promotion.js').promotion;

/**
 * @api {get} /contents/:id/promotions/:pid Get promotions by id 
 * @apiGroup Promotion
 *
 * @apiParam {String} id The id of the father activity.
 * @apiParam {String} id The id of the promotion.
 *
 * @apiSuccess (200) {Object} body Json containing the activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
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
