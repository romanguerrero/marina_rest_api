/* -------------  Import modules ------------- */

const jwt_decode = require('jwt-decode');
const ds = require('../datastore');
const datastore = ds.datastore;
const boat = require('./boat.js');

/* ------------- Begin load Model Functions ------------- */


/* ------------------------------------------------------------------
func: get_loads
desc: Get all loads
-------------------------------------------------------------------*/
exports.get_loads = function(req, count) {
  var q = datastore.createQuery('LOAD').limit(5);  // pagination
  const results = {};

  // Store cursor in query if it's included in req
  if ( Object.keys(req.query).includes("cursor") ) {
    q = q.start(req.query.cursor);
  }

  return datastore.runQuery(q)
  .then( (entities) => {

    // Store id's to each entitiy
    results.items = entities[0].map(ds.fromDatastore);

    // If more entities yet to be shown, create next link
    // Note: For next link to work make sure to set Authorization Type to Bearer Token with valid JWT in Postman
    if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
      results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/loads?cursor=" + entities[1].endCursor;
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
exports.get_count = function() {
  var q = datastore.createQuery('LOAD');
  return datastore.runQuery(q)
  .then( (entities) => { return entities[0].length; });
}


/* ------------------------------------------------------------------
func: create_load
desc: Creates a load in the datastore
-------------------------------------------------------------------*/
exports.create_load = function (weight, country, manufacturer) {
  var key = datastore.key('LOAD');  // Make key needed to input entity in datastore
  const new_load = {"weight": weight, "country": country, "manufacturer": manufacturer, "carrier": -1};  // Makes attributes for entity
  return datastore.save({"key": key, "data": new_load}).then( () => {return key});  // Save entity in datastore and then return its key
}


/* ------------------------------------------------------------------
func: get_one_load
desc: Returns load w/ load ID, or undefined
-------------------------------------------------------------------*/
exports.get_one_load = function (req, l_id) {

  // Creates key to access g-cloud datastore
  const l_key = datastore.key(['LOAD', parseInt(l_id, 10)]);

  // Returns specified entity from datastore
  return datastore.get(l_key)
  .then( (load) => {
    load = load[0];
    // undefined means load doesn't exist
    if (load === undefined) {
      return 0;

    } else {
      return load;
    }
  });
}


/* ------------------------------------------------------------------
func: update_load
desc: Updates load in datastore with parameters
-------------------------------------------------------------------*/
exports.update_load = function (l_id, weight, country, manufacturer, carrier) {
  const l_key = datastore.key(['LOAD', parseInt(l_id, 10)]);

  const new_load = {"weight": weight, "country": country, "manufacturer": manufacturer, "carrier": carrier };  // Makes attributes for entity

  return datastore.save({"key": l_key, "data": new_load}).then( () => {return l_key});  // Save entity in datastore and then return its key
}



/* ------------------------------------------------------------------
func: del_load
desc: 204 Delete if found & valid JWT, correct owner
401 Missing or invalid JWT
403 load owned by someone else, or not load exists
-------------------------------------------------------------------*/
exports.del_load = function (load, res, req, l_id) {

  // Get owner from JWT
  const owner = req.user.sub;

  // 403 Error if not found
  if (load === 0) {
    var msg = {Error: "No load with this load_id exists"};
    res.status(404).json(msg);
  }
  // 204 Delete if found
  else {

    // Remove load from any corresponding boat
    if (load.carrier !== -1) {
        // Get boat
        boat.get_one_boat(req, load.carrier, owner)

        // Change in datastore
        .then( (a_boat) => {

          if (a_boat.loads.length === 1) {
            a_boat.loads = [];
          }

          else {
            // Removes load from boat's load array
            for ( var i = 0; i < a_boat.loads.length; i++) {
              if ( a_boat.loads[i] === req.params.load_id) {
                a_boat.loads.splice(i, 1);
              }
            }
          }
          boat.update_boat(load.carrier, a_boat.owner, a_boat.name, a_boat.type, a_boat.length, a_boat.loads);
        });
      }

    delete_load(l_id).then(res.status(204).end());  // Deletes load from ds & sends ok code
  }
}


/* ------------------------------------------------------------------
func: delete_load
desc: Deletes load w/ load_id
-------------------------------------------------------------------*/
function delete_load (load_id) {
  const l_key = datastore.key( ['LOAD', parseInt(load_id, 10)] );  // Create key for ds entity deletion
  return datastore.delete(l_key);  // Delete entity and return to calling function
}


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
