var promotion = require('../../schemas/promotion.js').promotion;
var common = require('../../lib/common.js');

/**
 * @api {get} /contents/:id/promotions/:pid Get promotions by id 
 * @apiGroup Promotion
 *
 * @apiParam {String} id The id of the father activity.
 * @apiParam {String} id The id of the promotion.
 *
 * @apiSuccess (200) {Object} body Json containing the activity.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
    let cid = req.params.id;
    let pid = req.params.pid;
    promotion.findById(cid, pid)
    .then(result => {
        if(result == null || result == undefined || Object.getOwnPropertyNames(result).length === 0)
            res.boom.notFound();
        else { 
            result.images = common.uniformImages(result.images);

            let isLocked = !result.published;
            if(isLocked) {
                //console.log(req[authField])
                if(!req[authField].valid) {//utente non loggato
                    res.boom.locked();
                }
                else {
                    common.isContentAdmin(result, req)
                    .then(isAdm => {
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
        if(e.status && e.status==404)
            res.boom.notFound();
        else {
            console.log(e);
            res.boom.badImplementation();
        }
    });
}
