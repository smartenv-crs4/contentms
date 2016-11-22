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
  category.search(limit, skip)
  .then(result => {
    res.send(result);
  })
  .catch(e => { 
    console.log(e);
    res.boom.badImplementation();
  });  
}
