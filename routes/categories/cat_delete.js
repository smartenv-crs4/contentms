var category = require('../../schemas/category').category;

/**
 * @api {delete} /categories/:id Delete a category by id
 * @apiGroup Category
 *
 * @apiDescription Removes category information from the list.
 * @apiParam {String} id The id of the category.
 *
 * @apiSuccess (200) {Object} body The Json representing the deleted category.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let id = req.params.id
  category.delete(id)
  .then(del => {
    res.json(del);
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  }); 
}
