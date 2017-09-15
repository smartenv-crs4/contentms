var content = require('../schemas/content.js').content;
var promo = require('../schemas/promotion.js').promotion;
var common = require('../lib/common.js');

/**
 * @api {get} /search Search for activities, contents and promotions on the portal
 * @apiGroup Search
 * @apiDescription Parametric search over contents on the portal, including category, distance and full text
 *
 * @apiParam {String} [text] Text to search for in the description and name fields.
 * @apiParam {String} [type] The type of activity.
 * @apiParam {String} [town] The town of the activity.
 * @apiParam {String} [by_uid] The Admin user unique ID.
 * @apiParam {Number} [category] The category id, based on those present in categories.
 * @apiParam {Number[]} [position] Three element array: lon, lat, distance. Keep the order.
 *
 * @apiSuccess (200) {Object[]} body Array of results representing found activities.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let allowed_keys = ["type", "category", "town", "position", "text", "sdate", "edate", "mds", "mde"];
  let one_instance_keys = ["position", "edate", "sdate", "mds", "mde"]; //viene considerata solo la prima occorrenza nel url
  let filter = {};
  let limit = req.query.limit;
  let skip  = req.query.skip;
  let type = req.query.t;

  common.allowedKeys(allowed_keys, one_instance_keys, filter, req.query);

  let requiredFields = ['name','description','category', 'lastUpdate', 'creationDate']; //field richiesti in output dalla query
  if(type == "promo" || type == "content") {
    let pexe = (type == "promo") ? promo : content;
    if(type=='promo') {
      requiredFields.push('idcontent');
      requiredFields.push('town');
      requiredFields.push('startDate');
      requiredFields.push('endDate');
      requiredFields.push('images');
    }

    pexe.findFiltered(filter, limit, skip, requiredFields)
      .then(result => {
        result.images = common.uniformImages(result.images);
        res.json(result);
      })
      .catch(e => {
        console.log(e);
        res.boom.badImplementation();
      });
  }
  else {
    Promise.all([
      content.findFiltered(filter, limit, skip, requiredFields),
      promo.findFiltered(filter, limit, skip, requiredFields)
    ])
    .then(result => {
      result[0].images = common.uniformImages(result[0].images);
      result[1].images = common.uniformImages(result[1].images);
      let wholeresult = {
        contents:result[0].contents,
        promos:result[1].promos,
        metadata:result[0].metadata
      }
      res.json(wholeresult);
    })
    .catch(e => {
      console.log(e);
      res.boom.badImplementation();
    });
  }

}
