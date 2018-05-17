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
    content.update(id, {published:false}) //lock contenuto per evitare 
    .then(r => {
        if(!r.published)
            return content.delete(id)
        else throw({status:0})
    })
    .then(del => {
        res.json(del);
    })
    .catch(e => {
        if(e.status == '0')
            res.boom.badImplementation("Unable to lock content before deletion");
        else {
            console.log(e);
            res.status(e.status||500).send({error:e.error||"server error"});
        }
    }); 
}
