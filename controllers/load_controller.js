const load = require('../models/load.js');

/* --------------- Start Load Controller Functions -------------- */

/* ------------------------------------------------------------------
func: get_all_loads
desc: Returns all loads
-------------------------------------------------------------------*/
exports.get_all_loads = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Get total count
    load.get_count()

    // Gets loads
    .then((count) => load.get_loads(req, count))
    .then( (loads) => {

      for (i in loads.items) {
        // Create self attribute
        const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/loads/' + loads.items[i].id;
        loads.items[i].self = url
      }

      res.status(200).json(loads);  // Send ok response
    });
  }
};


/* ------------------------------------------------------------------
func: post_load
desc: Creates load
-------------------------------------------------------------------*/
exports.post_load = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // post_load in datastore
    load.create_load(req.body.weight, req.body.country, req.body.manufacturer)
    .then( (key) => {
      // Create self attribute
      const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/loads/' + key.id;
      // Create json load
      var new_load = {id: key.id, weight: req.body.weight, country: req.body.country,
        manufacturer: req.body.manufacturer, carrier: -1, self: url};
      res.status(201).json(new_load);
    });
  }
};


/* ------------------------------------------------------------------
func: get_one_load
desc: 200 - Returns load specified by load id if exists
404 - load doesn't exist
-------------------------------------------------------------------*/
exports.get_one_load = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Search for load
    load.get_one_load(req, req.params.load_id)
    .then( (load) => {
      if (load != 0) {
        // Create self attribute
        const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/loads/' + req.params.load_id;
        load.self = url;

        // Attach ID
        load.id = req.params.load_id;

        res.status(200).json(load);  // Send ok response
      } else {
        var msg = {Error: "No load with this load_id exists"};
        res.status(404).send(msg);
      }
    });
  }
};


/* ------------------------------------------------------------------
func: put_load
desc: 200 - Update load with new attributes
404 - load doesn't exist
-------------------------------------------------------------------*/
exports.put_load = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Search for load
    load.get_one_load(req, req.params.load_id)
    .then( (a_load) => {

      if (a_load != 0) {

        // Save updated load in datastore
        load.update_load(req.params.load_id, req.body.weight, req.body.country, req.body.manufacturer, a_load.carrier)
        .then( (key) => {

          // Create self attribute
          const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/loads/' + key.id;

          // Create json load
          var updated_load = {id: key.id, weight: req.body.weight, country: req.body.country,
            manufacturer: req.body.manufacturer, carrier: a_load.carrier, self: url};

          // Send confirmed updated load to user
          res.status(200).json(updated_load);
        });

      } else {
        var msg = {Error: "No load with this load_id exists"};
        res.status(404).send(msg);
      }
    });
  }
}


/* ------------------------------------------------------------------
func: patch_load
desc: 200 - Update load with new attributes
404 - load doesn't exist
-------------------------------------------------------------------*/
exports.patch_load = function (req, res) {
  // Check 'Header: Accept' for 'application/json'
  if (req.get('accept') !== 'application/json') {
    var msg = {Error: "Client must accept application/json data."};
    res.status(406).json(msg);
  } else {

    // Search for load
    load.get_one_load(req, req.params.load_id)
    .then( (a_load) => {

      if (a_load != 0) {

        // Set load attribute names if they are in request
        if (req.body.weight) name = req.body.weight
        else weight = a_load.weight;

        if (req.body.country) country = req.body.country
        else country = a_load.country;

        if (req.body.manufacturer) manufacturer = req.body.manufacturer
        else manufacturer = a_load.manufacturer;

        // Save updated load in datastore
        load.update_load(req.params.load_id, weight, country, manufacturer, a_load.carrier)
        .then( (key) => {

          // Create self attribute
          const url = req.protocol + '://' + req.get('host') + req.baseUrl + '/loads/' + key.id;

          // Create json load
          var updated_load = {id: key.id, weight: weight, country: country,
            manufacturer: manufacturer, carrier: a_load.carrier, self: url};

          // Send confirmed updated load to user
          res.status(200).json(updated_load);
        });

      } else {
        var msg = {Error: "No load with this load_id exists"};
        res.status(404).send(msg);
      }
    });
  }
}


/* ------------------------------------------------------------------
func: delete_load
desc: 201 Delete if found
401 Missing ID
-------------------------------------------------------------------*/
exports.delete_load = function (req, res) {

  // Search for load
  load.get_one_load(req, req.params.load_id)

  // Deletes load
  .then((a_load) => load.del_load(a_load, res, req, req.params.load_id));
};



/* --------------- End load Controller Functions -------------- */
