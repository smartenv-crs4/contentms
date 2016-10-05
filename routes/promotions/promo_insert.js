var promotion = require('../../schemas/promotion.js').promotion;

module.exports = function(req, res, next) {
  if(Object.keys(req.body).length === 0) {
    res.boom.badRequest('empty object');
  }
  //TODO SEE IF IS ADMIN (middleware ale)
  else {
    let promo = new promotion(req.body);
    promo.idcontent = req.params.id;
    promo.startDate = new Date(req.body.startDate);
    promo.endDate = new Date(req.body.endDate);

    promo.save()
    .then(newpromo => {
      res.setHeader("Location", 
        "localhost:3010/api/v1/contents/"
        + newpromo.idcontent
        + "/promotions/" + newpromo._id);

      res.status(201).json(newpromo)
    })
    .catch(e => {
      console.log(e);
      res.boom.badImplementation();
    });
  }
}
