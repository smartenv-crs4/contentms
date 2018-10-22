const config = require('propertiesmanager').conf;

var content = require('../schemas/content.js').content;
var promo = require('../schemas/promotion.js').promotion;
var common = require('../lib/common.js');

module.exports = function(req, res, next) {
  let allowed_keys = ["mds", "mde", "ptype", "sdate", "edate", "idcontent"];
  let one_instance_keys = ["mds", "mde", "ptype", "sdate", "edate"]; //viene considerata solo la prima occorrenza nel url
  let filter = {};
  let limit = req.query.limit;
  let skip  = req.query.skip;
  let type = req.query.t || "promo"; //default promo
  let lang = 'it';  //ATTENZIONE usa multilingua di interfaccia!!!

  common.allowedKeys(allowed_keys, one_instance_keys, filter, req.query);

  let requiredFields = ['name','description', 'category', 'lastUpdate', 'creationDate', 'lat', 'lon', "address"]; //field richiesti in output dalla query
  if(type == "promo" || type == "content") {
    let pexe = (type == "promo") ? promo : content;
    if(type=='promo') {
        requiredFields.push('idcontent');
        requiredFields.push('town');
        requiredFields.push('startDate');
        requiredFields.push('endDate');
        requiredFields.push('images');
        requiredFields.push('type');
    }
    
    pexe.findFiltered(filter, limit, skip, requiredFields)
    .then(result => {
        delete result.metadata;
        if(type=="promo") {
            let promise_arr = [];
            for(let i = 0; i<result.promos.length; i++) {
                promise_arr.push(content.findById(result.promos[i].idcontent));
            }            
            Promise.all(promise_arr)
            .then(contents => {
                //console.log(result.promos)
                for(let i=0; i<result.promos.length; i++) {
                    for(let j=0; j<contents.length; j++) {
                        
                        if(""+result.promos[i].idcontent == contents[j]._id) {
                            //ATTENZIONE: usa l'uploadms specificato in content!
                            //ma le immagini sono caricate da contentUI
                            let img = null;
                            if(result.promos[i].images && result.promos[i].images.length > 0)
                                img = config.uploadUrl + "file/" + result.promos[i].images[0];
                            ////////////////////////////////////////////////////

                            //ATTENZIONE: usa il multilingua di interfaccia....
                            result.promos[i].name = common.getTranslation(result.promos[i].name, lang);
                            result.promos[i].description = common.getTranslation(result.promos[i].description, lang);
                            ////////////////////////////////////////////////////

                            delete result.promos[i].idcontent;
                            result.promos[i].type = result.promos[i].type ? result.promos[i].type.name : undefined;
                            result.promos[i].category = result.promos[i].category ? result.promos[i].category.name : undefined;
                            result.promos[i].images = img;
                            result.promos[i].owner = common.getTranslation(contents[j].name, lang);
                            if(!(result.promos[i].lat && result.promos[i].lon)) {
                                result.promos[i].lat = contents[j].lat;
                                result.promos[i].lon = contents[j].lon;
                            }
                            if(!(result.promos[i].address)) {
                                result.promos[i].address = contents[j].address || null;
                            }
                            break;
                        }
                    }
                }
                res.json(result);
            })
            .catch(e => {
                console.log(e)
                res.boom.badImplementation();
            })
        }
        else { //content
            res.json([])
        } 
    })
    .catch(e => {
        console.log(e);
        res.boom.badImplementation();
    });
  }

/*
  else {
    Promise.all([
      content.findFiltered(filter, limit, skip, requiredFields),
      promo.findFiltered(filter, limit, skip, requiredFields)
    ])
    .then(result => {      
      let wholeresult = {
        contents:result[0].contents,
        promos:result[1].promos,
        metadata:result[0].metadata
      }
      res.json(wholeresult);
    })
    .catch(e => {
      console.log(e);
      res.boom.badImplementation();
    });
  }
*/
}
