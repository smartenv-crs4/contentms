var content = require('../../schemas/content.js').content;
var authField = require('propertiesmanager').conf.decodedTokenFieldName;
var config = require('propertiesmanager').conf;
var validator = require('validator');

/**
 * @api {post} /contents/ Add one activity to the datastore
 * @apiGroup Contents
 *
 * @apiDescription Insert a new activity into the database, a json Object with the activity field must be passed in the body of the request.
 * @apiExample Example: 
 *  {
 *    "name"        : "il golgo",
 *    "type"        : "insert",
 *    "description" : "description of insertion three",
 *    "published"   : "true",
 *    "town"        : "baunei",
 *    "address"     : "via cagliari, 1",
 *    "category"    : [3,6],
 *    "lat"         : 40.080108,
 *    "lon"         : 9.666168
 *    "vat"         : "123456789ab"
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
    let contentItem = req.body;
    contentItem.owner = req[authField].token._id;
    contentItem.admins = []; //admin gestibile solo tramite actions
    contentItem.published = true; //tutti i contenuti visibili di default lock solo con action
    if(!contentItem.owner) {
      res.boom.forbidden('Invalid user');
    }
    else {
      if(!contentItem.name || validator.isEmpty(contentItem.name))
        res.boom.badRequest("missing name field");
      else if(!contentItem.vat || validator.isEmpty(contentItem.vat))
        res.boom.badRequest("missing vat field");
      else {
        content.add(contentItem)
        .then(newoffer => {
          res.setHeader("Location", 
            config.contentUrl + (config.contentUrl.endsWith("/") ? "":"/") + "contents/" + newoffer._id); 

          res.status(201).json(newoffer)
        })
        .catch(e => {
          console.log(e);
          res.status(e.status||500).send({error:e.error||"server error"});
        });
      }
    }
  }
}
