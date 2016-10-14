var supertest = require('supertest');
var mongoose = require('mongoose');
var config = require('config');
var should = require('should');

var db = require('../lib/db');
var promotions = require('../schemas/promotion');
var contents = require('../schemas/content');

var baseUrl = 'http://localhost:3010'; //TODO parametrizzare
var prefix = '/api/v1/';
var request = supertest.agent(baseUrl);

var father_id;
var new_items = [];
var test_items = [
    {
      "name"        : "fregola night",
      "type"        : "offer",
      "description" : "cena a base di fregola",
      "startDate"   : "2016-9-30",
      "endDate"     : "2016-9-30",
      "price"       : 25,
      "position"    : [9.666168, 40.080108]
    },
    {
      "name"        : "Autunno in barbagia - orgosolo",
      "type"        : "offer",
      "description" : "Manifestazione promozionale di artigianato e prodotti locali",
      "startDate"   : "2016-10-14",
      "endDate"     : "2016-10-16",
      "price"       : 25,
      "position"    : [9.666168, 40.080108]
    }];

describe('--- Testing promotions crud ---', () => {

  before((done) => {
    db.connect()

    let content_father = {
      "name"        : "Da Gianni",
      "type"        : "activity",
      "description" : "Ristorante tipico inserimento di test",
      "published"   : "true",
      "town"        : "Cagliari",
      "address"     : "localita' cala mosca",
      "category"    : 3,
      "position"    : [9.666168, 40.080108],
      "admins"      : [],
      "owner"       : "57d0392d5ea81b820f36e41a"
    };

    (new contents.content(content_father))
    .save()
    .then((r) => {
      father_id = r._id;
      let promise_arr = [];
      test_items.forEach((item) => {
        item.idcontent = father_id;
        promise_arr.push(
          (new promotions.promotion(item))
          .save()
          .then((rr) => {
            new_items.push(rr._id);
          })
          .catch(e => {throw(e)})
        );
      })
      Promise.all(promise_arr).then(done());
    })
    .catch((e) => {
      console.log(e);
      process.exit();
    });
  });

  after((done) => {
    let promise_arr = [];
    new_items.forEach((item) => {
      promise_arr.push(promotions.promotion.delete(father_id, item));
    })
    promise_arr.push(contents.content.delete(father_id));
    Promise.all(promise_arr).then(done());
  });


  describe('POST /contents/:id/promotions', () => {
    it('respond with json Object containing the new test item', (done) => { 
      let item = test_items[0];
      item.idcontent = father_id;
      request
        .post(prefix + 'contents/' + father_id + '/promotions')
        .send(item)
        .expect('Content-Type', /json/)
        .expect('Location')
        .expect(201)
        .end((req,res) => {
          res.body.should.have.property("_id");
          new_items.push(res.body._id);
          done();
        })
    })
  });


  describe('GET /contents/:id/promotions/:pid', () => {
    it('respond with json Object containing the test doc', (done) => {
      request
        .get(prefix + 'contents/' + father_id + '/promotions/' + new_items[0]) 
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body._id.should.be.equal(new_items[0]+'');
          done();
        })
    });
  });



  describe('PUT /contents/:id/promotions/:pid', () => {
    let new_desc = "Ristorante tipico nel supramonte di baunei";
    it('respond with json Object containing the test doc updated', (done) => {
      request
        .put(prefix + 'contents/' + father_id + '/promotions/' + new_items[2])
        .send({"description":new_desc})
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body.description.should.be.equal(new_desc);
          res.body.description.should.not.be.equal(test_items[0]);
          done();
        });
    });
  });


  describe('GET /contents/:id/promotions/', () => {
    it('respond with json Object containing promo array of at least 2 items', (done) => {
      request
        .get(prefix + 'contents/' + father_id + '/promotions/')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("promos");
          res.body.promos.should.be.instanceOf(Array);
          res.body.promos.length.should.be.aboveOrEqual(2);
          if(res.body.promos.length > 0) {
            res.body.promos.forEach((item) => {
              item.should.have.property("_id");
            });
          }
          done();
        });
    });
  });


  describe('DELETE /contents/:id/promotions/:pid', () => {
    it('respond with json Object containing the deleted test doc', (done) => {
      request
        .delete(prefix + 'contents/' + father_id + '/promotions/' + new_items[1])
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body._id.should.be.equal(new_items[1]+'');
          done();
        })
    })
  })

  describe('GET /contents/:id/promotions/:pid - 404', () => {
    it('respond with 404 error', (done) => {
      request
        .get(prefix + 'contents/' + father_id + '/promotions/' + new_items[1]) 
        .expect(404, done);
    })
  });

  describe('POST /contents/:id/promotions/:pid/actions/{like,count,unlike}', () => {
    it('(like) respond with 200 and {success:true}', (done) => {
      request
        .post(prefix + 'contents/' + father_id + '/promotions/' + new_items[0] +'/actions/like')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req, res) => {
          res.body.should.have.property("success");
          res.body.success.should.be.equal(true);
          done()
        })
    });

    it('(count) respond with 200 and {likes: 1}', (done) => {
      request
        .post(prefix + 'contents/' + father_id + '/promotions/' + new_items[0] +'/actions/count')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req, res) => {
          res.body.should.have.property("promo");
          res.body.promo.should.be.equal(new_items[0]+'');
          res.body.should.have.property("likes");
          res.body.likes.should.be.equal(1);
          done()
        })
    });
  
    it('(unlike) respond with 200 and {success: true}', (done) => {
      request
        .post(prefix + 'contents/' + father_id + '/promotions/' + new_items[0] +'/actions/unlike')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req, res) => {
          res.body.should.have.property("success");
          res.body.success.should.be.equal(true);
          done()
        })
    });

    it('(count) respond with {likes : 0} to confirm previous deletion', (done) => {
      request
        .post(prefix + 'contents/' + father_id + '/promotions/' + new_items[0] +'/actions/count')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req, res) => {
          res.body.should.have.property("promo");
          res.body.promo.should.be.equal(new_items[0]+'');
          res.body.should.have.property("likes");
          res.body.likes.should.be.equal(0);
          done()
        })
    });
  });


});
