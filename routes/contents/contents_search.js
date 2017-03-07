var content = require('../../schemas/content.js').content;
var common = require('../../lib/common.js');

/**
 * @api {get} /contents/ Search for activities on the portal 
 * @apiGroup Contents
 * @apiDescription Parametric search over activities, including category, distance and full text
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
  let allowed_keys = ["type", "category", "town", "position", "by_uid", "text"];
  let one_instance_keys = ["position"]; //viene considerata solo la prima occorrenza nel url
  let filter = {};
  let limit = req.query.limit;
  let skip = req.query.skip;
  allowed_keys.forEach((key) => {
    let value = req.query[key];
    if(value != undefined) {
      if(Array.isArray(value)) {
        for(let el in value) {
          let varr = value[el].split(",");
          if(filter[key] == undefined) filter[key] = varr;
          else if(one_instance_keys.indexOf(key) == -1) filter[key] = filter[key].concat(varr);
        }
      }
      else filter[key] = value.split(",");
    }
  });

  content.findFiltered(filter, limit, skip)
  .then(result => {
    result.images = common.uniform(result.images);
    res.json(result);
  })
  .catch(e => { 
    console.log(e);
    res.boom.badImplementation();
  });  
}
