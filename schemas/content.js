var mongoose = require('mongoose');
var category = require('./category.js');
var collectionName = require('propertiesmanager').conf.dbCollections.content;

var ContentSchema = new mongoose.Schema({
  name        : String,
  owner       : {type: mongoose.Schema.ObjectId, required:true},
  admins      : [mongoose.Schema.ObjectId],
  type        : String,
  description : String,
  category    : [{type: Number, ref:'category'}],
  published   : Boolean,
  town        : String,
  address     : String,
  position    : {type: [Number], index: '2dsphere'}, //[lon, lat]
//  promotion   : [{type: mongoose.Schema.ObjectId, ref:'promotion'}]

//      opens
//      avatar
//      images
//      contacts
},
{versionKey:false});


ContentSchema.statics.add = function(newitem) {
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

  
ContentSchema.statics.findById = function(id) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOne({_id:id}, function(e, cont) {
        if(e) reject(e);
        else resolve(cont);
      });
    }
  );
}

/*
// L'operatore spaziale $near usato in questa funzione non funziona su collection in sharding
// ma si puo' usare all'interno di una find quindi con skip/limit e totalcount
ContentSchema.statics.findFiltered_NOSHARD = function(filter, limit, skip) {
  const qlimit = limit != undefined ? limit : 20;
  const qskip = skip != undefined ? skip : 0;
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let query = {};
      Object.keys(filter).forEach((key) => {
        if(key == "position") {
          let lon   = Number(filter[key][0]);
          let lat   = Number(filter[key][1]);
          let dist  = Number(filter[key][2]) * 1000;
          //WARNING $nearSphere non funziona con sharding
          query[key] = {
            '$nearSphere': {
              '$geometry': {
                type:'Point',
                coordinates: [lon, lat]
              }, 
              '$maxDistance':dist
            }
          }
        }
        else if(key == "text") {
          let re = new RegExp(filter[key].join('|'), 'i');
          query['$or'] = [{name: {'$regex': re}}, {description: {'$regex': re}}];
        }
        else {
          query[key] = {'$in' : filter[key]}
        }
      });
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
*/


ContentSchema.statics.findFiltered = function(filter, limit, skip) {
  const qlimit = limit != undefined ? limit : 20;
  const qskip = skip != undefined ? skip : 0;
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let query = {};
      let position = undefined;
      Object.keys(filter).forEach((key) => {
        if(key == "position") {
          //if incomplete skip position
          if(Array.isArray(filter[key]) && filter[key].length == 3) {
            position = {};
            position["lon"]   = Number(filter[key][0]);
            position["lat"]   = Number(filter[key][1]);
            position["dist"]  = Number(filter[key][2]);
          }
        }
        else if(key == "text") {
          let re = new RegExp(filter[key].join('|'), 'i');
          query['$or'] = [{name: {'$regex': re}}, {description: {'$regex': re}}];
        }
        else {
          query[key] = {'$in' : filter[key]}
        }
      });

      if(position) { 
        //WARNING: geoNear non ha skip
        //TODO implementare lo skip salvando l'ultima dist (sono ordinate) e usando minDistance = lastdistance + 0.1
        //TODO limitare il raggio di ricerca a una dimensione massima sensata
        that.model(collectionName).geoNear(
          {type:'Point', coordinates: [position.lon, position.lat]},
          {spherical:true, query:query, maxDistance:position.dist * 1000, limit:qlimit}
        )
        .then((res, err) => {
          if(err) reject(err);
          else {
            let normalized_res = [];
            for(rid in res) {
              let distance = (res[rid].dis/1000) + "";
              let obj = res[rid].obj._doc;
              obj["distance"] = Number(distance.slice(0,distance.indexOf('.')+3));
              normalized_res.push(obj);
            }
            let result = {};
            result.contents = normalized_res;
            result.metadata = {limit:qlimit} //TODO aggiungere lastdistance per skip???
            resolve(result);
          }
        })
        .catch((e) => {
          console.log(e);
          reject(e);
        });
      }
      else {
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
        })
      }
    }
  );
} 


ContentSchema.statics.update = function(id, upd) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOneAndUpdate({_id:id}, upd, {new:true, runValidators:true}, function(e, cont) {
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

//private - updates a generic array field
function updateList(id, newItems, list, op) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let updateQuery= {};
      let listFieldQuery = {};
      let outFields = {};

      listFieldQuery[list] = newItems;
      outFields[list] = 1;

      //operation
      if(op === 'add') { 
        listFieldQuery[list] = {"$each":listFieldQuery[list]};
        updateQuery = {$addToSet:listFieldQuery};
      }
      else if(op === 'del')
        updateQuery = {$pullAll:listFieldQuery}; 

      mongoose.model(collectionName).findOneAndUpdate({_id:id}, updateQuery 
                        , {new:true, runValidators:true, fields:outFields}
                        , function(e, cont) {
        if(e) {
          switch(e.name) { 
            case 'CastError':
              reject({status:400, error:"invalid data"});
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
ContentSchema.statics.addAdmin        = (id, adminList) => { return updateList(id, adminList, 'admins', 'add');}
ContentSchema.statics.removeAdmin     = (id, adminList) => { return updateList(id, adminList, 'admins', 'del');}
ContentSchema.statics.addCategory     = (id, catList) => { return updateList(id, catList, 'category', 'add');}
ContentSchema.statics.removeCategory  = (id, catList) => { return updateList(id, catList, 'category', 'del');}


function castToObjectId(arrayOfOids) {
  let castedArray = [];
  arrayOfOids.forEach((item) => {
    castedArray.push(new mongoose.Schema.ObjectId(item));
  });
  return castedArray;
}

ContentSchema.statics.delete = function(id) {
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
  );
}
exports.content = mongoose.model(collectionName, ContentSchema);
