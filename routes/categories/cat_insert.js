var category = require('../../schemas/category').category;
var validator = require('validator');
var config = require('propertiesmanager').conf;
/**
 * @api {post} /categories/ Add one category
 * @apiGroup Categories
 *
 * @apiDescription Insert a new category into the database, a json Object with the category informations must be passed in the body of the request.
 * @apiExample Example: 
 *  {
 *    "name"        : "Hotel",
 *    "description" : "Alberghi e strutture ricettive",
 *    "icon"        : "fa fa-hotel" //css class for graphical purposes on the web
 *  }
 *
 * @apiSuccess (201 - CREATED) {Object} body The Json containing the new activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  if(Object.keys(req.body).length === 0) {
    res.boom.badRequest('empty object');
  }
  else {
    let categoryItem = req.body;
    if(!categoryItem.name || validator.isEmpty(categoryItem.name))
      res.boom.badRequest("missing name field");
    else {
      category.add(categoryItem)
      .then(newcat => {
        res.setHeader("Location",
        config.contentUrl + (config.contentUrl.endsWith('/') ? '' : '/') 
        + '/categories/' + newcat._id);

        res.status(201).json(newcat)
      })
      .catch(e => {
        console.log(e);
        res.boom.badImplementation();
      });
    }
  }
}
