let mongoose = require('mongoose');


module.exports = exports = {
//WARNING: geoNear non ha skip
//TODO implementare lo skip salvando l'ultima dist (sono ordinate) e usando minDistance = lastdistance + 0.1
//TODO limitare il raggio di ricerca a una dimensione massima sensata

/**
  * position parameter must be:
  * {
  *   lon:0.000,
  *   lat:0.000,
  *   dist:123,
  *   min:123 //optional
  * }
  *
  */
  near: (collectionName, position, query, qlimit, cb) => {
    let options = {
      spherical:true, 
      query:query, 
      maxDistance:position.dist * 1000, 
      limit:qlimit
    }
    if(position.min) options["minDistance"] = position.min;

    mongoose.model(collectionName).geoNear(
      { type:'Point', coordinates: [position.lon, position.lat] },
      options
    )
    .then((res, err) => {
      if(err) cb(null, err);
      else {
        let normalized_res = [];
        for(rid in res) {
          let distance = (res[rid].dis/1000) + "";
          let obj = res[rid].obj._doc;
          obj["distance"] = Number(distance.slice(0,distance.indexOf('.')+3));
          normalized_res.push(obj);
        }
        let result = {};
        result.contents = normalized_res;
        result.metadata = {
          limit:qlimit,
          farthest:normalized_res[normalized_res.length - 1]
        }
        cb(result);
      }
    })
    .catch((e) => {
      console.log(e);
      cb(null, e);
    });
  },

  getPosition: (arr) => {
    let position = undefined;
    if(Array.isArray(arr) && arr.length >= 3) {
      position = {};
      position["lon"]   = Number(arr[0]);
      position["lat"]   = Number(arr[1]);
      position["dist"]  = Number(arr[2]);
      if(arr[3]) position["min"] = Number(arr[3]);
    }
    return position;
  }

}
