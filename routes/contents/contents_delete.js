var content = require('../../schemas/content.js').content;

/**
 * @api {delete} /contents/:id Delete one activity by id
 * @apiGroup Contents
 *
 * @apiDescription Removes activity information from the db.
 * @apiParam {String} id The id of the activity.
 *
 * @apiSuccess (200) {Object} body The Json representing the deleted activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
    let id = req.params.id
    content.delete(id)
    .then(del => {
        res.json(del);
    })
    .catch(e => {    
        console.log(e);
        res.status(e.status||500).send({error:e.error||"server error"});
    }); 
}
