const config = require('propertiesmanager').conf;
var validator = require('validator');

module.exports = {
  uniformImages : function(imgarray) {
    let retArray = [];
    for(var i=0; i<imgarray.length; i++) {      
      if(validator.isURL(imgarray[i])) {
        retArray.push(imgarray[i]);
      }
      else {
        let code = imgarray[i];
        let url = config.uploadUrl;
        url = url.endsWith('/') ? url : url + '/';
        retArray.push(url + 'file/' + code);
      }
    }
    return retArray;
  },

  allowedKeys : function(allowed_keys, one_instance_keys, filter, query) {
    allowed_keys.forEach((key) => {
      let value = query[key];
      if(value != undefined) {
        if(Array.isArray(value)) {
          for(let el in value) {
            let varr = value[el].split(",");
            if(filter[key] == undefined) filter[key] = varr;
            else if(one_instance_keys.indexOf(key) == -1) filter[key] = filter[key].concat(varr);
          }
        }
        else filter[key] = value.split(",");
      }
    });
    return filter;
  }
}
