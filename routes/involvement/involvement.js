var authField     = require('propertiesmanager').conf.decodedTokenFieldName;
var involvements  = require('../../schemas/involvement').involvement;
const promos      = require('../../schemas/promotion').promotion;



module.exports = {
    /**
     * @api {GET} /contents/:id/promotions/:pid/participants Get the list of participants
     * @apiGroup Content
     *
     * @apiDescription Return the list of promotion participants 
     * @apiParam {String} id The id of the related content.
     * @apiParam {String} pid The id of the promotion.
     *
     * @apiSuccess (200) {Object} body A list of user id.
     * @apiUse Unauthorized
     * @apiUse BadRequest
     * @apiUse ServerError
     */
    participants : (req, res, next) => { //TODO anche per like???
        let pid = req.params.pid;

        if(pid) {
            involvements.get(pid, "participation") //TODO mapping con valori numerici!!!!
            .then(r => {
                res.json(r);
            })
            .catch(e => {
                console.log(e);
                res.boom.badImplementation();
            })
        }
        else {
            console.log(e);
            res.boom.badRequest("Invalid resource ID")
        }
    },
    /**
     * @api {GET} /involvements Get the list of user's participations
     * @apiGroup Content
     *
     * @apiDescription Return the list of promotions or events that the user would join
     *
     * @apiSuccess (200) {Object} body A list of promotion ids.
     * @apiUse Unauthorized
     * @apiUse BadRequest
     * @apiUse ServerError
     */
    involvements : (req, res, next) => {
        let uid = req[authField].token._id
        if(!uid) {res.boom.badRequest('Missing user id or user not logged');}
        else {
            involvements.findByUser(uid, "participation") //TODO mapping con valori numerici!!!!
            .then(r => {
                res.json(r);
            })
            .catch(e => {
                console.log(e);
                res.boom.badImplementation();
            })
        }
    }
}
