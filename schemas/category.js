var mongoose = require('mongoose');
var collectionName = require('propertiesmanager').conf.db.collections.category;

var CategorySchema = new mongoose.Schema({
    _id         : Number,
    name        : String,
    type        : String,
    description : String
});

exports.category = mongoose.model(collectionName, CategorySchema);
