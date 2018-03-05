const config = require('propertiesmanager').conf;
const authField = config.decodedTokenFieldName;
const rp = require('request-promise');
const validator = require('validator');

module.exports = {
  uniformImages : function(imgarray) {
    let retArray = [];
    if(imgarray) {
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
    }
    return retArray;
  },

    getSuperusers: () => {
        return getSuperusers();
    },

    isContentAdmin: (content_data, req) => {
        let uid = req[authField].token._id;
        return new Promise((resolve, reject) => {
            getSuperusers()
            .then(tokenarray => {
                let isGlobalAdmin = tokenarray.indexOf(req[authField].token.type) != -1;
                
                if(!uid) reject(new Error(1))
                else if(acontains(content_data.admins, uid) 
                        || uid == content_data.owner
                        || isGlobalAdmin) {
                    resolve(true)
                }
                else {                    
                    resolve(false)
                }
            })
            .catch(e => {
                console.log(e);
                reject(e); //or throw??
            })
        });
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

function getSuperusers() {
    return rp({
        uri: config.authUrl + (config.authUrl.endsWith('/') ? '' : '/') + 'tokenactions/getsupeusertokenlist',
        method:"GET",
        headers: {
            Authorization: "Bearer " + config.auth_token
        }
    })
}

function acontains(a, v) {
    for(var i=0; i<a.length; i++) {
        if(a[i] == v) return true;
    }
    return false;
}