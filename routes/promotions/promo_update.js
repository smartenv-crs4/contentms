var promotion = require('../../schemas/promotion.js').promotion;
var common = require('../../lib/common.js');
var config = require('propertiesmanager').conf;
/**
 * @api {put} /contents/:id/promotions/:pid Update one promotion by id 
 * @apiGroup Promotion
 *
 * @apiDescription Updates promotion information, only the fields present in the request json body are updated.
 * @apiParam {String} id The id of the promotion.
 * @apiExample Example: 
 *  //Updates only description and position fields
 *  {
 *    "description" : "description update for this event",
 *    "position"    : [9.666168, 40.080108]
 *  }
 *
 * @apiSuccess (200) {Object} body The Json representing the updated promotion.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let cid = req.params.id;
  let pid = req.params.pid;
  let upItem = req.body;
  delete upItem.published //stato published gestito solo tramite action
    
  //update is not allowed for recurrent events, if it happens then the promo exits the batch
  upItem.recurrency_group = null;
  if(upItem.recurrency_type == 0)
    upItem.recurrency_end = null;

  if(upItem.deleteImages) delete upItem.deleteImages; //to avoid deletion of shared images. FIXME: new images wont be deleted neither!!!

  //updated picture so it's the owner !!!works only for single-images promotions!!!
  else if(upItem.images && upItem.images.length == 1)// || upItem.recurrency_type == 0)
    upItem.deleteImages = true;

  promotion.update(cid, pid, upItem)
  .then(up => {
    res.setHeader("Location", 
      config.contentUrl + (config.contentUrl.endsWith('/') ? '' : '/') 
      + '/contents/' + up.idcontent
      + '/promotions/' + up._id);    
    up.images = common.uniformImages(up.images);
    res.json(up)
  })
  .catch(e => {
    console.log(e);
    res.status(e.status||500).send({error:e.error||"server error"});
  });  
}
