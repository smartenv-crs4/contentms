//TODO generalizzare con categories

var promotype = require('../../schemas/promotype').promotype;
var validator = require('validator');

module.exports = {
	/**
	* @api {delete} /promotype/:id Delete a promotype by id
	* @apiGroup Category
	*
	* @apiDescription Removes promotype information from the list.
	* @apiParam {String} id The id of the promotype.
	*
	* @apiSuccess (200) {Object} body The Json representing the deleted promotype.
	* @apiUse Unauthorized
	* @apiUse BadRequest
	* @apiUse ServerError
	*/
	delete: function(req, res, next) {
	  let id = req.params.id
	  promotype.delete(id)
	  .then(del => {
	    res.json(del);
	  })
	  .catch(e => {
	    console.log(e);
	    res.status(e.status||500).send({error:e.error||"server error"});
	  }); 
	},


	/**
	 * @api {get} /promotype/:id Get promotype by id 
	 * @apiGroup Categories
	 *
	 * @apiParam {String} id The id of the promotype.
	 *
	 * @apiSuccess (200) {Object} body Json containing the promotype.
	 * @apiUse Unauthorized
	 * @apiUse BadRequest
	 * @apiUse ServerError
	 */
	get : function(req, res, next) {
	  promotype.search(req.params.id)
	  .then(result => {
	    if(result == null || result == undefined || Object.getOwnPropertyNames(result).length === 0)
	      res.boom.notFound();
	    else 
	      res.json(result);
	  })
	  .catch(e => {
	    console.log(e);
	    res.boom.badImplementation();
	  });
	},


	/**
	 * @api {post} /promotype/ Add one promotype
	 * @apiGroup Categories
	 *
	 * @apiDescription Insert a new promotype into the database, a json Object with the promotype informations must be passed in the body of the request.
	 * @apiExample Example: 
	 *  {
	 *    "name"        : "Hotel",
	 *    "description" : "Alberghi e strutture ricettive",
	 *  }
	 *
	 * @apiSuccess (201 - CREATED) {Object} body The Json containing the new activity.
	 * @apiUse Unauthorized
	 * @apiUse BadRequest
	 * @apiUse ServerError
	 */
	insert: function(req, res, next) {
	  if(Object.keys(req.body).length === 0) {
	    res.boom.badRequest('empty object');
	  }
	  else {
	    let promotypeItem = req.body;
	    if(!promotypeItem.name || validator.isEmpty(promotypeItem.name))
	      res.boom.badRequest("missing name field");
	    else {
	      promotype.add(promotypeItem)
	      .then(newcat => {
	        res.setHeader("Location", 
	          req.headers.host + "/api/v1/promotype/" 
	          + newcat._id); //WARNING alcuni browser potrebbero non mettere la porta in req.headers.host

	        res.status(201).json(newcat)
	      })
	      .catch(e => {
	        console.log(e);
	        res.boom.badImplementation();
	      });
	    }
	  }
	},


	/**
	 * @api {get} /promotype/ Return the list of available promotype
	 * @apiGroup Categories
	 *
	 * @apiSuccess (200) {Object[]} body Array of results representing found activities.
	 * @apiUse Unauthorized
	 * @apiUse BadRequest
	 * @apiUse ServerError
	 */
	search: function(req, res, next) {
	  let limit = req.query.limit;
	  let skip = req.query.skip;
	  let f = (limit && skip) ? promotype.search(limit, skip) : promotype.search();
	  f.then((result) => {
	    res.json(result);
	  })
	  .catch((e) => { 
	    console.log(e);
	    if(e.status) res.status(e.status).send(e.error);
	    else res.boom.badImplementation();
	  });  
	},


	/**
	 * @api {put} /promotype/:id Update promotype information 
	 * @apiGroup Categories
	 *
	 * @apiParam {String} id The id of the promotype.
	 * @apiExample Example: 
	 *  //Updates only description field
	 *  {
	 *    "description" : "description update for this promotype",
	 *  }
	 *
	 * @apiSuccess (200) {Object} body The Json representing the updated promotype.
	 * @apiUse Unauthorized
	 * @apiUse BadRequest
	 * @apiUse ServerError
	 */
	update: function(req, res, next) {
	  let id = req.params.id
	  let upItem = req.body;
	  promotype.update(id, upItem)
	  .then(up => {
	    res.setHeader("Location", req.header.host + "/api/v1/promotype/"+up._id); //WARNING, alcuni browser potrebbero non mettere la porta in req.headers.host
	    res.json(up)
	  })
	  .catch(e => {
	    console.log(e);
	    res.status(e.status||500).send({error:e.error||"server error"});
	  });  
	}
}