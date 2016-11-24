//IMPORTANT! Must be defined before all!
process.env.NODE_ENV='test';

var supertest = require('supertest');
var should = require('should');

var db = require('../lib/db');
var contents = require('../schemas/content');
var port = process.env.PORT || 3000;
var baseUrl = "http://localhost:" + port;
var prefix = '/api/v1/';
var request = supertest.agent(baseUrl);
var fakeuid = 'aaaaaaaaaaaaaaaaaaaaaaaa';
var fakeuidpar = '?fakeuid=' + fakeuid


var init = require('../lib/init');

let search_items = [
  {
      "name" : "Il golgo",
      "type" : "activity",
      "description" : "Ristorante tipico",
      "published" : true,
      "town" : "baunei",
      "address" : "localita' il golgo",
      "position" : [ 
          9.666168, 
          40.080108
      ],
      "owner" : fakeuid,
      "category" : [3],
      "admins" : []
  },

  {
      "name" : "hotel bue marino",
      "type" : "activity",
      "description" : "hotel con terrazza panoramica vista porto",
      "published" : true,
      "town" : "calagonone",
      "position" : [ 
          9.6378597, 
          40.283566
      ],
      "owner" : fakeuid,
      "category" : [3],
      "admins" : []
  }
]

let test_item = {
  "name" : "hotel la baia",
  "type" : "activity",
  "description" : "hotel con terrazza panoramica vista baia santa caterina",
  "published" : true,
  "town" : "santa caterina di pittinuri",
  "position" : [ 
      8.4884164, 
      40.1054929
   ],
  "owner" : fakeuid,
  "category" : [3],
  "admins" : []
}

describe('--- Testing contents crud ---', () => {
  let search_items_ids = [];
  let new_item;

  before((done) => {
    init.start(() => {
      let promise_arr = [];
      search_items.forEach((item) => {
        promise_arr.push(
          (new contents.content(item))
          .save()
          .then((rr) => {
            search_items_ids.push(rr._id);
          })
          .catch(e => {throw(e)})
        );
      })

      Promise.all(promise_arr)
      .then(() => { done(); })
      .catch((e) => {
        console.log(e);
        process.exit();
      })
    });
  });


  after((done) => {
   let parr = [];
    search_items_ids.forEach((item) => {
      parr.push(contents.content.delete(item));
    });
    parr.push(contents.content.delete(new_item));
    Promise.all(parr)
    .then(() => {
      init.stop(() => {done()});
    });
  });


  describe('POST /contents/', () => {
    it('respond with json Object containing the new test item', (done) => {
      request
        .post(prefix + 'contents' + fakeuidpar)
        .send(test_item)
        .expect('Content-Type', /json/)
        .expect('Location', /.+/)
        .expect(201)
        .end((err,res) => {
          if(err) done(err);
          else {
            new_item = res.body._id;
            res.body.should.have.property("_id");
            res.body.should.have.property("owner");
            res.body.should.have.property("admins");
            done();
          }
        });
    });
  });


  describe('GET /contents/:id', () => {
    it('respond with json Object containing the test doc', (done) => {
      request
        .get(prefix + 'contents/' + new_item + fakeuidpar) 
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            res.body._id.should.be.equal(new_item+'');
            done();
          }
        });
    });
  });


  describe('PUT /contents/:id', () => {
    let new_desc = "Ristorante tipico nel supramonte di baunei";
    it('respond with json Object containing the test doc updated', (done) => {
      request
        .put(prefix + 'contents/' + new_item + fakeuidpar)
        .send({"description":new_desc})
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            res.body.description.should.be.equal(new_desc);
            done();
          }
        });
    });
  });


  describe('GET /contents/', () => {
    it('respond with json Object containing contents array', (done) => {
      request
        .get(prefix + 'contents' + fakeuidpar)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("contents");
            res.body.contents.should.be.instanceOf(Array);
            res.body.contents.length.should.be.equal(3);
            if(res.body.contents.length > 0) {
              res.body.contents.forEach((item) => {
                item.should.have.property("_id");
              });
            }
            done();
          }
        });
    });
    it('run a geo query with 1km radius and respond with one element array', (done) => {
      let position_pars = [9.666168,40.080108,1];
      request
        .get(prefix + 'contents' + fakeuidpar + '&position=' + position_pars.toString())
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("contents");
            res.body.contents.should.be.instanceOf(Array);
            res.body.contents.length.should.be.equal(1);  
            done();
          }
        });
    });
    it('run a geo query with 25km radius and respond with two elements array', (done) => {
      let position_pars = [9.666168,40.080108,25];
      request
        .get(prefix + 'contents' + fakeuidpar + '&position=' + position_pars.toString())
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("contents");
            res.body.contents.should.be.instanceOf(Array);
            res.body.contents.length.should.be.equal(2);  
            done();
          }
        });
    });
  });


  describe('DELETE /contents/:id', () => {
    it('respond with json Object containing the deleted test doc', (done) => {
      request
        .delete(prefix + 'contents/' + new_item + fakeuidpar)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            res.body._id.should.be.equal(new_item+'');
            done();
          }
        });
    });
    it('respond with 404 error to confirm previous deletion', (done) => {
      request
        .get(prefix + 'contents/' + new_item + fakeuidpar) 
        .expect(404)
        .end((err, res) => {
          if(err) done(err);
          else done();
        });
    })
  });


  //actions
  //restore the previously deleted test element
  describe('--- Testing Content Actions ---', () => {
    before((done) => {
      (new contents.content(test_item))
      .save()
      .then((r) => {
        new_item = r._id;
        done();
      })
      .catch((e) => {
        console.log(e);
        process.exit();
      })
    });

    after((done) => {
      contents.content.delete(new_item)
      .then(done());
    });

    describe('POST /contents/:id/actions/{addAdmin,removeAdmin}', () => {
      let newAdmin = "bbbbbbbbbbbbbbbbbbbbbbbb";
      it('respond with json Object containing the list of admins', (done) => {
        request
          .post(prefix + 'contents/' + new_item + '/actions/addAdmin' + fakeuidpar)
          .send({"userId":newAdmin})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err,res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("_id");
              res.body.should.have.property("admins");
              res.body.admins.should.containEql(newAdmin);
              done();
            }
          });
      });

      it('respond with the list of admins without the previously inserted user (length 0)', (done) => {
        request
          .post(prefix + 'contents/' + new_item + '/actions/removeAdmin' + fakeuidpar)
          .send({"userId":newAdmin})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err,res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("_id");
              res.body.should.have.property("admins").with.lengthOf(0);
              res.body.admins.should.not.containEql(newAdmin);
              done();
            }
          });
      });
    });

    describe('POST /contents/:id/actions/{addCategory,removeCategory}', () => {
      let newCat = 111; //fake cat
      it('respond with json list of categories for this content', (done) => {
        request
          .post(prefix + 'contents/' + new_item + '/actions/addCategory' + fakeuidpar)
          .send({"categoryId":newCat})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err,res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("_id");
              res.body.should.have.property("category");
              res.body.category.should.containEql(newCat);
              done();
            }
          });
      });

      it('respond with the list of categories without the previously inserted category (length 1)', (done) => {
        request
          .post(prefix + 'contents/' + new_item + '/actions/removeCategory' + fakeuidpar)
          .send({"categoryId":newCat})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err,res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("_id");
              res.body.should.have.property("category").with.lengthOf(1);
              res.body.category.should.not.containEql(newCat);
              done();
            }
          });
      });
    });
  });
});
