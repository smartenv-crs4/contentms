const config = require('propertiesmanager').conf;
var validator = require('validator');

module.exports = {
  uniform : function(imgarray) {
    let retArray = [];
    for(i in imgarray) {
      if(validator.isURL(imgarray[i])) {
        retArray.push(imgarray[i]);
      }
      else {
        let code = imgarray[i];
        let url = config.uploadMsUrl;
        url = url.endsWith('/') ? url : url + '/';
        retArray.push(url + code);
      }
    }
    return retArray;
  }
}
