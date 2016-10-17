var config        = require('config');
var involvements  = require('../../schemas/involvement').involvement;
var authField     = config.security.decodedTokenFieldName;


function involve(req, res, type) {
  let uid = req[authField]._id
  if(!uid) {res.boom.badRequest('Missing user id');}
  else {
    involvements.add(req.params.pid, uid, type)
    .then((r) => {res.json(r)})
    .catch((e) => {
      if(e.status === 409)
        res.boom.conflict(e.error);
      else {
        console.log(e);
        res.boom.badImplementation(e.error);
      }
    });
  }
}


function uninvolve(req, res, type) {
  let uid = req[authField]._id
  if(!uid) {res.boom.badRequest('Missing user id');}
  else {
    involvements.delete(req.params.pid, uid, type)
    .then((r) => {res.json(r)})
    .catch((e) => {
      console.log(e)
      switch(e.status) {
        case 404: 
          res.boom.notFound();
          break;
        default:
          res.boom.badImplementation(e.error);
          break;
      }
    });
  }
}


function count(req, res, type) {
  let pid = req.params.pid;
  involvements.countByType(pid, type)
  .then((c) => {res.json({"promo":pid, "total":c, "type":type})})
  .catch((e) => {
    console.log(e)
    res.boom.badImplementation();
  })
}


module.exports = {
  like : (req, res, next) => {
    involve(req, res, 'like')
  },

  unlike : (req, res, next) => {
    uninvolve(req, res, 'like');
  },

  likes: (req, res, next) => {
    count(req, res, 'like');
  },
  
  participate: (req, res, next) => {
    involve(req, res, 'participation');
  },

  unparticipate: (req, res, next) => {
    uninvolve(req, res, 'participation');
  },
  
  participants: (req, res, next) => {
    count(req, res, 'participation');
  }
}
