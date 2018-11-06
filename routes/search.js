var content = require('../schemas/content.js').content;
var promo = require('../schemas/promotion.js').promotion;
var common = require('../lib/common.js');

/**
 * @api {get} /search Search for activities, contents and promotions on the portal
 * @apiGroup Search
 * @apiDescription Parametric search over contents on the portal, including category, distance and full text
 *
 * @apiParam {String} [t] The type of search ("promo" or "content").
 * @apiParam {Number} [category] The category id, based on those present in categories.
 * @apiParam {Number[]} [position] Three element array: lon, lat, distance. Mind the order.
 * @apiParam {String} [text] Text to search for in the description and name fields.
 * @apiParam {Date} [sdate] The start date for a promo (starts after) (only with t=promo)
 * @apiParam {Date} [edate] The end date for a promo (ends before) (only with t=promo)
 * @apiParam {Date} [mds] Modify Date Start, content or promo created or modified after (only with t=promo)
 * @apiParam {Date} [mde] Modify Date End, content or promo created or modified before (only with t=promo)
 * @apiParam {String} [by_uid] The Admin user unique ID.
 * @apiParam {Number} [ptype] The type of promotion: Offer = 1, Event = 2 (only with t=promo).
 * @apiParam {Array} [ids] Array of content/promo id to search for.
 * @apiParam {String} [vat] The vat number of the activity (only with t=content).
 * @apiParam {String} [idcontent] The id of the owner of the promotions you are looking for (only with t=promo)
 * @apiParam {String} [recurrency] The id of the father promo in a batch of events (only with t=promo)
 * 
 *
 * @apiSuccess (200) {Object[]} body Array of results representing found activities.
 * @apiUse Unauthorized
 * @apiUse BadRequest
 * @apiUse ServerError
 */
module.exports = function(req, res, next) {
  let allowed_keys = ["category", "position", "text", "by_uid", "ids", "vat"];
  let allowed_keys_promo = allowed_keys.concat(["ptype", "sdate", "edate", "mds", "mde", "idcontent", "recurrency"])
  let one_instance_keys = ["position", "edate", "sdate", "mds", "mde", "idcontent", "ptype", "recurrency"]; //viene considerata solo la prima occorrenza nel url
  let filter = {};
  let limit = req.query.limit;
  let skip  = req.query.skip;
  let type = req.query.t;
  let wholeresult = {};
  let idcontent = req.params.id;
  let ord = req.query.ord;
  let lang = req.query.lng;
  if(!(ord && ["endDate", "creationDate"].indexOf(ord) != -1))
    ord = undefined;

  if(!type) type = (idcontent ? "promo" : "content"); //per GET su /contents/:id/promotions/
  if(idcontent) filter.idcontent = idcontent;
  
  common.allowedKeys((type=="promo" ? allowed_keys_promo : allowed_keys), one_instance_keys, filter, req.query);

  let requiredFields = ['name','description','category', 'lastUpdate', 'creationDate', "lat", "lon", "images", "position"]; //field richiesti in output dalla query
  if(type == "promo" || type == "content") {
    let pexe = (type == "promo") ? promo : content;

    if(type=='promo') {
      requiredFields.push('idcontent');
      requiredFields.push('town');
      requiredFields.push('startDate');
      requiredFields.push('endDate');
      requiredFields.push('type');
      requiredFields.push('price');
      requiredFields.push('recurrency_group');
      requiredFields.push('recurrency_type');
      requiredFields.push('recurrency_end');
    }
    else if(type == "content") {
      requiredFields.push('vat');
    }
    else if(type == "content" && filter.by_uid) { //TODO check per token admin???
        requiredFields.push('admins');
    }

    let singleResult = {};
    pexe.findFiltered(filter, limit, skip, requiredFields, ord)
      .then(result => {
        singleResult = result;
        return common.getLikes(result[type+'s']);
      })
      .then(rr => {
        for(let i=0; i<singleResult[type+'s'].length; i++) {
            singleResult[type+'s'][i].likes = rr[i];
            if(lang) {
              singleResult[type+'s'][i].name = common.getTranslation(singleResult[type+'s'][i].name, lang);
              singleResult[type+'s'][i].description = common.getTranslation(singleResult[type+'s'][i].description, lang);
            }
        }
        
        res.json(singleResult);
      })
      .catch(e => {
        console.log(e);
        if(e.status && e.status == 400)
          res.boom.badRequest("Invalid Query");
        else
          res.boom.badImplementation();
      });
  }
  else {
    Promise.all([
      content.findFiltered(filter, limit, skip, requiredFields),
      promo.findFiltered(filter, limit, skip, requiredFields)
    ])
    .then(result => {
        //TODO getLikes e translate per wholeresult!!!!
        let wholeresult = {
            contents:result[0].contents,
            promos:result[1].promos,
            //WARNING:
            //skip e limit si riferiscono alle singole chiamate contents e promo
            //mentre totalCount e' relativo al totale complessivo
            _metadata:{limit:limit, skip:skip, totalCount:(result[0].metadata.totalCount + result[1].metadata.totalCount)}
        }
        res.json(wholeresult);
    })
    .catch(e => {
      console.log(e);
      res.boom.badImplementation();
    });
  }

}

