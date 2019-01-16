//IMPORTANT! Must be defined before all!
process.env.NODE_ENV='test';

var supertest = require('supertest');
var mongoose = require('mongoose');
var should = require('should');

var db = require('../lib/db');
var promotions = require('../schemas/promotion');
var contents = require('../schemas/content');
var port = process.env.PORT || 3000;
var baseUrl = 'http://localhost:' + port + '/';
var request = supertest.agent(baseUrl);

var init = require('../lib/init');

var lastUpdate = undefined;
var fakeuid = 'aaaaaaaaaaaaaaaaaaaaaaaa';
var fakeuidpar = '?fakeuid=' + fakeuid;
var father_id;
var new_items = [];
var test_items = [
    {
      "name"        : "porcino night",
      "type"        : 1,
      "published"   : true,
      "description" : "cena a base di funghi porcini",
      "startDate"   : "2016-9-30",
      "endDate"     : "2016-9-30",
      "price"       : 25,
      "position"    : [9.666168, 40.080108],
      "lat"         : 40.080108,
      "lon"         : 9.666168
    },
     {
      "name"        : "Redentore - nuoro",
      "type"        : 1,
      "published"   : true,
      "description" : "Manifestazione folkloristica locale",
      "startDate"   : "2016-10-14",
      "endDate"     : "2016-10-20",
      "price"       : 0,
      "position"    : [9.368859, 40.203488],
      "lat"         : 40.203488,
      "lon"         : 9.368859,
    },
    {
      "name"        : "Autunno in barbagia - orgosolo",
      "type"        : 1,
      "published"   : true,
      "description" : "Manifestazione promozionale di artigianato e prodotti locali",
      "startDate"   : "2016-10-14",
      "endDate"     : "2016-10-16",
      "price"       : 25,
      "position"    : [9.3534625, 40.203488],
      "lat"         : 40.203488,
      "lon"         : 9.3534625
    }
];

