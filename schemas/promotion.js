var mongoose = require('mongoose');
var collectionName = 'promotion';

var PromotionSchema = new mongoose.Schema({
  name        : String,
  type        : String,
  description : String,
  startDate   : Date,
  endDate     : Date,
  price       : Number,
  idcontent   : {type: mongoose.Schema.ObjectId, ref:'content'},
  position    : {type: [Number], index: '2d'} //[lon, lat]
  //address
  //images
},
{versionKey:false});
  
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
  const eradius = 6371;
  const qlimit = limit != undefined ? limit : 20;
  const qskip = skip != undefined ? skip : 0;
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let query = {};
      Object.keys(filter).forEach((key) => {
        //distance search
        if(key == "position") {
          let lon   = Number(filter[key][0]);
          let lat   = Number(filter[key][1]);
          let dist  = Number(filter[key][2]) / eradius;
          //WARNING $near non funziona con sharding
          query[key] = {'$near':[lon, lat], '$maxDistance':dist};
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
//console.log(query);
      that.model(collectionName).find(query).count()
      .then((count) => { //TODO serve davvero il totalCount? 
        let options = {skip:qskip, limit:qlimit, populate:'category'};
        that.model(collectionName).find(query, null, options, function(e, cont) {
          let result = {};
          result.contents = cont;
          result.metadata = {limit:qlimit, skip:qskip, totalCount:count}

          if(e) reject(e);
          else resolve(result);
        })
      });
    }
  );
}

  
PromotionSchema.statics.update = function(cid, pid, upd) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOneAndUpdate({_id:pid, idcontent:cid}, upd, {new:true}, function(e, cont) {
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

exports.promotion = mongoose.model('promotion', PromotionSchema);
