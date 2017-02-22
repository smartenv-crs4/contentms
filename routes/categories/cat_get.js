var category = require('../../schemas/category.js').category;

/**
 * @api {get} /categories/:id Get category by id 
 * @apiGroup Categories
 *
 * @apiParam {String} id The id of the category.
 *
 * @apiSuccess (200) {Object} body Json containing the category.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  category.search(req.params.id)
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
