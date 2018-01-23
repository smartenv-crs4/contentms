var mongoose = require('mongoose');
var collectionName = require('propertiesmanager').conf.dbCollections.promotion;
var common = require('./common');
var moment = require('moment');

var PromotionSchema = new mongoose.Schema({
  name          : {type:String, required:true},
  type          : {type: Number, ref:require('propertiesmanager').conf.dbCollections.promotype},
  description   : {type:String, required:true},
  creationDate  : {type:Date, default: Date.now},
  lastUpdate    : Date,
  startDate     : {type: Date, required:true},
  endDate       : {type: Date, required:true},
  price         : Number,
  idcontent     : {type: mongoose.Schema.ObjectId, ref:require('propertiesmanager').conf.dbCollections.content, required:true},
  category      : [{type: Number, ref:require('propertiesmanager').conf.dbCollections.category}],
  position      : {type: [Number], index: '2dsphere'}, //[lon, lat]
  lat           : {type: Number, index:true},
  lon           : {type: Number, index:true},
  address       : String,
  town          : String,
  images        : [String] //puo' contenere url o objectid TODO rifinire
},
{versionKey:false});

PromotionSchema.index({ 
    name: 'text', 
    description: 'text', 
    town: 'text'
}, 
{
    name: 'text_index', 
    weights: {
        name: 10, 
        town: 8, 
        description: 5
    }
});
 

PromotionSchema.statics.add = function(newitem) {
    var that = this;
    if(newitem.creationDate) delete newitem.creationDate;
    if(newitem.lastUpdate) delete newitem.lastUpdate;
    return new Promise(
        function(resolve, reject) {
            let item = new that(newitem);
            item.save()
            .then((newoffer) => {
                resolve(newoffer)
            })
            .catch(e => {
                console.log(e);
                if(e.name == "ValidationError")
                  reject({status:400, error:"invalid content"})
                else
                  reject({status:500, error:"server error"});
            });
        }
    );
}
 
PromotionSchema.statics.findById = function(cid, pid) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOne({_id:pid, idcontent:cid}).lean().exec(function(e, cont) {
        if(e) reject(e);
        else resolve(cont);
      });
    }
  );
}

PromotionSchema.statics.findFiltered = function(filter, limit, skip, fields) {
  const qlimit = limit != undefined ? Number(limit) : 20;
  const qskip = skip != undefined ? Number(skip) : 0;
  let skipKeys = ['sdate', 'text', 'edate', 'sdate', 'mds', 'mde']
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let query = {};

      if(filter.idcontent) //search solo su promotion di un contenuto
        query['$and'] = [{'idcontent':filter.idcontent}];

      let position = undefined;
      let skipTime = false;
      let skipUpdateTime = false;
      Object.keys(filter).forEach((key) => {
        //distance search
        if(key == "position") {
          position = common.getPosition(filter[key]);
        }

        //fulltext search
        else if(key == "text") {
          let txt = filter[key].join(' ');
          if(txt.trim().length > 0) {
            query["$text"] = {
              "$search": txt
            }
          }
        }

        //last update & insert
        else if(!skipUpdateTime && (key == "mds" || key == "mde")) {
            if(!query["$and"]) query["$and"] = [];
            skipUpdateTime = true;
            let q1 = setDateRange(filter["mds"], filter["mde"], "lastUpdate", "lastUpdate");
            let q2 = setDateRange(filter["mds"], filter["mde"], "creationDate", "creationDate");
            if(!query["$and"]) query["$and"] = [];
            query["$and"].push({"$or":[q1, q2]})
        }

        //date range search
        else if(!skipTime && (key == "sdate" || key == "edate")) { //skiptime serve a saltare sdate o edate nei cicli successivi
            skipTime = true;
            let q = setDateRange(filter["sdate"], filter["edate"], "startDate", "endDate");
            if(!query["$and"]) query["$and"] = [];
            query["$and"].push(q);
        }

        //other search params, multiple instances allowed        
        else if(skipKeys.indexOf(key) == -1) {
            query[key] = {'$in' : filter[key]}
        }
      });

      if(position) {
//        common.near(collectionName, position, query, qlimit, qskip, 'promos', (result, err) => {
        common.hpNear(collectionName, position, query, qlimit, qskip, 'promos', (result, err) => {
          if(err) reject(err);
          else {
            result.metadata = {limit: qlimit, skip: qskip, totalCount: result.promos.length};
            resolve(result);
          }
        });
      }
      else {
//console.log(JSON.stringify(query));
        that.model(collectionName).find(query).count()
        .then((count) => { //TODO serve davvero il totalCount? 
          let options = {
            skip:qskip,
            limit:qlimit
            //populate:require('propertiesmanager').conf.dbCollections.promotype + ' ' + require('propertiesmanager').conf.dbCollections.content + ' ' + require('propertiesmanager').conf.dbCollections.category
          };
          that.model(collectionName).find(query, fields, options)          
          .populate('type category')
          //.sort({"creationDate":-1}) //ATTENTIION!! ordered by creation date (last first) PER TOURPLANNER CARLO!!!!
          .sort({"endDate":1}) //ordinati per data di "scadenza"
          .lean()
          .exec(function(e, cont) {
            let result = {};
            result.promos = cont;
            result.metadata = {limit:qlimit, skip:qskip, totalCount:count}            
            if(e) reject(e);
            else resolve(result);
          })
        });
      }
    }
  );
}

  
PromotionSchema.statics.update = function(cid, pid, upd) {
  var that = this;
  if(upd._id) delete upd._id;
  if(upd.creationDate) delete upd.creationDate;
  if(upd.lastUpdate) delete upd.lastUpdate;
  
  upd.lastUpdate = new Date();
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOneAndUpdate({_id:pid, idcontent:cid}, upd, {new:true, runValidators:true}, function(e, cont) {
        if(e) {
          switch(e.name) { 
            case 'CastError':
              reject({status:400, error:"model violation"});
              break;
            default:
              reject({status:500, error:"server error"});
              break;
          }
        }
        else resolve(cont);
      });
    }
  );
}


PromotionSchema.statics.delete = function(cid, pid) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOneAndRemove({_id:pid, idcontent:cid}, function(e, removed) {
        if(e) {
          switch(e.name) { 
            case 'CastError':
              reject({status:404, error:"not found"});
              break;
            default:
              reject({status:500, error:"server error"});
              break;
          }
        }
        else resolve(removed);
      });
    }
  )
}

exports.promotion = mongoose.model(collectionName, PromotionSchema);

//methods - TODO spostare
function setDateRange (sdate, edate, pnameStart, pnameStop) {
    try {
        let query = {};
        let qStart  = sdate ? new Date(sdate) : undefined; //TODO usare moment con locale???
        let qEnd    = edate ? new Date(edate) : undefined;

        // promo che intersecano il periodo sdate-edate
        if(edate && sdate) {
            if(!query["$and"]) query['$and'] = [];
            query['$and'].push({[pnameStart]:{'$lte':qEnd}});            
            query['$and'].push({[pnameStop]:{'$gte':qStart}}); 
        }

        //da sdate in poi (che finiscono dopo sdate)
        else if(sdate) query[pnameStop] = {'$gte': qStart};

        else if(edate) query[pnameStart] = {'$lte': qEnd};
//console.log(JSON.stringify(query));
        return query;
    }
    catch(e) {
        console.log(e);
        throw({status:400, error:'wrong date syntax'})
    }
}