var category = require('../../schemas/category').category;

/**
 * @api {get} /categories/ Return the list of available categories
 * @apiGroup Categories
 *
 * @apiSuccess (200) {Object[]} body Array of results representing found activities.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let limit = req.query.limit;
  let skip = req.query.skip;
  let f = (limit && skip) ? category.search(limit, skip) : category.search();
  f.then((result) => {
    res.json(result);
  })
  .catch((e) => { 
    console.log(e);
    if(e.status) res.status(e.status).send(e.error);
    else res.boom.badImplementation();
  });  
}
