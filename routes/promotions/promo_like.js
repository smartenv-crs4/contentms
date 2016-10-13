var involvements = require('../../schemas/involvement').involvement;

module.exports = {
  like : (req, res, next) => {
    let uid = req.query.uid; //TODO leggere da request field authms
    involvements.add(req.params.pid, uid)
    .then((r) => {res.json(r)})
    .catch((e) => {
      console.log(e);
      res.boom.badImplementation(e.error);
    });  
  },
  unlike : (req, res, next) => {
    let uid = req.query.uid; //TODO leggere da request field authms
    involvements.remove(req.params.pid, req.query.uid)
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
  },
  count: (req, res, next) => {
    involvements.countLike(req.params.pid)
    .then((c) => {res.json(c)})
    .catch((e) => {
      console.log(e)
      res.boom.badImplementation();
    })
  }
}
