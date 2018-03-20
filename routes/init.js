var category = require('../schemas/category').category;
var promotype = require('../schemas/promotype').promotype;
var validator = require('validator');
const cats = require('../config/initdb.json').categories;
const ptypes = require('../config/initdb.json').promotypes;

/**
 * @api {post} /init Initialize an empty db with categories and types
 * @apiGroup init
 * @apiDescription  Initialize an empty platform database. It works only on empty databases and must be called only once. 
 *                  It Requires system admin token. Categories and promotypes must be defined in the config/initdb.json file
 *
 * @apiSuccess (200) {String[]} body Array with the operations results.
 * @apiUse Unauthorized
 * @apiUse badRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
    let retarr = []
    let pArr = [];
    
    category.search()
    .then(r => { //check if any cat already exists
        if(r.categories.length > 0)
            res.boom.badRequest("Error your database is not empty")
        return promotype.search();
    })
    .then(r2 => { //check if any promotype already exists
        if(r2.promotype.length > 0) {
            res.boom.badRequest("Error your database is not empty")
        }

        //categories init
        for(let i=0; i<cats.length; i++) {
            if(validator.isEmpty(cats[i].name) 
                || validator.isEmpty(cats[i].description)
                || validator.isEmpty(cats[i].icon)) {
                    res.boom.badRequest("Error in the config/initdb.json file")
            }
            else pArr.push(category.add(cats[i]))
        }

        //promotypes init
        for(let i=0; i<ptypes.length; i++) {
            if(!ptypes[i].name || validator.isEmpty(ptypes[i].name))
	            res.boom.badRequest("Missing name field");
            else pArr.push(promotype.add(ptypes[i]))
        }

        Promise.all(pArr)
        .then(r => {
            let retmsgs = [];
            for(let i=0; i<r.length; i++) {
                retmsgs.push("Item " + r[i].name + " added with id " + r[i]._id);
            }
            res.json(retmsgs)
        })
    })
    .catch(e => {
        console.log(e)
        res.boom.badImplementation()
    })
}