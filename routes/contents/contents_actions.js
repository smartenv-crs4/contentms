var content = require('../../schemas/content').content;

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
 * @apiSuccess (200) {Object} body Json object with the updated admin list for the content.
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
