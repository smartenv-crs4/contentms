var mongoose = require('mongoose');
var collectionName = 'involvement';

var InvolvementSchema = new mongoose.Schema({
  idpromo   : mongoose.Schema.ObjectId,
  iduser    : mongoose.Schema.ObjectId,
  type      : String
},
{versionKey:false});


InvolvementSchema.statics.add = function(pid, uid, type) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      let like = new that({iduser:uid, idpromo:pid, type:type});
      like.save()
      .then(resolve({success:true}))
      .catch((e) => {
        reject({status:500, error:"server error"});
      });
    } 
  );
}


InvolvementSchema.statics.delete = function(pid, uid, type) {
  var that = this;
  return new Promise(
    function(resolve, reject) {
      that.model(collectionName).remove({idpromo:pid, iduser:uid}, function(e, removed) {
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
      that.model(collectionName).count({idpromo:pid, type:type}, function(e, c) {
        if(e) reject({status:500, error:"server error"});
        else resolve(c);
      });
    }
  );
}

exports.involvement = mongoose.model(collectionName, InvolvementSchema);
