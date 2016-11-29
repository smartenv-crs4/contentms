var ships = require('../../schemas/ships').ship;

/**
 * @api {post} /ships/ Add a new ship schedule
 * @apiGroup Ships
 *
 * @apiDescription Insert a new ship schedule, a json Object with the ship information fields must be passed in the body of the request.
 * @apiExample Example: 
 *  {
 *     "ship" : "Queen of the seas",
 *     "arrival" : ISODate("2016-09-29T22:00:00.000Z"),
 *     "departure" : ISODate("2016-09-29T22:00:00.000Z"),
 *     "passengers : 2500
 *  }
 *
 * @apiSuccess (201 - CREATED) {Object} body The Json containing the shedule information.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  if(Object.keys(req.body).length === 0) {
    res.boom.badRequest('empty object');
  }
  else {
    let ship = req.body;
    ship.arrival = new Date(req.body.arrival);
    ship.departure = new Date(req.body.departure);

    ships.add(ship)
    .then((newship) => {
      //WARNING alcuni browser potrebbero non mettere la porta in req.headers.host
      res.setHeader("Location", req.headers.host + '/api/v1/ships/' + newship._id);
      res.status(201).json(newship)
    })
    .catch(e => {
      console.log(e);
      res.boom.badImplementation();
    });
  }
}
