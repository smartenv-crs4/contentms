var mongoose = require('mongoose');

var CategorySchema = new mongoose.Schema({
    _id         : Number,
    name        : String,
    type        : String,
    description : String
});

exports.category = mongoose.model('category', CategorySchema);
