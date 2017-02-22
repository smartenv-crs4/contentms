var ships = require('../../schemas/ships').ship;

/**
 * @api {get} /ships/:id/ Get ship shedule by id 
 * @apiGroup Ships
 *
 * @apiParam {String} id The id of the ship.
 *
 * @apiSuccess (200) {Object} body Json containing the ship information.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let id = req.params.id;
  ships.get(id)
  .then(result => {
    if(result == null || result == undefined || Object.getOwnPropertyNames(result).length === 0)
      res.boom.notFound();
    else 
      res.json(result);
  })
  .catch(e => {
    console.log(e);
    res.boom.badImplementation();
  });
}
