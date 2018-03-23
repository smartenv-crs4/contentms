var mongoose = require('mongoose');
var config = require('propertiesmanager').conf;
var category = require('../schemas/category').category;
var promotype = require('../schemas/promotype').promotype;
var validator = require('validator');
const cats = require('../config/initdb.json').categories;
const ptypes = require('../config/initdb.json').promotypes;

module.exports = {
    connect : function(cb){
        if(mongoose.connection.readyState == mongoose.STATES.disconnected) {
            mongoose.Promise = global.Promise;
            
            let conn = "mongodb://" + config.dbHost + ":" + config.dbPort + "/" + config.dbName
            mongoose.connect(conn, 
                {
                    useMongoClient: true,
                    server: { 
                        //https://stackoverflow.com/questions/30909492/mongoerror-topology-was-destroyed
                        //DEPRECATED
                        reconnectTries: Number.MAX_VALUE,
                        reconnectInterval: 1000 
                    }
                }, function(error) {
                    if(error) {
                        console.log('FATAL: unable to connect to mongo db:');
                        console.log(error);
                        process.exit();
                    }
            });
        }
        if(cb) cb();
    },

    drop: function(cb) {
        mongoose.connection.db.dropDatabase()
        .then(() => {if(cb) cb();});
    },

    populate: (cb) => {
        let pArr = [];
        
        category.search()
        .then(r => { //check if any cat already exists
            if(r.categories.length == 0)
              return promotype.search();
            else return {skip:true};
        })
        .then(r2 => { //check if any promotype already exists
            console.log(r2)
            if(!r2.skip && r2.promotype.length == 0) {
              //categories init
              for(let i=0; i<cats.length; i++) {
                  if(validator.isEmpty(cats[i].name) 
                      || validator.isEmpty(cats[i].description)
                      || validator.isEmpty(cats[i].icon)) {
                          console.log("Error in the config/initdb.json file")
                  }
                  else pArr.push(category.add(cats[i]))
              }
    
              //promotypes init
              for(let i=0; i<ptypes.length; i++) {
                  if(!ptypes[i].name || validator.isEmpty(ptypes[i].name))
                    console.log("Warning: Missing type name field");
                  else pArr.push(promotype.add(ptypes[i]))
              }
    
              Promise.all(pArr)
              .then(r => {
                  for(let i=0; i<r.length; i++) {
                      console.log("Item " + r[i].name + " added with id " + r[i]._id);
                  }
                  if(cb) cb();
              })
            }
            else console.log("INFO: DB already initialized")
        })
        .catch(e => {
            console.log(e)
        })
      }

}
