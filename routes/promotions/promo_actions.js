var authField     = require('propertiesmanager').conf.decodedTokenFieldName;
var involvements  = require('../../schemas/involvement').involvement;


function involve(req, res, type) {
  let uid = req[authField]._id
  if(!uid) {res.boom.badRequest('Missing user id');}
  else {
    involvements.add(req.params.pid, uid, type)
    .then((r) => {res.json(r)})
    .catch((e) => {
      if(e.status === 409)
        res.boom.conflict(e.error);
      else {
        console.log(e);
        res.boom.badImplementation(e.error);
      }
    });
  }
}


function uninvolve(req, res, type) {
  let uid = req[authField]._id
  if(!uid) {res.boom.badRequest('Missing user id');}
  else {
    involvements.delete(req.params.pid, uid, type)
    .then((r) => {res.json(r)})
    .catch((e) => {
      console.log(e)
      switch(e.status) {
        case 404: 
          res.boom.notFound();
          break;
        default:
          res.boom.badImplementation(e.error);
          break;
      }
    });
  }
}


function count(req, res, type) {
  let pid = req.params.pid;
  involvements.countByType(pid, type)
  .then((c) => {res.json({"promo":pid, "total":c, "type":type})})
  .catch((e) => {
    console.log(e)
    res.boom.badImplementation();
  })
}


module.exports = {
/**
 * @api {POST} /contents/:id/promotions/:pid/actions/like Add one like to promotion
 * @apiGroup Promotion
 *
 * @apiDescription Adds one user like to the promotion.
 * @apiParam {String} id The id of the related content.
 * @apiParam {String} pid The id of the promotion.
 *
 * @apiSuccess (200) {Object} body A success json message.
 * @apiError (409) {Object} 409_Conflict duplicated like for the user
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  like : (req, res, next) => {
    involve(req, res, 'like')
  },

/**
 * @api {POST} /contents/:id/promotions/:pid/actions/unlike Remove a like from promotion
 * @apiGroup Promotion
 *
 * @apiDescription Removes the user like from the promotion.
 * @apiParam {String} id The id of the related content.
 * @apiParam {String} pid The id of the promotion.
 *
 * @apiSuccess (200) {Object} body A success json message.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  unlike : (req, res, next) => {
    uninvolve(req, res, 'like');
  },

/**
 * @api {POST} /contents/:id/promotions/:pid/actions/likes Count the number of likes
 * @apiGroup Promotion
 *
 * @apiDescription Returns the total count of likes for the promotion
 * @apiParam {String} id The id of the related content.
 * @apiParam {String} pid The id of the promotion.
 *
 * @apiSuccess (200) {Object} body Count information:
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "promo": "57d0396d5ea81b820f36e41b",
 *       "total": "10",
 *       "type": "like"
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  likes: (req, res, next) => {
    count(req, res, 'like');
  },
  
/**
 * @api {POST} /contents/:id/promotions/:pid/actions/participate User partecipation
 * @apiGroup Promotion
 *
 * @apiDescription Declare that the user will participate to the promotion.
 * @apiParam {String} id The id of the related content.
 * @apiParam {String} pid The id of the promotion.
 *
 * @apiSuccess (200) {Object} body A success json message.
 * @apiError (409) {Object} 409_Conflict duplicated like for the user
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  participate: (req, res, next) => {
    involve(req, res, 'participation');
  },

/**
 * @api {POST} /contents/:id/promotions/:pid/actions/unparticipate Remove the user participation from a promotion
 * @apiGroup Promotion
 *
 * @apiDescription Removes the user participation from the promotion.
 * @apiParam {String} id The id of the related content.
 * @apiParam {String} pid The id of the promotion.
 *
 * @apiSuccess (200) {Object} body A success json message.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  unparticipate: (req, res, next) => {
    uninvolve(req, res, 'participation');
  },
  
/**
 * @api {POST} /contents/:id/promotions/:pid/actions/participants Count the number of participants
 * @apiGroup Promotion
 *
 * @apiDescription Returns the total count of participants for the promotion
 * @apiParam {String} id The id of the related content.
 * @apiParam {String} pid The id of the promotion.
 *
 * @apiSuccess (200) {Object} body Count information:
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "promo": "57d0396d5ea81b820f36e41b",
 *       "total": "10",
 *       "type": "participation"
 *     }
 *
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  participants: (req, res, next) => {
    count(req, res, 'participation');
  }
}