describe('--- Testing promotions crud ---', () => {

    before((done) => {
        let content_father = {
          "name"        : "Da Gianni",
          "type"        : "activity",
          "vat"         : "22222222222",
          "description" : "Ristorante tipico inserimento di test",
          "published"   : "true",
          "town"        : "Cagliari",
          "address"     : "localita' cala mosca",
          "category"    : 3,
          "position"    : [9.153488, 39.186334],
          "lat"         : 39.186334,
          "lon"         : 9.153488,
          "admins"      : [],
          "owner"       : fakeuid
        };

        init.start(() => { 
            (new contents.content(content_father))
            .save()
            .then((r) => {
                father_id = r._id;
                let promise_arr = [];
                test_items.forEach((item) => {
                    item.idcontent = father_id;
                    promise_arr.push(
                        new Promise((resolve, reject) => {
                            (new promotions.promotion(item))
                            .save()
                            .then((rr) => {
                                new_items.push(rr._id);
                                resolve(rr._id);
                            })
                            .catch(e => {throw(e);reject();})
                        })
                    )
                })
                Promise.all(promise_arr)
                .then((v) => {
                    done();
                })
            })
            .catch((e) => {
                console.log(e);
                process.exit();         
            });
        });
    });

    after((done) => {
        let promise_arr = [];
        new_items.forEach((item) => {
            promise_arr.push(promotions.promotion.delete(father_id, item));
        })
        promise_arr.push(contents.content.delete(father_id));
        Promise.all(promise_arr).then(() => {
            init.stop(() => {done()});
        });
    });


  describe('POST /contents/:id/promotions', () => {
    it('respond with json Object containing the new test item', (done) => { 
      let item =  {
        "name"        : "Festa dei Candelieri",
        "type"        : 1,
        "description" : "Manifestazione folkloristica tradizionale",
        "startDate"   : "2017-8-14",
        "endDate"     : "2017-8-16",
        "price"       : 0,
        "position"    : [8.559355, 40.727209],
        "lat"         : 40.727209,
        "lon"         : 8.559355
      }

      item.idcontent = father_id;
      request
        .post('contents/' + father_id + '/promotions' + fakeuidpar)
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


  describe('GET /contents/:id/promotions/:pid', () => {
    it('respond with json Object containing the test doc', (done) => {
      request
        .get('contents/' + father_id + '/promotions/' + new_items[new_items.length - 1] + fakeuidpar) 
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("_id");
            res.body.name.should.be.containEql("Candelieri");
            done();
          }
        })
    });
  });



  describe('PUT /contents/:id/promotions/:pid', () => {
    let new_desc = "Ristorante tipico nel supramonte di baunei";

    it('respond with json Object containing the test doc updated', (done) => {
      setTimeout(() => {
        request
          .put('contents/' + father_id + '/promotions/' + new_items[2] + fakeuidpar)
          .send({"description":new_desc})
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err,res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("lastUpdate");
              lastUpdate = res.body.lastUpdate;
              res.body.description.should.be.equal(new_desc);
              res.body.description.should.not.be.equal(test_items[0]);
              done();
            }
          });
        }, 1000)
    });
  });


  describe('GET /search/?t=promo', () => {
    it("respond with json Object containing promo array of at least 2 items", (done) => {
      request
        .get('search' + fakeuidpar + '&t=promo')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("promos");
            res.body.promos.should.be.instanceOf(Array);
            res.body.promos.length.should.be.aboveOrEqual(2);
            if(res.body.promos.length > 0) {
              res.body.promos.forEach((item) => {
                item.should.have.property("_id");
              });
            }  
            done();
          }
        });
      });
    it('perform a text search and respond with an array of at least one item', (done) => {
      let text_search = "porcino";
      request
        .get('search' + fakeuidpar + '&t=promo' + '&text=' + text_search)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("promos");
            res.body.promos.should.be.instanceOf(Array);
            res.body.promos.length.should.be.aboveOrEqual(1);
            res.body.promos[0].should.have.property('name');
            res.body.promos[0].name.should.containEql(text_search);
            done();
          }
        })
      });
    it('perform a search by idcontent', (done) => {
        request
          .get('search' + fakeuidpar + '&t=promo&idcontent=' + father_id)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err,res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("promos");
              res.body.promos.should.be.instanceOf(Array);
              res.body.promos.length.should.be.aboveOrEqual(1);
              for(let i=0; i<res.body.promos.length; i++) {
                res.body.promos[i].should.have.property('idcontent');
                res.body.promos[i].idcontent.should.containEql(father_id);
              }
              done();
            }
          })
        });
    it('perform a text and daterange search and respond with an empty array', (done) => {
        let text_search = "funghi porcini";
        let date_search = "2016-10-15"
        request
            .get('search' + fakeuidpar + '&t=promo' + '&text=' + text_search + '&sdate=' + date_search)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err,res) => {
                if(err) done(err);
                else {
                    res.body.should.have.property("promos");
                    res.body.promos.should.be.instanceOf(Array);
                    res.body.promos.length.should.be.equal(0);
                    done();
                }
            })
        });
    it('perform a daterange search and respond with an array of one element', (done) => {
        let sdate = "2016-10-19"
        let edate = "2016-10-20"
        request
            .get('search' + fakeuidpar + '&t=promo' + '&sdate=' + sdate + '&edate=' + edate)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err,res) => {
                if(err) done(err);
                else {
                    res.body.should.have.property("promos");
                    res.body.promos.should.be.instanceOf(Array);                    
                    res.body.promos.length.should.be.equal(1);
                    res.body.promos[0].should.have.property('description');                    
                    done();
                }
            })
        });
    it('perform a date search (start before) and respond with an array of 1 element', (done) => {
        let date_search = "2016-09-30"
        request
            .get('search' + fakeuidpar + '&t=promo' + '&edate=' + date_search)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err,res) => {
                if(err) done(err);
                else {
                    res.body.should.have.property("promos");
                    res.body.promos.should.be.instanceOf(Array);
                    res.body.promos.length.should.be.equal(1);
                    res.body.promos[0].should.have.property('name');
                    res.body.promos[0].name.should.containEql("porcino");
                    done();
                }
            })
        });


    it('perform a date search (ends after) and respond with an array of 3 elements', (done) => {
        let date_search = "2016-10-1"
        request
            .get('search' + fakeuidpar + '&t=promo' + '&sdate=' + date_search)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err,res) => {
                if(err) done(err);
                else {
                    res.body.should.have.property("promos");
                    res.body.promos.should.be.instanceOf(Array);
                    res.body.promos.length.should.be.equal(3);
                    res.body.promos[0].should.have.property('description');                    
                    done();
                }
            })
        });


      it('perform a date search (lastUpdate) and respond with an array of 1 element', (done) => {        
        request
            .get('search' + fakeuidpar + '&t=promo' + '&mds=' + lastUpdate)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err,res) => {
                if(err) done(err);
                else {
                    res.body.should.have.property("promos");
                    res.body.promos.should.be.instanceOf(Array);
                    res.body.promos.length.should.be.equal(1);
                    res.body.promos[0].should.have.property('lastUpdate');
                    res.body.promos[0].lastUpdate.should.be.equal(lastUpdate);
                    done();
                }
            })
        });


    it('run a geo query with 1km radius and respond with just one item', (done) => {
      let position_pars = [9.3534625,40.203488,1];
      request
        .get('search' + fakeuidpar + '&t=promo' + '&position=' + position_pars.toString())
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("promos");
            res.body.promos.should.be.instanceOf(Array);
            res.body.promos.length.should.be.equal(1);
            done();
          }
        });
    });
    it('run a geo query with 50km radius and respond with 3 items', (done) => {
      let position_pars = [9.3534625,40.203488,50];
      request
        .get('search' + fakeuidpar + '&t=promo' + '&position=' + position_pars.toString())
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("promos");
            res.body.promos.should.be.instanceOf(Array);
            res.body.promos.length.should.be.equal(3);
            done();
          }
        });
    });
    it('run a geo query with 100km radius and a text filter, respond with one item', (done) => {
      let position_pars = [9.3534625,40.203488,100];
      request
        .get('search' + fakeuidpar + '&t=promo' + '&position=' + position_pars.toString() + '&text=porcino')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("promos");
            res.body.promos.should.be.instanceOf(Array);
            res.body.promos.length.should.be.aboveOrEqual(1);
            done();
          }
        });
    });
  });


  describe('DELETE /contents/:id/promotions/:pid', () => {
    it('respond with json Object containing the deleted test doc', (done) => {
      request
        .delete('contents/' + father_id + '/promotions/' + new_items[1] + fakeuidpar)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err,res) => {
          if(err) done(err);
          else {
            res.body.should.have.property("n");
            res.body.n.should.be.equal(1);
            done();
          }
        })
    })
    it('respond with 404 error to confirm previous deletion', (done) => {
      request
        .get('search' + new_items[1] + fakeuidpar) 
        .expect(404)
        .end((err, res) => {
          if(err) done(err);
          else done();
        });
    })
  })


  describe('--- Testing Promotions Actions ---', () => {
    describe('POST /contents/:id/promotions/:pid/actions/{like,likes,unlike}', () => {
      it('(like) respond with 200 and {success:true}', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/like' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("success");
              res.body.success.should.be.equal(true);
              done()
            }
          })
      });

      it('(like) duplication avoidance check, respond with 409 error:', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/like' + fakeuidpar)
          .expect(409)
          .end((err, res) => {
            if(err) done(err);
            else done();
          });
      });

      it('(doilike) respond with TRUE', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/doilike' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("like");
              res.body.like.should.be.equal(true);              
              done()
            }
          })
      });

      it('(likes) respond with 200 and {total: 1}', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/likes' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("id");
              res.body.id.should.be.equal(new_items[0]+'');
              res.body.should.have.property("total");
              res.body.total.should.be.equal(1);
              res.body.should.have.property("type");
              res.body.type.should.be.equal("like");
              done()
            }
          })
      });
    
      it('(unlike) respond with 200 and {success: true}', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/unlike' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("success");
              res.body.success.should.be.equal(true);
              done()
            }
          })
      });

      it('(doilike) respond with FALSE', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/doilike' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("like");
              res.body.like.should.be.equal(false);              
              done()
            }
          })
      });

      it('(likes) respond with {total : 0} to confirm previous deletion', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/likes' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("id");
              res.body.id.should.be.equal(new_items[0]+'');
              res.body.should.have.property("total");
              res.body.total.should.be.equal(0);
              res.body.should.have.property("type");
              res.body.type.should.be.equal("like");
              done()
            }
          })
      });
    });

    describe('POST /contents/:id/promotions/:pid/actions/{participate,participants,unparticipate}', () => {
      it('(participate) respond with 200 and {success:true}', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/participate' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("success");
              res.body.success.should.be.equal(true);
              done()
            }
          })
      });

      it('(participate) duplication avoidance check, respond with 409 error:', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/participate' + fakeuidpar)
          .expect(409)
          .end((err, res) => {
            if(err) done(err);
            else done();
          });
      });

      it('(doiparticipate) respond with true', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/doiparticipate' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("participation");
              res.body.participation.should.be.equal(true);              
              done()
            }
          })
      });

      it('(participants) respond with 200 and {total: 1}', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/participants' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("id");
              res.body.id.should.be.equal(new_items[0]+'');
              res.body.should.have.property("total");
              res.body.total.should.be.equal(1);
              res.body.should.have.property("type");
              res.body.type.should.be.equal("participation");
              done()
            }
          })
      });

      ////////////////////////////////////////////////////////////////////////////////////////////////
      //I due test successivi non sono action delle promo, sono inserite in questo set per comodita'//
      ////////////////////////////////////////////////////////////////////////////////////////////////
      it('(participants list) respond with 200 and a list of one element', (done) => {
        request
          .get('contents/' + father_id + '/promotions/' + new_items[0] +'/participants')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("id");
              res.body.id.should.be.equal(new_items[0]+'');
              res.body.should.have.property("participants");
              res.body.participants[0].should.be.equal(fakeuid);
              done()
            }
          })
      });
    
      it('(involvements per user) respond with 200 and a list of one element', (done) => {
        request
          .get('involvements' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("user");
              res.body.user.should.be.equal(fakeuid);
              res.body.should.have.property("involvements");
              res.body.involvements[0].should.be.equal(new_items[0]+'');
              done()
            }
          })
      });
      ////////////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////////////

      it('(unparticipate) respond with 200 and {success: true}', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/unparticipate' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("success");
              res.body.success.should.be.equal(true);
              done()
            }
          })
      });

      it('(participants) respond with {total : 0} to confirm previous deletion', (done) => {
        request
          .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/participants' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("id");
              res.body.id.should.be.equal(new_items[0]+'');
              res.body.should.have.property("total");
              res.body.total.should.be.equal(0);
              res.body.should.have.property("type");
              res.body.type.should.be.equal("participation");
              done();
            }
          })
      });
    });

    describe('POST /contents/:id/promotions/:pid/actions/{lock,unlock}', () => {
      it('(lock) respond with 200 and {published:false}', (done) => {
        request
        .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/lock' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("published");
              res.body.published.should.be.equal(false);
              done()
            }
          })
      });

      it('(unlock) respond with 200 and {published:true}', (done) => {
        request
        .post('contents/' + father_id + '/promotions/' + new_items[0] +'/actions/unlock' + fakeuidpar)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            if(err) done(err);
            else {
              res.body.should.have.property("published");
              res.body.published.should.be.equal(true);
              done()
            }
          })
      });
    })
  });
});
