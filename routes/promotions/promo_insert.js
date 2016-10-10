var promotion = require('../../schemas/promotion.js').promotion;

/**
 * @api {post} /contents/:id/promotions/ Add one promotion to an activity
 * @apiGroup Contents
 *
 * @apiParam {String} [id] The id of the father activity
 * 
 * @apiDescription Insert a new promotion for the specified activity, a json Object with the activity field must be passed in the body of the request.
 * @apiExample Example: 
 *  {
 *    "name"        : "il golgo",
 *    "type"        : "insert",
 *    "description" : "description of insertion three",
 *    "published"   : "true",
 *    "town"        : "baunei",
 *    "address"     : "via cagliari, 1",
 *    "category"    : 3,
 *    "position"    : [9.666168, 40.080108]
 *  }
 *
 * @apiSuccess (201 - CREATED) {Object} body The Json containing the new activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  if(Object.keys(req.body).length === 0) {
    res.boom.badRequest('empty object');
  }
  else {
    let promo = new promotion(req.body);
    promo.idcontent = req.params.id;
    promo.startDate = new Date(req.body.startDate);
    promo.endDate = new Date(req.body.endDate);

    promo.save()
    .then(newpromo => {
      res.setHeader("Location", 
        req.headers.host + '/api/v1/contents/' //WARNING alcuni browser potrebbero non mettere la porta in req.headers.host
        + newpromo.idcontent
        + "/promotions/" + newpromo._id);

      res.status(201).json(newpromo)
    })
    .catch(e => {
      console.log(e);
      res.boom.badImplementation();
    });
  }
}
