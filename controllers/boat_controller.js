const boat = require('../models/boat.js');
const load = require('../models/load.js');

/* --------------- Start Boat Controller Functions -------------- */

/* ------------------------------------------------------------------
func: get_all_boats
desc: 200 - Returns all boats whose owner matches the sub property in JWT
401 - Invalid JWT
-------------------------------------------------------------------*/
exports.get_all_boats = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Get owner from JWT
    const owner = req.user.sub;

    // Get total count
    boat.get_count(owner)

    // Gets owners boats
    .then( (count) =>  boat.get_owners_boat(req, owner, count))
    .then( (boats) => {

      for (i in boats.items) {
        // Create self attribute
        const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/boats/' + boats.items[i].id;
        boats.items[i].self = url
      }

      res.status(200).json(boats);  // Send ok response
    });
  }
};


/* ------------------------------------------------------------------
func: post_boat
desc: Creates boat
-------------------------------------------------------------------*/
exports.post_boat = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Get owner from JWT
    const owner = req.user.sub;

    // post_boat in datastore
    boat.create_boat(req.body.name, req.body.type, req.body.length, owner)
    .then( (key) => {
      // Create self attribute
      const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/boats/' + key.id;
      // Create json boat
      var new_boat = {id: key.id, name: req.body.name, type: req.body.type,
        length: req.body.length, owner: owner, loads: [], self: url};
      res.status(201).json(new_boat);
    });
  }
};


/* ------------------------------------------------------------------
func: get_one_boat
desc: 200 - Returns boat specified by boat id if exists
404 - Boat doesn't exist
401 - Invalid JWT token
-------------------------------------------------------------------*/
exports.get_one_boat = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Get owner from JWT
    const owner = req.user.sub;

    // Search for boat
    boat.get_one_boat(req, req.params.boat_id, owner)
    .then( (boat) => {
      if (boat !== 0) {
        // Create self attribute
        const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/boats/' + req.params.boat_id;
        boat.self = url;

        // Attach ID attribute
        boat.id = req.params.boat_id;

        res.status(200).json(boat);  // Send ok response
      } else {
        var msg = {Error: "No boat with this boat_id exists"};
        res.status(404).send(msg);
      }
    });
  }
};


/* ------------------------------------------------------------------
func: put_boat
desc: 200 - Update boat with new attributes
401 - Invalid JWT
404 - Boat doesn't exist
-------------------------------------------------------------------*/
exports.put_boat = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Get owner from JWT
    const owner = req.user.sub;

    // Search for boat
    boat.get_one_boat(req, req.params.boat_id, owner)
    .then( (a_boat) => {

      if (a_boat !== 0) {

        // Save updated boat in datastore
        boat.update_boat(req.params.boat_id, owner, req.body.name, req.body.type, req.body.length, a_boat.loads)
        .then( (key) => {

          // Create self attribute
          const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/boats/' + key.id;

          // Create json boat
          var updated_boat = {id: key.id, name: req.body.name, type: req.body.type,
            length: req.body.length, owner: owner, loads: a_boat.loads, self: url};

          // Send confirmed updated boat to user
          res.status(200).json(updated_boat);
        });

      } else {
        var msg = {Error: "No boat with this boat_id exists"};
        res.status(404).send(msg);
      }
    });
  }
}


/* ------------------------------------------------------------------
func: patch_boat
desc: 200 - Update boat with new attributes
401 - Invalid JWT
404 - Boat doesn't exist
-------------------------------------------------------------------*/
exports.patch_boat = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Get owner from JWT
    const owner = req.user.sub;

    // Search for boat
    boat.get_one_boat(req, req.params.boat_id, owner)
    .then( (a_boat) => {

      if (a_boat != 0) {

        // Set boat attribute names if they are in request
        if (req.body.name) name = req.body.name
        else name = a_boat.name;

        if (req.body.type) type = req.body.type
        else type = a_boat.type;

        if (req.body.length) length = req.body.length
        else length = a_boat.length;

        // Save updated boat in datastore
        boat.update_boat(req.params.boat_id, owner, name, type, length, a_boat.loads)
        .then( (key) => {

          // Create self attribute
          const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/boats/' + key.id;

          // Create json boat
          var updated_boat = {id: key.id, name: name, type: type,
            length: length, owner: owner, loads: a_boat.loads, self: url};

          // Send confirmed updated boat to user
          res.status(200).json(updated_boat);
        });

      } else {
        var msg = {Error: "No boat with this boat_id exists"};
        res.status(404).send(msg);
      }
    });
  }
}


