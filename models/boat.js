/* -------------  Import modules ------------- */

const jwt_decode = require('jwt-decode');
const ds = require('../datastore');
const datastore = ds.datastore;
const load = require('./load.js');

/* ------------- Begin Boat Model Functions ------------- */

/* ------------------------------------------------------------------
func: get_token
desc: Get token by then removing "Bearer " from string in Authorization
Header. Assumes auth is valid
-------------------------------------------------------------------*/
exports.get_token = function (auth) {
  return auth.substring(7);
}


/* ------------------------------------------------------------------
func: get_owners_boat
desc: Get all boats of owner
-------------------------------------------------------------------*/
exports.get_owners_boat = function(req, owner, count) {
  var q = datastore.createQuery('BOAT').filter('owner', '=', owner).limit(5);  // pagination
  const results = {};

  // Store cursor in query if it's included in req
  if ( Object.keys(req.query).includes("cursor") ) {
    q = q.start(req.query.cursor);
  }

  return datastore.runQuery(q)
  .then( (entities) => {

    // Store id's to each entitiy
    results.items = entities[0].map(ds.fromDatastore);

    // If more entites yet to be shown, create next link
    // Note: For next link to work make sure to set Authorization Type to Bearer Token with valid JWT in Postman
    if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
      results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/boats?cursor=" + entities[1].endCursor;
    }

    // Store count in results
    results.total = count;

	  return results;
  });
}


/* ------------------------------------------------------------------
func: get_count
desc: Counts total items in collection
-------------------------------------------------------------------*/
exports.get_count = function(owner) {

  var q = datastore.createQuery('BOAT').filter('owner', '=', owner);
  return datastore.runQuery(q)
  .then( (entities) => { return entities[0].length; });
}


/* ------------------------------------------------------------------
func: create_boat
desc: Creates a boat in the datastore
-------------------------------------------------------------------*/
exports.create_boat = function (name, type, length, owner) {
  var key = datastore.key('BOAT');  // Make key needed to input entity in datastore
  const new_boat = {"name": name, "type": type, "length": length, "owner": owner, "loads": [] };  // Makes attributes for entity
  return datastore.save({"key": key, "data": new_boat}).then( () => {return key});  // Save entity in datastore and then return its key
}


/* ------------------------------------------------------------------
func: get_one_boat
desc: Returns boat w/ boat ID, or undefined
-------------------------------------------------------------------*/
exports.get_one_boat = function (req, b_id, owner) {

  // Creates key to access g-cloud datastore
  const b_key = datastore.key(['BOAT', parseInt(b_id, 10)]);

  // Returns specified entity from datastore
  return datastore.get(b_key)
  .then( (boat) => {
    boat = boat[0];
    // undefined means boat doesn't exist
    if (boat === undefined) {
      return 0;

    // Check owner is the same
    } else if (boat.owner === owner) {
      return boat;

    } else {
      return 0;
    }
  });
}

/* ------------------------------------------------------------------
func: update_boat
desc: Updates boat in datastore with parameters
-------------------------------------------------------------------*/
exports.update_boat = function (b_id, owner, name, type, length, loads) {
  const b_key = datastore.key(['BOAT', parseInt(b_id, 10)]);

  const new_boat = {"name": name, "type": type, "length": length, "owner": owner, "loads": loads };  // Makes attributes for entity

  return datastore.save({"key": b_key, "data": new_boat}).then( () => {return b_key});  // Save entity in datastore and then return its key
}



/* ------------------------------------------------------------------
func: del_boat
desc: 204 Delete if found & valid JWT, correct owner
401 Missing or invalid JWT
403 Boat owned by someone else, or not boat exists
-------------------------------------------------------------------*/
exports.del_boat = function (boat, res, req, b_id) {

  // 403 Error if not found
  if (boat === 0) {
    var msg = {Error: "No boat with this boat_id exists"};
    res.status(404).json(msg);
  }
  // 204 Delete if found
  else {

    // Remove boat from any corresponding loads
    if (boat.loads !== undefined) {
      boat.loads.forEach((item, i) => {

        // Get each load
        load.get_one_load(req, item)

        // Change in datastore
        .then( (a_load) => {
          a_load.carrier = -1;
          load.update_load(item, a_load.weight, a_load.country, a_load.manufacturer, a_load.carrier);
        });
      });
    }

    delete_boat(b_id).then(res.status(204).end());  // Deletes boat from ds & sends ok code
  }
}


/* ------------------------------------------------------------------
func: delete_boat
desc: Deletes boat w/ boat_id
-------------------------------------------------------------------*/
function delete_boat(boat_id) {
  const b_key = datastore.key( ['BOAT', parseInt(boat_id, 10)] );  // Create key for ds entity deletion
  return datastore.delete(b_key);  // Delete entity and return to calling function
}


/* ------------- End Boat Model Functions ------------- */

/* ------------- Begin Relationship Model Functions ------------- */

/* ------------------------------------------------------------------
func: assign_load_to_boat
desc: Adds load to boat
-------------------------------------------------------------------*/
exports.assign_load_to_boat = function (a_boat, a_load, req, res) {
  // Store IDs in respective objects
  a_load.carrier = req.params.boat_id;
  if (a_boat.loads === undefined) {
    a_boat.loads = [req.params.load_id,];

  } else {
    a_boat.loads.push(req.params.load_id);
  }

  // Store in datastore
  exports.update_boat(req.params.boat_id, a_boat.owner, a_boat.name, a_boat.type, a_boat.length, a_boat.loads)
  .then(load.update_load(req.params.load_id, a_load.weight, a_load.country, a_load.manufacturer, a_load.carrier))
  .then( (key) => {
    res.status(204).end();
  });
}


/* ------------------------------------------------------------------
func: remove_load_from_boat
desc: Remoes load from boat
-------------------------------------------------------------------*/
exports.remove_load_from_boat = function (a_boat, a_load, req, res) {
  // Remove IDs in respective objects
  a_load.carrier = -1;

  if (a_boat.loads.length === 1) {
    a_boat.loads = [];

  } else {
    // Remove boat's loads attribute
    for ( var i = 0; i < boat.loads.length; i++) {
      if ( boat.loads[i] === req.params.load_id) {
        boat.loads.splice(i, 1);
      }
    }
  }

  // Store in datastore
  exports.update_boat(req.params.boat_id, a_boat.owner, a_boat.name, a_boat.type, a_boat.length, a_boat.loads)
  .then(load.update_load(req.params.load_id, a_load.weight, a_load.country, a_load.manufacturer, a_load.carrier))
  .then( (key) => {
    res.status(204).end();
  });
}


/* ------------- End Relationship Model Functions ------------- */

/* ------------- Begin User Model Functions ------------- */

/* ------------------------------------------------------------------
func: get_users
desc: Get all users in datastore
-------------------------------------------------------------------*/
exports.get_users = function(req, owner) {
  var q = datastore.createQuery('USER');

  return datastore.runQuery(q)
  .then( (entities) => {
    // Store id's to each entitiy
    return entities[0].map(ds.fromDatastore);
  });
}
