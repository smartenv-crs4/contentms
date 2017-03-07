var promotion = require('../../schemas/promotion.js').promotion;
var common = require('../../lib/common.js');

/**
 * @api {get} /contents/:id/promotions/ Search for promotions on the portal 
 * @apiGroup Promotion
 * @apiDescription Parametric search over promotions, including date range, distance and full text
 *
 * @apiParam {String} [text] Text to search for in the description and name fields.
 * @apiParam {String} [type] The type of the promotion (offer, event).
 * @apiParam {Number[]} [position] Three element array: lon, lat, distance. Keep the order.
 * @apiParam {Date} [sdate] Search for promotions available after this date.
 * @apiParam {Date} [edate] Search for promotions available until this date.
 *
 * @apiSuccess (200) {Object[]} body Array of results representing found promotions.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let allowed_keys = ["type", "position", "sdate", "edate", "text"];
  let one_instance_keys = ["sdate", "edate", "position"]; //viene considerata solo la prima occorrenza nel url
  let filter = {};
  let limit = req.query.limit;
  let skip = req.query.skip;
  filter['idcontent'] = req.params.id;

  common.allowedKeys(allowed_keys, one_instance_keys, filter, req.query);

  promotion.findFiltered(filter, limit, skip)
  .then(result => {
    result.images = common.uniformImages(result.images);
    res.json(result);
  })
  .catch(e => { 
    console.log(e);
    if(e.status == 400)
      res.boom.badRequest(e.error);
    else 
      res.boom.badImplementation();
  });
}
