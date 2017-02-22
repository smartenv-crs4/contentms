var ships = require('../../schemas/ships').ship;

/**
 * @api {get} /ships/ Search for ships on the portal 
 * @apiGroup Ships
 * @apiDescription Parametric search for ships information, including date range and ship name
 *
 * @apiParam {String} [ship] the name of the ship.
 * @apiParam {Date} [adate] Search for ships arrived in this date.
 * @apiParam {Date} [ddate] Search for ships in port until this date.
 *
 * @apiSuccess (200) {Object[]} body Array of results representing found ships.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let allowed_keys = ["ship", "adate", "ddate"];
  let filter = {};
  let limit = req.query.limit;
  let skip = req.query.skip;
  allowed_keys.forEach((key) => {
    let value = req.query[key];
    if(value) 
      filter[key] = Array.isArray(value) ? value[0] : value;
  });

  ships.search(filter, limit, skip)
  .then(result => {
    res.json(result);
  })
  .catch(e => { 
    console.log(e);
    if(e.status == 400)
      res.boom.badRequest(e.error);
    else 
      res.boom.badImplementation();
  });
}
