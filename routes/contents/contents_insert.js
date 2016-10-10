var content = require('../../schemas/content.js').content;

/**
 * @api {post} /contents/ Add one activity to the datastore
 * @apiGroup Contents
 *
 * @apiDescription Insert a new activity into the database, a json Object with the activity field must be passed in the body of the request.
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
    let insertion = new content(req.body);

    insertion.save()
    .then(newoffer => {
      res.setHeader("Location", req.headers.host + "/api/v1/contents/" + newoffer._id); //WARNING alcuni browser potrebbero non mettere la porta in req.headers.host
      res.status(201).json(newoffer)
    })
    .catch(e => {
      console.log(e);
      res.boom.badImplementation();
    });
  }
}
