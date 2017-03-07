var mongoose = require('mongoose');
const collectionName = 'counters';

const CounterSchema = new mongoose.Schema({
  _id: String,
  seq: Number
},
{versionKey:false});


CounterSchema.statics.getNextSequence = function(id, cb) {
  this.model(collectionName).findOneAndUpdate(
    {_id:id}, 
    {$inc:{seq:1}},
    {new: true, upsert:true},
    (err, res) => {
      if(err) console.log(err);
      cb(res.seq);
    }
  );
}


CounterSchema.statics.add = function(id) {
  let item = {_id:id, seq:0};
  this.model(collectionName).findOneAndUpdate(item, {upsert:true})
  .catch((e) => {console.log(e);});
}

exports.counters = mongoose.model(collectionName, CounterSchema);
