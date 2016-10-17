var promotion = require('../../schemas/promotion.js').promotion;

/**
 * @api {put} /contents/:id/promotions/:pid Update one promotion by id 
 * @apiGroup Promotion
 *
 * @apiDescription Updates promotion information, only the fields present in the request json body are updated.
 * @apiParam {String} id The id of the promotion.
 * @apiExample Example: 
 *  //Updates only description and position fields
 *  {
 *    "description" : "description update for this event",
 *    "position"    : [9.666168, 40.080108]
 *  }
 *
 * @apiSuccess (200) {Object} body The Json representing the updated promotion.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let cid = req.params.id
  let pid = req.params.pid
  promotion.update(cid, pid, req.body)
  .then(up => {
    res.setHeader("Location", req.headers.host + "/api/v1/contents/" + up.idcontent //WARNING alcuni browser potrebbero non mettere la porta in req.headers.host
      + "/promotions/" + up._id);
    res.json(up)
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  });  
}
