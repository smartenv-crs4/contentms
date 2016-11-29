var ships = require('../../schemas/ships').ship;

/**
 * @api {delete} /ships/:id Delete ship schedule by id
 * @apiGroup Ships
 *
 * @apiDescription Removes ship schedule information from the db.
 * @apiParam {String} id The id of the ship shedule.
 *
 * @apiSuccess (200) {Object} body The Json representing the deleted ship info.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let id = req.params.id
  ships.delete(id)
  .then(del => {
    res.json(del);
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  }); 
}
