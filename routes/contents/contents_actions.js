const content = require('../../schemas/content').content;
const involvements  = require('../../schemas/involvement').involvement;
const authField = require('propertiesmanager').conf.decodedTokenFieldName;
const validator = require('validator');

function involve(req, res, type) {
  let uid = req[authField].token._id
  if(!uid) {res.boom.badRequest('Missing user id');}
  else {
    involvements.add(req.params.id, uid, type)
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

function involved(req, res, type) {
  let uid = req[authField].token._id;
  if(!uid) {res.boom.badRequest('Missing user id');}
  else {
    involvements.exists(req.params.id, uid, type)
    .then(isInvolved => {
      let r = {};
      r[type] = isInvolved;
      res.json(r)
    })
    .catch(e => {
      res.boom.badImplementation();
    })
  }
}

function uninvolve(req, res, type) {
  let uid = req[authField].token._id
  if(!uid) {res.boom.badRequest('Missing user id');}
  else {
    involvements.delete(req.params.id, uid, type)
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
  let id = req.params.id;
  involvements.countByType(id, type)
  .then((c) => {res.json({"id":id, "total":c, "type":type})})
  .catch((e) => {
    console.log(e)
    res.boom.badImplementation();
  })
}

//aggregate common operations in one place
function actionWrap(f, res) {
  f
    .then(r => {res.json(r);})
    .catch(e => {
      if(e.status === 400) res.boom.badRequest(e.error);
      else res.boom.badImplementation();
    });
}


module.exports = {
/**
 * @api {POST} /contents/:id/actions/like Add one like to the content
 * @apiGroup Content
 *
 * @apiDescription Adds one user like to the content.
 * @apiParam {String} id The id of the related content.
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
 * @api {POST} /contents/:id/actions/doilike Check if the user likes the content
 * @apiGroup Content
 *
 * @apiDescription Check if the user likes the content.
 * @apiParam {String} id The id of the content.
 *
 * @apiSuccess (200) {Object} body A success json message.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
doilike : (req, res, next) => {
  involved(req, res, 'like')
},

/**
 * @api {POST} /contents/:id/actions/unlike Remove a like from the content
 * @apiGroup Content
 *
 * @apiDescription Removes the user like from the content
 * @apiParam {String} id The id of the related content.
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
 * @api {POST} /contents/:id/actions/likes Count the number of likes
 * @apiGroup Content
 *
 * @apiDescription Returns the total count of likes for the content
 * @apiParam {String} id The id of the related content.
 *
 * @apiSuccess (200) {Object} body Count information:
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "id": "57d0396d5ea81b820f36e41b",
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
 * @api {POST} /contents/:id/actions/rate updates the user rate for the content
 * @apiGroup Content
 *
 * @apiDescription Adds one user like to the content.
 * @apiParam {String} id The id of the related content.
 * @apiParam {Number} the rating value between 1 and 5.
 *
 * @apiSuccess (200) {Object} body A success json message.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  rate : (req, res, next) => {
    let uid = req[authField].token._id
    if(!uid) {res.boom.badRequest('Missing user id');}
    else {
      let rate = req.params.rate;
      if(rate == undefined || !validator.isInt(rate, { min: 1, max: 5 })) {
        res.boom.badRequest("invalid rating value (min 1 max 5)");
        return;
      }
      else {
        involvements.rate(req.params.id, uid, rate)
        .then((r) => {res.json(r)})
        .catch((e) => {
          console.log(e);
          res.boom.badImplementation(e.error);
        });
      }
    }
  },

/**
 * @api {POST} /contents/:id/actions/addAdmin Add a new admin to the content
 * @apiGroup Content
 *
 * @apiDescription Add a new administrator to the list of this content.
 * @apiParam {String} id The id of the related content.
 * @apiParam {String} body.userId The id of the user.
 *
 * @apiSuccess (200) {Object} body Json object with the updated admin list for the content.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  addAdmin: (req, res, next) => {
    let uid = req.body.userId;
    actionWrap(content.addAdmin(req.params.id, [uid]), res);
  },


/**
 * @api {POST} /contents/:id/actions/addAdmin Remove a content admin
 * @apiGroup Content
 *
 * @apiDescription Remove an existing administrator from the list of this content.
 * @apiParam {String} id The id of the related content.
 * @apiParam {String} body.userId The id of the user.
 *
 * @apiSuccess (200) {Object} body Json object: { admins: [updated admin list for the content], _id:"ObjectId of the removed admin" }.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  removeAdmin: (req, res, next) => {
    let uid = req.body.userId;
    actionWrap(content.removeAdmin(req.params.id, [uid]), res);
  },


/**
 * @api {POST} /contents/:id/actions/addCategory Assign a new category to the content
 * @apiGroup Content
 *
 * @apiDescription Add a new category to the category list of this content.
 * @apiParam {String} id The id of the related content.
 * @apiParam {Number} body.categoryId The category id.
 *
 * @apiSuccess (200) {Object} body Json object with the updated category list of the content.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  addCategory: (req, res, next) => {
    var catId = req.body.categoryId;
    if(Number.isInteger(catId)) {
      actionWrap(content.addCategory(req.params.id, [catId]), res);
    }
    else res.boom.badRequest('Invalid category format');
  },


/**
 * @api {POST} /contents/:id/actions/removeCategory Remove a category from the content
 * @apiGroup Content
 *
 * @apiDescription Remove a category from the category list of this content.
 * @apiParam {String} id The id of the related content.
 * @apiParam {Number} body.categoryId The category id.
 *
 * @apiSuccess (200) {Object} body Json object with the updated category list of the content.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
  removeCategory: (req, res, next) => {
    var catId = req.body.categoryId;
    if(Number.isInteger(catId)) {
      actionWrap(content.removeCategory(req.params.id, [catId]), res);
    }
    else res.boom.badRequest('Invalid category format');
  }
}
