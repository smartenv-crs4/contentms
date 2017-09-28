var promotion = require('../../schemas/promotion.js').promotion;

/**
 * @api {post} /contents/:id/promotions/ Add one promotion to an activity
 * @apiGroup Promotion
 *
 * @apiParam {String} [id] The id of the father activity
 * 
 * @apiDescription Insert a new promotion for the specified activity, a json Object with the promotion fields must be passed in the body of the request.
 * @apiExample Example: 
 *  {
 *     "_id" : ObjectId("57eaf812338b185434b97f85"),
 *     "description" : "cena a base di fregola con frutti di mare",
 *     "endDate" : ISODate("2016-09-29T22:00:00.000Z"),
 *     "idcontent" : ObjectId("57d0396d5ea81b820f36e41b"),
 *     "name" : "fregola night",
 *     "position" : [ 
 *         9.666168, 
 *         40.080108
 *     ],
 *     "price" : 25,
 *     "startDate" : ISODate("2016-09-29T22:00:00.000Z"),
 *     "type" : "offer",
 *     "images" : ["0123456789abcdef","http://www.google.it/img.png"]
 *  }
 *
 * @apiSuccess (201 - CREATED) {Object} body The Json containing the new promotion.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  if(Object.keys(req.body).length === 0) {
    res.boom.badRequest('empty object');
  }
  else {
    let promo = req.body;
    promo.idcontent = req.params.id;
    promo.startDate = new Date(req.body.startDate);
    promo.endDate = new Date(req.body.endDate);

    promotion.add(promo)
    .then(newpromo => {
      res.setHeader("Location", 
        req.headers.host + '/api/v1/contents/' //WARNING alcuni browser potrebbero non mettere la porta in req.headers.host
        + newpromo.idcontent
        + "/promotions/" + newpromo._id);

      res.status(201).json(newpromo)
    })
    .catch(e => {
      console.log(e);
      if(e.status && e.status == 400)
        res.boom.badRequest();
      else
        res.boom.badImplementation();
    });
  }
}
