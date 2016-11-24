var mongoose = require('mongoose');
var collectionName = require('propertiesmanager').conf.dbCollections.category;
var counter = require('./counters').counters;
var validator = require('validator');

var CategorySchema = new mongoose.Schema({
    _id         : Number,
    name        : String,
    description : String
  }, 
  {versionKey:false}
);


CategorySchema.statics.add = function(newitem) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      counter.getNextSequence('category', (sid) => { 
        newitem['_id'] = sid; //override eventuale id passato da utente

        (new that(newitem))
        .save()
        .then((newcat) => {
          resolve(newcat)
        })
        .catch(e => {
          console.log(e);
          reject({status:500, error:"server error"});
        });
      });
    }
  );
}


//parameters: limit, skip || id
CategorySchema.statics.search = function() {
  const multi = arguments.length == 0 || arguments.length == 2;
  let that = this;
  let options = {};
  let query = {};
  if(arguments.length == 2){ 
    if(!(validator.isNumeric(arguments[0]) && validator.isNumeric(arguments[1]))) {
      reject({status:400, error:'wrong parameters'});
    }
    else {
      options = {skip:new Number(skip), limit: new Number(limit)};
    }
  }
  else if(arguments.length == 1) query = {_id:arguments[0]};

  return new Promise(
    function(resolve, reject) {
      if(multi) {
        that.model(collectionName).find(query).count()
        .then((count) => {
          that.model(collectionName).find(query, null, options, function(e, cont) {
            let result = {};
            result.categories = cont;
            result.metadata = {limit:options.limit||null, skip:options.skip||null, totalCount:count}

            if(e) reject(e);
            else resolve(result);
          })
        });
      }
      else {
        that.model(collectionName).findOne(query, (e, result) => {
          if(e) reject(e);
          else resolve(result);
        });
      }
    }
  );
}


CategorySchema.statics.update = function(id, upd) {
  var that = this;
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

CategorySchema.statics.delete = function(id) {
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

exports.category = mongoose.model(collectionName, CategorySchema);
