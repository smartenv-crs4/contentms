var involvements = require('../../schemas/involvement').involvement;

module.exports = {
  like : (req, res, next) => {
    let uid = '5800aa9c25a4441bba494893' //TODO leggere da request field authms
    if(!uid) {res.boom.badRequest('Missing user id');}
    else {
      involvements.add(req.params.pid, uid)
      .then((r) => {res.json(r)})
      .catch((e) => {
        console.log(e);
        res.boom.badImplementation(e.error);
      });
    }  
  },
  unlike : (req, res, next) => {
    let uid = '5800aa9c25a4441bba494893'; //TODO leggere da request field authms
    if(!uid) {res.boom.badRequest('Missing user id');}
    else {
      involvements.delete(req.params.pid, uid)
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
  },
  count: (req, res, next) => {
    let pid = req.params.pid;
    involvements.countLike(pid)
    .then((c) => {res.json({"promo":pid, "likes":c})})
    .catch((e) => {
      console.log(e)
      res.boom.badImplementation();
    })
  }
}
