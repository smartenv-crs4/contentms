var mongoose = require('mongoose');
var collectionName = require('propertiesmanager').conf.dbCollections.involvement;

var InvolvementSchema = new mongoose.Schema({
  id      : mongoose.Schema.ObjectId,
  iduser  : mongoose.Schema.ObjectId,
  type    : String, //LIKE, PARTICIPATION, RATE
  rating  : {type:Number, max:5, default:-1}
},
{versionKey:false});

InvolvementSchema.index({id:1, iduser:1, type:1},{unique:true});

InvolvementSchema.statics.add = function(pid, uid, type) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let like = new that({iduser:uid, id:pid, type:type});
      like.save()
      .then(() => {resolve({success:true})})
      .catch((e) => {
//        console.log(e);
        if(e.name === 'MongoError' && e.code === 11000)
          reject({status:409, error:"involvement already set"});
        else
          reject({status:500, error:"server error"});
      });
    } 
  );
}


InvolvementSchema.statics.rate = function(pid, uid, rate) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).findOneAndUpdate({iduser:uid, id:pid, type: "RATE"},{rating:rate},{upsert:true}, function(e) {
        if(e) {
          console.log(e);
          reject({status:500, error:"server error"});
        }
        else resolve({success:true});
      })
    } 
  );
}



InvolvementSchema.statics.delete = function(pid, uid, type) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).remove({id:pid, iduser:uid}, function(e, removed) {
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
        else resolve({success:true});
      });
    }
  );
}

 
InvolvementSchema.statics.countByType = function(pid, type) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).count({id:pid, type:type}, function(e, c) {
        if(e) reject({status:500, error:"server error"});
        else resolve(c);
      });
    }
  );
}

exports.involvement = mongoose.model(collectionName, InvolvementSchema);
