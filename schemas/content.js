var mongoose = require('mongoose');
var category = require('./category.js');
var collectionName = require('config').db.collections.content;

var ContentSchema = new mongoose.Schema({
  name        : String,
  owner       : {type: mongoose.Schema.ObjectId, required:true},
  admins      : [mongoose.Schema.ObjectId],
  type        : String,
  description : String,
  category    : {type: Number, ref:'category'},
  published   : Boolean,
  town        : String,
  address     : String,
  position    : {type: [Number], index: '2d'}, //[lon, lat]
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

ContentSchema.statics.findFiltered = function(filter, limit, skip) {
  const eradius = 6371;
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
          let dist  = Number(filter[key][2]) / eradius;
          //WARNING $near non funziona con sharding
          query[key] = {'$near':[lon, lat], '$maxDistance':dist};
        }
        else if(key == "text") {
          let re = new RegExp(filter[key].join('|'), 'i');
          query['$or'] = [{name: {'$regex': re}}, {description: {'$regex': re}}];
        }
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

//private
function updateAdmin(id, adminList, op) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let upd = {}
      if(op === 'add') {
        upd = {$addToSet:{admins:adminList}};
      }
      else if(op === 'del') {
        upd = {$pullAll:{admins:adminList}}; 
      }
      mongoose.model(collectionName).findOneAndUpdate({_id:id}, upd, {new:true}, function(e, cont) {
        if(e) {
          switch(e.name) { 
            case 'CastError':
              reject({status:400, error:"invalid id"});
              break;
            default:
              reject({status:500, error:"server error"});
              break;
          }
        }
        else resolve({_id:cont._id, admins:cont.admins});
      });
    }
  );
}
ContentSchema.statics.addAdmin = (id, adminList) => { return updateAdmin(id, adminList, 'add');}
ContentSchema.statics.removeAdmin = (id, adminList) => { return updateAdmin(id, adminList, 'del');}

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
