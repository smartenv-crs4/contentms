var supertest = require('supertest');
var should = require('should');

var request = supertest.agent("http://localhost:3010");

describe('/contents', () => {
  let new_item;
  let test_item = {
    "name"        : "Il golgo",
    "type"        : "activity",
    "description" : "Ristorante tipico",
    "published"   : "true",
    "town"        : "baunei",
    "address"     : "localita' il golgo",
    "category"    : 3,
    "position"    : [9.666168, 40.080108],
    "admins"      : [],
    "owner"       : "57d0392d5ea81b820f36e41a"
  }

  describe('POST /contents/', () => {
    it('respond with json Object containing the new test item', (done) => {
      request
        .post('/api/v1/contents')
        .send(test_item)
        .expect('Content-Type', /json/)
        .expect('Location')
        .expect(201)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body.should.have.property("owner");
          res.body.should.have.property("admins");
          new_item = res.body._id;
          done();
        });
    });
  });

  describe('GET /contents/:id', () => {
    it('respond with json Object containing the test doc', (done) => {
      request
        .get('/api/v1/contents/' + new_item) 
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body._id.should.be.equal(new_item);
          done();
        });
    });
  });

  describe('PUT /contents/:id', () => {
    let new_desc = "Ristorante tipico nel supramonte di baunei";
    it('respond with json Object containing the test doc updated', (done) => {
      request
        .put('/api/v1/contents/' + new_item)
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
        .get('/api/v1/contents')
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
        .delete('/api/v1/contents/' + new_item)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((req,res) => {
          res.body.should.have.property("_id");
          res.body._id.should.be.equal(new_item);
          done();
        });
    });
  });


  describe('GET /contents/:id - 404', () => {
    it('respond with 404 error', (done) => {
      request
        .get('/api/v1/contents/' + new_item) 
        .expect(404, done);
    })
  });
});
