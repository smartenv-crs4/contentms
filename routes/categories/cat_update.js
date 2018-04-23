var category = require('../../schemas/category').category;
var config = require('propertiesmanager').conf;
/**
 * @api {put} /categories/:id Update category information 
 * @apiGroup Categories
 *
 * @apiParam {String} id The id of the category.
 * @apiExample Example: 
 *  //Updates only description field
 *  {
 *    "description" : "description update for this category",
 *  }
 *
 * @apiSuccess (200) {Object} body The Json representing the updated category.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let id = req.params.id
  let upItem = req.body;
  category.update(id, upItem)
  .then(up => {
    res.setHeader("Location", 
      config.contentUrl + (config.contentUrl.endsWith('/') ? '' : '/') 
      + '/categories/' + up._id);
    res.json(up)
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  });  
}
