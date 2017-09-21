var mongoose = require('mongoose');
var category = require('./category.js');
var collectionName = require('propertiesmanager').conf.dbCollections.content;
var common = require('./common');

var ContentSchema = new mongoose.Schema({
  name          : String,
  lastUpdate    : Date,
  creationDate  : {type: Date, default: Date.now},
  owner         : {type: mongoose.Schema.ObjectId, required:true},
  admins        : [mongoose.Schema.ObjectId],
  type          : String,
  description   : String, 
  category      : [{type: Number, ref:require('propertiesmanager').conf.dbCollections.category}],
  published     : Boolean,
  town          : String,
  address       : String,
  position      : {type: [Number], index: '2dsphere'}, //[lon, lat]
  lat           : {type: Number, index: true},
  lon           : {type: Number, index: true},
  images        : [String], //puo' contenere url o objectid TODO rifinire
  avatar        : String

//      contacts //TODO dovrebbe essere un oggetto variabile (mail, fb, twitter, tel...)
//      opens
//      avatar
},
{versionKey:false});

ContentSchema.index({ name: 'text', description: 'text', town: 'text'}, {name: 'text_index', weights: {name: 10, town: 8, description: 5}});

ContentSchema.statics.findFiltered = function(filter, limit, skip, fields) {
  const qlimit = limit != undefined ? Number(limit) : 20;
  const qskip = skip != undefined ? Number(skip) : 0;
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let query = {};
      let position = undefined;
      Object.keys(filter).forEach((key) => {
        if(key == "position") {
          position = common.getPosition(filter[key]);
        }
        else if(key == "text") {
          query["$text"] = {
            "$search": filter[key].join(' '),
          }
        }
        else if(key == "by_uid") {
          query["$or"] = [ {'admins': {'$in' : filter[key]}}, {'owner': filter[key][0]}]
        }
        else {
          query[key] = {'$in' : filter[key]}
        }
      });
      if(position) { 
        common.hpNear(collectionName, position, query, qlimit, qskip, 'contents', (result, err) => {
//        common.near(collectionName, position, query, qlimit, qskip, 'contents', (result, err) => {
          if(err) reject(err);
          else resolve(result);
        });
      }
      else {
        that.model(collectionName).find(query).count()
        .then((count) => { //TODO serve davvero il totalCount? 
          let options = {
            skip:qskip, 
            limit:qlimit            
          };
          that.model(collectionName).find(query, fields, options)
          .populate('category')
          .lean()
          .exec(function(e, cont) {
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
      that.model(collectionName).findOne({_id:id}).lean().exec(function(e, cont) {
        if(e) reject(e);
        else resolve(cont);
      });
    }
  );
}


ContentSchema.statics.update = function(id, upd) {
  var that = this;
  if(upd._id) delete upd._id;
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
