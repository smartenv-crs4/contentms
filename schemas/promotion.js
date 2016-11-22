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
  position    : {type: [Number], index: '2dsphere'} //[lon, lat]
  //address
  //images
},
{versionKey:false});
 

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
      that.model(collectionName).findOne({_id:pid, idcontent:cid}, function(e, cont) {
        if(e) reject(e);
        else resolve(cont);
      });
    }
  );
}

PromotionSchema.statics.findFiltered = function(filter, limit, skip) {
  const qlimit = limit != undefined ? limit : 20;
  const qskip = skip != undefined ? skip : 0;
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let query = {};
      let position = undefined;
      Object.keys(filter).forEach((key) => {
        //distance search
        if(key == "position") {
          position = common.getPosition(filter[key]);
        }

        //fulltext search
        else if(key == "text") {
          let re = new RegExp(filter[key].join('|'), 'i');
          query['$or'] = [{name: {'$regex': re}}, {description: {'$regex': re}}];
        }

        //date range search
        else if(key == "sdate" || key == "edate") {
          try {
            let sdate = filter["sdate"];
            let edate = filter["edate"];

            if(sdate) qEndDate = {'$gte': new Date(sdate)};
            if(edate) qStartDate = {'$lte':new Date(edate)};

            if(edate && sdate) query['$and'] = [{'startDate':qStartDate}, {'endDate': qEndDate}];
            else if(sdate) query['endDate'] = qEndDate;
            else if(edate) query['startDate'] = qStartDate;
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
        common.near(collectionName, position, query, qlimit, 'promos', (result, err) => {
          if(err) reject(err);
          else resolve(result);
        });
      }
      else {
        that.model(collectionName).find(query).count()
        .then((count) => { //TODO serve davvero il totalCount? 
          let options = {skip:qskip, limit:qlimit};
          that.model(collectionName).find(query, null, options, function(e, cont) {
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
