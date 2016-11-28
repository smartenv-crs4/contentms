var content = require('../../schemas/content.js').content;

/**
 * @api {put} /contents/:id Update one activity 
 * @apiGroup Contents
 *
 * @apiDescription Updates activity information, only the fields present in the request json body are updated.
 * @apiParam {String} id The id of the activity.
 * @apiExample Example: 
 *  //Updates only description field
 *  {
 *    "description" : "description update for this activity",
 *  }
 *
 * @apiSuccess (200) {Object} body The Json representing the updated activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let id = req.params.id
  let upItem = req.body;
  delete upItem.owner; //owner settato da token solo in inserimento
  delete upItem.admins; //admin gestiti solo tramite actions
  content.update(id, upItem)
  .then(up => {
    res.setHeader("Location", req.header.host + "/api/v1/contents/"+up._id); //WARNING, alcuni browser potrebbero non mettere la porta in req.headers.host
    res.json(up)
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  });  
}
