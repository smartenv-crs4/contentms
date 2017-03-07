//IMPORTANT! Must be defined before all!
process.env.NODE_ENV='test';

var supertest = require('supertest');
var mongoose = require('mongoose');
var should = require('should');

var db = require('../lib/db');
var ships = require('../schemas/ships').ship;
var port = process.env.PORT || 3000;
var baseUrl = 'http://localhost:' + port + '/';
var request = supertest.agent(baseUrl);


var init = require('../lib/init');

var new_items = [];
var test_items = [
    {
      "ship"        : "Costa Pacifica",
      "arrival"     : "2016-12-20 8:00",
      "departure"   : "2016-12-21 22:00",
      "passengers"  : 2000
    },
    {
      "ship"        : "Costa Fascinosa",
      "arrival"     : "2016-12-10 8:00",
      "departure"   : "2016-12-12 18:00",
      "passengers"  : 2500
    }
];

let test_item = {
  "ship"        : "Queen of the seas",
  "arrival"     : "2016-12-05 8:00",
  "departure"   : "2016-12-12 22:00",
  "passengers"  : 3500
}

describe('--- Testing ship scheduling crud ---', () => {

  before((done) => {
    init.start(() => { 
      let promise_arr = [];
      test_items.forEach((item) => {
        promise_arr.push(
          ships.add(item)
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
      promise_arr.push(ships.delete(item));
    })
    Promise.all(promise_arr).then(() => {
      init.stop(() => {done()});
    });
  });


  describe('POST /ships', () => {
    it('respond with json Object containing the new ship sheduling', (done) => { 
      request
        .post('ships')
        .send(test_item)
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


  describe('GET /ships/', () => {
    it('respond with json array of three elements', (done) => {
      request
        .get('ships/')  
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("ships");
            res.body.ships.length.should.be.equal(3);
            done();
          }
        })
    });
    it('perform a search by date range and respond with an array of two elements', (done) => {
      request
        .get('ships/' + "?adate=2016-12-05&ddate=2016-12-11")  
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("ships");
            res.body.ships.length.should.be.equal(2);
            done();
          }
        })
    });
    it('perform a search by time range and respond with an array of two elements', (done) => {
      request
        .get('ships/' + "?adate=2016-12-11 16:30&ddate=2016-12-11 17:00")  
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("ships");
            res.body.ships.length.should.be.equal(2);
            done();
          }
        })
    });
    it('perform a search by date and respond with an array of three elements', (done) => {
      request
        .get('ships/' + "?ddate=2016-12-31")  
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("ships");
            res.body.ships.length.should.be.equal(3);
            done();
          }
        })
    });
    it('perform a search by ship name and respond with one element', (done) => {
      let name = "Queen";
      request
        .get('ships/' + "?ship=" + name)  
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("ships");
            res.body.ships.length.should.be.equal(1);
            res.body.ships[0].ship.should.containEql(name);
            done();
          }
        })
    });
  });

  describe('GET /ships/:id', () => {
    it('respond with json Object containing the last inserted ship sheduling', (done) => {
      request
        .put('ships/' + new_items[2])
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("ship");
            res.body.ship.should.be.equal(test_item.ship);
            done();
          }
        });
    });
  });


  describe('PUT /ships/:id', () => {
    let new_name = "Queen Of The Seas";
    it('respond with json Object containing the test doc updated', (done) => {
      request
        .put('ships/' + new_items[2])
        .send({"ship":new_name})
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            res.body.ship.should.be.equal(new_name);
            res.body.ship.should.not.be.equal(test_item);
            done();
          }
        });
    });
  });

  describe('DELETE /ships:id', () => {
    it('respond with json Object containing the deleted scheduling', (done) => {
      request
        .delete('ships/' + new_items[2])
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
        .get('ships/' + new_items[2]) 
        .expect(404)
        .end((err, res) => {
          if(err) done(err);
          else done();
        });
    })
  })

});
