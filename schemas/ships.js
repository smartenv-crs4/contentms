var mongoose = require('mongoose');
var collectionName = require('propertiesmanager').conf.dbCollections.ship;
var validator = require('validator');

var ShipSchema = new mongoose.Schema({
    ship        : String,
    passengers  : String,
    arrival     : Date,
    departure   : Date
  }, 
  {versionKey:false}
);


ShipSchema.statics.add = function(newitem) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      (new that(newitem))
      .save()
      .then((newcat) => {
        resolve(newcat)
      })
      .catch(e => {
        console.log(e);
        reject({status:500, error:"server error"});
      });
    }
  );
}

ShipSchema.statics.search = function(filter, limit, skip) {
  const qlimit = limit != undefined ? limit : 20;
  const qskip = skip != undefined ? skip : 0;
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let query = {};
      Object.keys(filter).forEach((key) => {
        if(key == "ship") //by ship name 
          query["ship"] = filter[key]; 

        //date range search
        else if(key == "adate" || key == "ddate") {
          try {
            let sdate = filter["adate"];
            let edate = filter["ddate"];

            if(sdate) qEndDate = {'$gte': new Date(sdate)};
            if(edate) qStartDate = {'$lte':new Date(edate)};

            if(edate && sdate) query['$and'] = [{'arrival':qStartDate}, {'departure': qEndDate}];
            else if(sdate) query['arrival'] = qEndDate;
            else if(edate) query['departure'] = qStartDate;
          }
          catch(e) {
            console.log(e);
            reject({status:400, error:'wrong date syntax'})
          }
        }
      });

      that.model(collectionName).find(query).count()
      .then((count) => { //TODO serve davvero il totalCount? 
        let options = {skip:qskip, limit:qlimit};
        that.model(collectionName).find(query, null, options, function(e, cont) {
          let result = {};
          result.ships = cont;
          result.metadata = {limit:qlimit, skip:qskip, totalCount:count}

          if(e) reject(e);
          else resolve(result);
        })
      });    
    }
  );
}

//parameters: limit, skip, name
ShipSchema.statics.get = function(id) {
  let that = this;
  let query = {_id:id};

  return new Promise(
    function(resolve, reject) {
        that.model(collectionName).findOne(query, (e, result) => {
          if(e) reject(e);
          else resolve(result);
        });
      }
  );
}

ShipSchema.statics.update = function(id, upd) {
  var that = this;
  if(upd._id) delete upd._id;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOneAndUpdate({_id:id}, upd, {new:true, runValidators:true}, function(e, cat) {
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
        else resolve(cat);
      });
    }
  );
}

ShipSchema.statics.delete = function(id) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOneAndRemove({_id:id}, function(e, removed) {
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

exports.ship = mongoose.model(collectionName, ShipSchema);
