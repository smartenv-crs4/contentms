var content = require('../../schemas/content').content;

module.exports = {

  addAdmin: (req, res, next) => {
    let uid = req.body.userId;
    content.addAdmin(req.params.id, [uid])
    .then(r => {res.json(r);})
    .catch(e => {
      if(e.status === 400) res.boom.badRequest(e.error);
      else res.boom.badImplementation();
    });
  },


  removeAdmin: (req, res, next) => {
    let uid = req.body.userId;
    content.removeAdmin(req.params.id, [uid])
    .then(r => {res.json(r);})
    .catch(e => {
      if(e.status === 400) res.boom.badRequest(e.error);
      else res.boom.badImplementation();
    });
  },


  addCategory: (req, res, next) => {
    var catId = req.body.categoryId;
    if(Number.isInteger(catId)) {
      content.addCategory(req.params.id, [catId])
      .then(r => {res.json(r);})
      .catch(e => {
        if(e.status === 400) res.boom.badRequest(e.error);
        else res.boom.badImplementation();
      });
    }
    else res.boom.badRequest('Invalid category format');
  },


  removeCategory: (req, res, next) => {
    var catId = req.body.categoryId;
    if(Number.isInteger(catId)) {
      content.removeCategory(req.params.id, [catId])
      .then(r => {res.json(r);})
      .catch(e => {
        if(e.status === 400) res.boom.badRequest(e.error);
        else res.boom.badImplementation();
      });
    }
    else res.boom.badRequest('Invalid category format');
  }
}
