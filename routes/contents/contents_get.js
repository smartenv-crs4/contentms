var content = require('../../schemas/content.js').content;
var common = require('../../lib/common.js');

/**
 * @api {get} /contents/:id Get activity by id 
 * @apiGroup Contents
 *
 * @apiParam {String} id The id of the activity.
 *
 * @apiSuccess (200) {Object} body Json containing the activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  content.findById(req.params.id)
  .then(result => {
    if(result == null || result == undefined || Object.getOwnPropertyNames(result).length === 0)
      res.boom.notFound();
    else { 
      result.images = common.uniform(result.images);
      res.send(result);
    }
  })
  .catch(e => {
    console.log(e);
    res.boom.badImplementation();
  });
}
