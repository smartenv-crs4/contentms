var mongoose = require('mongoose');
var collectionName = require('propertiesmanager').conf.dbCollections.promotion;
var common = require('./common');

var PromotionSchema = new mongoose.Schema({
  name        : String,
  type        : String,
  description : String,
  startDate   : Date,
  endDate     : Date,
  price       : Number,
  idcontent   : {type: mongoose.Schema.ObjectId, ref:'content'},
  position    : {type: [Number], index: '2dsphere'}, //[lon, lat]
  lat         : {type: Number, index:true},
  lon         : {type: Number, index:true},
  address     : String,
  images      : [String] //puo' contenere url o objectid TODO rifinire
},
{versionKey:false});

PromotionSchema.index({ name: 'text', description: 'text'}, {name: 'text_index', weights: {name: 10, description: 5}});
 

PromotionSchema.statics.add = function(newitem) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let item = new that(newitem);
      item.save()
      .then((newoffer) => {
        resolve(newoffer)
      })
      .catch(e => {
        console.log(e);
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
  const qlimit = limit != undefined ? limit : 20;
  const qskip = skip != undefined ? skip : 0;
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let query = {};

      if(filter.idcontent) //search solo su promotion di un contenuto
        query['$and'] = [{'idcontent':filter.idcontent}];

      let position = undefined;
      let skipTime = false;
      Object.keys(filter).forEach((key) => {
        //distance search
        if(key == "position") {
          position = common.getPosition(filter[key]);
        }

        //fulltext search
        else if(key == "text") {
          query["$text"] = {
            "$search": filter[key].join(' '),
          }
        }

        //date range search
        else if(!skipTime && (key == "sdate" || key == "edate")) {
          skipTime = true;
          try {
            let sdate = filter["sdate"];
            let edate = filter["edate"];

            if(sdate) qEnd = {'$gte': new Date(sdate)};
            if(edate) qStart = {'$lte':new Date(edate)};

            // promo che intersecano il periodo sdate-edate
            if(edate && sdate) query['$and'].concat([{'startDate':qStart}, {'endDate': qEnd}]);

            //promo attive da sdate in poi (che finiscono dopo sdate)
            else if(sdate) query['endDate'] = qEnd;
            //else if(edate) query['startDate'] = qBeforeEnd;
          }
          catch(e) {
            console.log(e);
            reject({status:400, error:'wrong date syntax'})
          }
        }

        //other search params, multiple instances allowed
        else {
          query[key] = {'$in' : filter[key]}
        }
      });

      if(position) {
//        common.near(collectionName, position, query, qlimit, qskip, 'promos', (result, err) => {
        common.hpNear(collectionName, position, query, qlimit, qskip, 'promos', (result, err) => {
          if(err) reject(err);
          else resolve(result);
        });
      }
      else {
        that.model(collectionName).find(query).count()
        .then((count) => { //TODO serve davvero il totalCount? 
          let options = {skip:qskip, limit:qlimit};
          that.model(collectionName).find(query, fields, options).lean().exec(function(e, cont) {
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
