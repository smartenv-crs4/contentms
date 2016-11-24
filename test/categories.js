//IMPORTANT! Must be defined before all!
process.env.NODE_ENV='test';

var supertest = require('supertest');
var mongoose = require('mongoose');
var should = require('should');

var db = require('../lib/db');
var category = require('../schemas/category').category;
var port = process.env.PORT || 3000;
var baseUrl = 'http://localhost:' + port;
var prefix = '/api/v1/';
var request = supertest.agent(baseUrl);


var init = require('../lib/init');

var new_items = [];
var test_items = [
    {
      "name"        : "hotel",
      "description" : "strutture ricettive"
    },
    {
      "name"        : "ristoranti",
      "description" : "locali ristorazione"
    }];

describe('--- Testing category crud ---', () => {

  before((done) => {
    init.start(() => { 
      let promise_arr = [];
      test_items.forEach((item) => {
        promise_arr.push(
          category.add(item)
          .then((rr) => {
            new_items.push(rr._id);
          })
          .catch(e => {throw(e)})
        );
      })

      Promise.all(promise_arr).then(() => { done(); })
      .catch((e) => {
        console.log(e);
        process.exit();
      });
    });
  });

  after((done) => {
    let promise_arr = [];
    new_items.forEach((item) => {
      promise_arr.push(category.delete(item));
    })
    Promise.all(promise_arr).then(() => {
      init.stop(() => {done()});
    });
  });


  describe('POST /categories', () => {
    it('respond with json Object containing the new category', (done) => { 
      let item = test_items[0];
      request
        .post(prefix + 'categories')
        .send(item)
        .expect('Content-Type', /json/)
        .expect('Location', /.+/)
        .expect(201)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            new_items.push(res.body._id);
            done();
          }
        })
    })
  });


  describe('GET /categories/', () => {
    it('respond with json array of three elements', (done) => {
      request
        .get(prefix + 'categories/')  
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("categories");
            res.body.categories.length.should.be.equal(3);
            done();
          }
        })
    });
  });

  describe('GET /categories/:id', () => {
    it('respond with json Object containing the last inserted category', (done) => {
      request
        .put(prefix + 'categories/' + new_items[2])
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            res.body.name.should.be.equal(test_items[0].name);
            done();
          }
        });
    });
  });


  describe('PUT /categories/:id', () => {
    let new_desc = "nuova descrizione";
    it('respond with json Object containing the test doc updated', (done) => {
      request
        .put(prefix + 'categories/' + new_items[2])
        .send({"description":new_desc})
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            res.body.description.should.be.equal(new_desc);
            res.body.description.should.not.be.equal(test_items[0]);
            done();
          }
        });
    });
  });

  describe('DELETE /categories/:id', () => {
    it('respond with json Object containing the deleted category', (done) => {
      request
        .delete(prefix + 'categories/' + new_items[2])
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            res.body._id.should.be.equal(new_items[2]);
            done();
          }
        })
    });
    it('respond with 404 error to confirm previous deletion', (done) => {
      request
        .get(prefix + 'categories/' + new_items[2]) 
        .expect(404)
        .end((err, res) => {
          if(err) done(err);
          else done();
        });
    })
  })

});
