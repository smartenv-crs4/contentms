const config = require('propertiesmanager').conf;
const authField = config.decodedTokenFieldName;
const content = require('../../schemas/content.js').content;
const common = require('../../lib/common.js');

/**
 * @api {get} /contents/:id Get activity by id 
 * @apiGroup Contents
 *
 * @apiParam {String} id The id of the activity.
 *
 * @apiSuccess (200) {Object} body Json containing the activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
    content.findById(req.params.id)
    .then(result => {
        if(result == null || result == undefined || Object.getOwnPropertyNames(result).length === 0)
            res.boom.notFound();
        else {
            result.images = common.uniformImages(result.images); //TODO rimuovere, le src delle img vanno ricostruite in UI!

            let isLocked = !result.published;
            if(isLocked) {
                console.log(req[authField])
                console.log("XXXXXX 1")
                if(!req[authField].valid) {//utente non loggato
                    console.log("XXXXXX 2")
                    res.boom.locked();
                }
                else {
                    console.log("XXXXXX 3")
                    common.isContentAdmin(result, req)
                    .then(isAdm => {
                        console.log("XXXXXX 4 " + isAdm)
                        if(isAdm) res.json(result); //utente loggato e admin
                        else res.boom.locked(); //utente loggato ma non admin
                    })
                    .catch(e => {
                        console.log(e);
                        res.boom.locked();
                    })
                }
            }
            else res.json(result);
        }
    })
    .catch(e => {
        console.log(e);
        res.boom.badImplementation();
    });
}