/* ------------------------------------------------------------------
func: delete_boat
desc: 204 - Delete if found & valid JWT, correct owner
401 - Missing or invalid JWT
404 - Boat owned by someone else, or not boat exists
-------------------------------------------------------------------*/
exports.delete_boat = function (req, res) {
  // Get owner from JWT
  const owner = req.user.sub;

  // Search for boat
  boat.get_one_boat(req, req.params.boat_id, owner)

  // Deletes boat
  .then((a_boat) => boat.del_boat(a_boat, res, req, req.params.boat_id));
};


/* --------------- End Boat Controller Functions -------------- */

/* --------------- Start Relationship Controller Functions -------------- */

/* ------------------------------------------------------------------
func: assign_load_to_boat
desc: 204 - Assigns load to boat
401 - Missing or invalid JWT
403 - Load is on another boat
404 - Boat or load does not exist
-------------------------------------------------------------------*/
exports.assign_load_to_boat = function (req, res) {

  // Get owner from JWT
  const owner = req.user.sub;

  // Search for boat
  boat.get_one_boat(req, req.params.boat_id, owner)
  .then( (a_boat) => {

    // Check if boat exists
    if (a_boat === 0) {
      var msg = {Error: "No boat with this boat_id exists, and/or no load with this load_id exits."};
      res.status(404).send(msg);

    } else {
      // Check if load exists
        load.get_one_load(req, req.params.load_id)
        .then ( (a_load) => {

          if (a_load === 0) {
            var msg = {Error: "No boat with this boat_id exists, and/or no load with this load_id exits."};
            res.status(404).send(msg);

          } else {
            // Check if load already has carrier
            if (a_load.carrier !== -1) {
              var msg = {Error: "Load is already on a boat."};
              res.status(403).send(msg);
            }

            // Assign load to boat
            else {
              boat.assign_load_to_boat(a_boat, a_load, req, res);
            }
          }
        });
      }
  });
}


/* ------------------------------------------------------------------
func: remove_load_from_boat
desc: 204 - Removes load from boat
401 - Missing or invalid JWT
403 - Load is not on this boat
404 - Boat or load does not exist
-------------------------------------------------------------------*/
exports.remove_load_from_boat = function (req, res) {

    // Get owner from JWT
    const owner = req.user.sub;

    // Search for boat
    boat.get_one_boat(req, req.params.boat_id, owner)
    .then( (a_boat) => {

      // Check if boat exists
      if (a_boat === 0) {
        var msg = {Error: "No boat with this boat_id exists, and/or no load with this load_id exits."};
        res.status(404).send(msg);

      } else {
          // Search for load
          load.get_one_load(req, req.params.load_id)
          .then ( (a_load) => {

            // Check if load exists
            if (a_load === 0) {
              var msg = {Error: "No boat with this boat_id exists, and/or no load with this load_id exits."};
              res.status(404).send(msg);

            } else {
              // Check if load is on this boat
              if (a_load.carrier !== req.params.boat_id) {
                var msg = {Error: "This load is not on this boat."};
                res.status(403).send(msg);
              }

              // Remove load from boat
              else {
                boat.remove_load_from_boat(a_boat, a_load, req, res);
              }
            }
          });
        }
    });
}


/* --------------- End Relationship Controller Functions -------------- */

/* --------------- Start User Controller Functions -------------- */

/* ------------------------------------------------------------------
func: get_users
desc: 200 - Returns all users in datastore
-------------------------------------------------------------------*/
exports.get_users = function (req, res) {

  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
    } else {

    // Gets owners boats
    boat.get_users(req)
    .then( (users) => {
      res.status(200).json(users);  // Send ok response
    });
  }
};


/* --------------- End User Controller Functions -------------- */


/* --------------- Handle bad requests to URLs -------------- */

exports.bad_method = function (req, res) {
   res.set('Accept', 'GET, POST, PUT, PATCH, DELETE');
   var msg = {Error: "Unaccepted method"};
   res.status(405).send(msg);
}
