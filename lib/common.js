const config = require('propertiesmanager').conf;
var involvement = require('../schemas/involvement.js').involvement;
const authField = config.decodedTokenFieldName;
const rp = require('request-promise');
const validator = require('validator');

module.exports = {
  uniformImages : function(imgarray) {
    /*
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
    */
    return imgarray;
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
                        if(filter[key] == undefined) 
                            filter[key] = varr; //one instance
                        else if(one_instance_keys.indexOf(key) == -1) 
                            filter[key] = filter[key].concat(varr); //array
                    }
                }
                else {                    
                    filter[key] = value.split(",");
                }
            }
        });
        //console.log("FILTER: " + JSON.stringify(filter))
        return filter;
    },

    getLikes: function(a) {
        let pa = [];
        for(let i=0; i<a.length; i++) {
            pa.push(involvement.countByType(a[i]._id, "like"));
        }
        return Promise.all(pa);
    },
    
    //WARNING questo metodo lega il multilingua di interfaccia 6.1 a questo microservizio....
    getTranslation(content, lang) {
        let multilanguage = {};
        let deflang = undefined;
        if(content.search(/\[\[\w{2}\]\]/igm)>=0){
            let indexStartTag,indexEndTag;
            let tmpLang;
            indexStartTag=content.search(/\[\[\w{2}\]\]/igm);
            do{
                indexStartTag+=2;// +2 due to [[
                tmpLang=content.substr(indexStartTag,2);
                if(!deflang) deflang = tmpLang
                indexEndTag=content.search(new RegExp("\\[\\[\\/\\" + tmpLang + "\\]\\]","igm"));
                multilanguage[tmpLang]=content.substring(indexStartTag+4,indexEndTag); //+4 due to xx]]
                content=content.substr(indexEndTag+7);// 7 due to [[/xx]]
                indexStartTag=content.search(/\[\[\w{2}\]\]/igm) ;
            }while (indexStartTag>=0);
      
        }
        if(multilanguage[lang] && multilanguage[lang].length > 0)
            return multilanguage[lang];
        else if(multilanguage[deflang] && multilanguage[deflang].length)
            return multilanguage[deflang];
        else
            return content
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