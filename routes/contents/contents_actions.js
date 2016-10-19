var content = require('../../schemas/content').content;

module.exports = {

  addAdmin: (req, res, next) => {
    content.addAdmin(req.params.id, [req.body.userId])
    .then(r => {res.json(r);})
    .catch(e => {
      if(e.status === 400) res.boom.badRequest(e.error);
      else res.boom.badImplementation();
    });
  },


  removeAdmin: (req, res, next) => {
    content.removeAdmin(req.params.id, [req.body.userId])
    .then(r => {res.json(r);})
    .catch(e => {
      if(e.status === 400) res.boom.badRequest(e.error);
      else res.boom.badImplementation();
    });
  },


  addCategory: (req, res, next) => {
  },


  removeCategory: (req, res, next) => {
  }
}
