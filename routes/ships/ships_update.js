var ships = require('../../schemas/ships').ship;

/**
 * @api {put} /ships/:id/ Update ship schedule by id 
 * @apiGroup Ships
 *
 * @apiDescription Updates ship information, only the fields present in the request json body are updated.
 * @apiParam {String} id The id of the ship shedule.
 *
 * @apiSuccess (200) {Object} body The Json representing the updated ship schedule.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let id = req.params.id
  ships.update(id, req.body)
  .then(up => {
    res.setHeader("Location", req.headers.host + "/api/v1/ships/" + up._id); //WARNING alcuni browser potrebbero non mettere la porta in req.headers.host
    res.json(up)
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  });  
}
