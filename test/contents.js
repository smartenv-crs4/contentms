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

process.env.NODE_ENV='test';

var init = require('../lib/init');

let test_item = {
  "name"        : "Il golgo",
  "type"        : "activity",
  "description" : "Ristorante tipico",
  "published"   : "true",
  "town"        : "baunei",
  "address"     : "localita' il golgo",
  "category"    : [3],
  "position"    : [9.666168, 40.080108],
  "admins"      : [],
  "owner"       : fakeuid
}

describe('--- Testing contents crud ---', () => {
  let new_item;

  before((done) => {
    init.start(() => {
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
  });


  after((done) => {
    contents.content.delete(new_item)
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
        .expect('Location')
        .expect(201)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body.should.have.property("owner");
          res.body.should.have.property("admins");
          done();
        });
    });
  });


  describe('GET /contents/:id', () => {
    it('respond with json Object containing the test doc', (done) => {
      request
        .get(prefix + 'contents/' + new_item + fakeuidpar) 
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body._id.should.be.equal(new_item+'');
          done();
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
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body.description.should.be.equal(new_desc);
          done();
        });
    });
  });


  describe('GET /contents/', () => {
    it('respond with json Object containing contents array', (done) => {
      request
        .get(prefix + 'contents' + fakeuidpar)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("contents");
          res.body.contents.should.be.instanceOf(Array);
          if(res.body.contents.length > 0) {
            res.body.contents.forEach((item) => {
              item.should.have.property("_id");
            });
          }
          done();
        });
    });
  });


  describe('DELETE /contents/:id', () => {
    it('respond with json Object containing the deleted test doc', (done) => {
      request
        .delete(prefix + 'contents/' + new_item + fakeuidpar)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body._id.should.be.equal(new_item+'');
          done();
        });
    });
  });


  describe('GET /contents/:id - 404', () => {
    it('respond with 404 error', (done) => {
      request
        .get(prefix + 'contents/' + new_item + fakeuidpar) 
        .expect(404, done);
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

    describe('POST /contents/:id/actions/{addAdmin,removeAdmin}', () => {
      let newAdmin = "bbbbbbbbbbbbbbbbbbbbbbbb";
      it('respond with json Object containing the list of admins', (done) => {
        request
          .post(prefix + 'contents/' + new_item + '/actions/addAdmin' + fakeuidpar)
          .send({"userId":newAdmin})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((req,res) => {
            res.body.should.have.property("_id");
            res.body.should.have.property("admins");
            res.body.admins.should.containEql(newAdmin);
            done();
          });
      });

      it('respond with the list of admins without the previously inserted user (length 0)', (done) => {
        request
          .post(prefix + 'contents/' + new_item + '/actions/removeAdmin' + fakeuidpar)
          .send({"userId":newAdmin})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((req,res) => {
            res.body.should.have.property("_id");
            res.body.should.have.property("admins").with.lengthOf(0);
            res.body.admins.should.not.containEql(newAdmin);
            done();
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
          .end((req,res) => {
            res.body.should.have.property("_id");
            res.body.should.have.property("category");
            res.body.category.should.containEql(newCat);
            done();
          });
      });

      it('respond with the list of categories without the previously inserted category (length 1)', (done) => {
        request
          .post(prefix + 'contents/' + new_item + '/actions/removeCategory' + fakeuidpar)
          .send({"categoryId":newCat})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((req,res) => {
            res.body.should.have.property("_id");
            res.body.should.have.property("category").with.lengthOf(1);
            res.body.category.should.not.containEql(newCat);
            done();
          });
      });
    });
  });
});
