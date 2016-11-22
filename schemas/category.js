var mongoose = require('mongoose');
var collectionName = require('propertiesmanager').conf.dbCollections.category;
var validator = require('validator');

var CategorySchema = new mongoose.Schema({
    _id         : Number,
    name        : String,
    type        : String,
    description : String
});


CategorySchema.statics.add = (newitem) => {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let item = new that(newitem);
      item.save()
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


CategorySchema.statics.search = (limit, skip, id) => {
  const multi = (arguments.length == 1) ? false : true;
  let options = undefined;
  let query = {};
  if(multi) { 
    if(!(validator.isNumber(limit) && validator.isNumber(skip)))
      reject({status:400, error:'wrong parameters'});
    else {
      options = {skip:new Number(skip), limit: new Number(limit)};
    }
  }
  else query = {_id:id};

  var that = this;
  return new Promise(
    function(resolve, reject) {
      if(multi) {
        that.model(collectionName).find(query).count()
        .then((count) => {
          that.model(collectionName).find(query, null, options, function(e, cont) {
            let result = {};
            result.categories = cont;
            result.metadata = {limit:qlimit, skip:qskip, totalCount:count}

            if(e) reject(e);
            else resolve(result);
          })
        });
      }
      else {
        that.model(collectionName).findOne({_id:id}, (e, result) => {
          if(e) reject(e);
          else resolve(result);
        });
      }
    }
  );
}


CategorySchema.statics.update = (id, upd) => {
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

CategorySchema.statics.delete = (id) => {
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
