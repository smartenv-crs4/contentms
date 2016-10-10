var content = require('../../schemas/content.js').content;

/**
 * @api {put} /contents/:id Update one activity 
 * @apiGroup Contents
 *
 * @apiDescription Updates activity information, only the fields present in the request json body are updated.
 * @apiParam {String} id The id of the activity.
 * @apiExample Example: 
 *  //Updates only description and position fields
 *  {
 *    "description" : "description update for this activity",
 *    "position"    : [9.666168, 40.080108]
 *  }
 *
 * @apiSuccess (200) {Object} body The Json representing the updated activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let id = req.params.id
  content.update(id, req.body)
  .then(up => {
    res.setHeader("Location", req.header.host + "/api/v1/contents/"+up._id); //WARNING, alcuni browser potrebbero non mettere la porta in req.headers.host
    res.json(up)
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  });  
}
