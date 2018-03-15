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
  near: (collectionName, position, query, qlimit, qskip, result_label, cb) => {
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
        result[result_label] = normalized_res;
        result.metadata = {
          limit:qlimit,
          skip:qskip,
          farthest:normalized_res.length > 0 ? normalized_res[normalized_res.length - 1].distance : null
        }
        cb(result);
      }
    })
    .catch((e) => {
      console.log(e);
      cb(null, e);
    });
  },

  uniformPosition: function(obj) {
    //la query spaziale ereditata da hp usa due campi lat e lon mentre la query 
    //con indice spaziale di mongo usa un array [lon, lat] quindi e' opportuno 
    //mantenere sempre i campi allineati
    if(obj.position && obj.position.length == 2) {
      if(obj.lat && obj.lon) { //priorita' a lat/lon
        obj.position[0] = obj.lon;
        obj.position[1] = obj.lat;
      }
      else {
        obj.lat = obj.position[1];
        obj.lon = obj.position[0];
      }
    }
    else if(obj.lat && obj.lon) {
      obj.position[0] = obj.lon;
      obj.position[1] = obj.lat;
    }
    return obj;
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
  },
  

  //metodo HandyParking, supporta skip/limit e non usa geoIndex quindi si puo' usare con $text
  hpNear: (collectionName, position, query, qlimit, qskip, result_label, cb) => {
    var lat = position.lat;
    var lng = position.lon;
    var near = [ lng, lat ]; // near must be an array of [lng, lat]
    var dist = position.dist * 1000; //meters ;/// 6378137 ;
    var diag = dist * Math.sqrt(2);
    var start = LatLon(lat,lng);
    var top_r = start.destinationPoint(diag,45,6378137);
    var bot_l = start.destinationPoint(diag,225,6378137);

    var min_lat = Math.min(top_r.lat, bot_l.lat);
    var max_lat = Math.max(top_r.lat, bot_l.lat);
    var min_lon = Math.min(top_r.lon, bot_l.lon);
    var max_lon = Math.max(top_r.lon, bot_l.lon);

    let geoquery = { 
      "lat" : {$gt :min_lat , $lt : max_lat}, 
      "lon" : {$gt:min_lon, $lt:max_lon} 
    }
    if(query != null)
      geoquery = {"$and":[geoquery, query]};

    mongoose.model(collectionName).find(
      geoquery,
      null,
      {
        lean:true, 
        limit:qlimit, 
        skip:qskip
      }, 
      function (err, results) {
        if(err) cb(null, err);
        else {
          for (r in results) {
            var point = LatLon(results[r].position[1],results[r].position[0])
            results[r]["distance"] = start.rhumbDistanceTo(point);
          }
          let ret = {}
          ret[result_label] = results;
          ret.metadata = {limit:qlimit, skip:qskip}
          cb(ret);
        }
      }
    );
  }
}



function LatLon(lat, lon) {
    // allow instantiation without 'new'
    if (!(this instanceof LatLon)) return new LatLon(lat, lon);

    this.lat = Number(lat);
    this.lon = Number(lon);
}


LatLon.prototype.destinationPoint = function(distance, bearing, radius) {
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    // see http://williams.best.vwh.net/avform.htm#LL

    var δ = Number(distance) / radius; // angular distance in radians
    var θ = Number(bearing).toRadians();

    var φ1 = this.lat.toRadians();
    var λ1 = this.lon.toRadians();

    var φ2 = Math.asin( Math.sin(φ1)*Math.cos(δ) +
    Math.cos(φ1)*Math.sin(δ)*Math.cos(θ) );
    var λ2 = λ1 + Math.atan2(Math.sin(θ)*Math.sin(δ)*Math.cos(φ1),
            Math.cos(δ)-Math.sin(φ1)*Math.sin(φ2));
    λ2 = (λ2+3*Math.PI) % (2*Math.PI) - Math.PI; // normalise to -180..+180°

    return new LatLon(φ2.toDegrees(), λ2.toDegrees());
};

// Extend Number object with method to convert numeric degrees to radians /
if (Number.prototype.toRadians === undefined) {
    Number.prototype.toRadians = function() { return this * Math.PI / 180; };
}

// Extend Number object with method to convert radians to numeric (signed) degrees 
if (Number.prototype.toDegrees === undefined) {
    Number.prototype.toDegrees = function() { return this * 180 / Math.PI; };
}

LatLon.prototype.rhumbDistanceTo = function(point, radius) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    // see http://williams.best.vwh.net/avform.htm#Rhumb

    var R = radius;
    var φ1 = this.lat.toRadians(), φ2 = point.lat.toRadians();
    var Δφ = φ2 - φ1;
    var Δλ = Math.abs(point.lon-this.lon).toRadians();
    // if dLon over 180° take shorter rhumb line across the anti-meridian:
    if (Math.abs(Δλ) > Math.PI) Δλ = Δλ>0 ? -(2*Math.PI-Δλ) : (2*Math.PI+Δλ);

    // on Mercator projection, longitude distances shrink by latitude; q is the 'stretch factor'
    // q becomes ill-conditioned along E-W line (0/0); use empirical tolerance to avoid it
    var Δψ = Math.log(Math.tan(φ2/2+Math.PI/4)/Math.tan(φ1/2+Math.PI/4));
    var q = Math.abs(Δψ) > 10e-12 ? Δφ/Δψ : Math.cos(φ1);

    // distance is pythagoras on 'stretched' Mercator projection
    var δ = Math.sqrt(Δφ*Δφ + q*q*Δλ*Δλ); // angular distance in radians
    var dist = δ * R;

    return dist;
};



