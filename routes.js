/* Import modules ------------------------------------------------ */

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const index_controller = require('./controllers/index_controller');
const boat_controller = require('./controllers/boat_controller');
const load_controller = require('./controllers/load_controller');
const session = require('express-session');
const jwt = require('express-jwt');
const jwk_client = require('jwks-rsa');


/* Router setup ------------------------------------------------- */

/* ------------------------------------------------------------------
func: check_jwt
desc: Validates jwt in bearer token
-------------------------------------------------------------------*/
const check_jwt = jwt({
  secret: jwk_client.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute:5,
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs'
  }),
  issuer: 'https://accounts.google.com',
  algorithms: ['RS256']
});


/* ------------------------------------------------------------------
desc: Create session
-------------------------------------------------------------------*/
router.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 60000
   }
}));

/* --------------- Boat Routes -------------- */

// Boat Collection
router.get('/boats', check_jwt, boat_controller.get_all_boats);

// (C) Create a boat
router.post('/boats', check_jwt, boat_controller.post_boat);

// (R) Get a boat
router.get('/boats/:boat_id', check_jwt, boat_controller.get_one_boat);

// (U) Update boat (put)
router.put('/boats/:boat_id', check_jwt, boat_controller.put_boat);

// (U) Update boat (patch)
router.patch('/boats/:boat_id', check_jwt, boat_controller.patch_boat);

// (D) Delete a boat
router.delete('/boats/:boat_id', check_jwt, boat_controller.delete_boat);


/* --------------- User Routes -------------- */

// User Collection
router.get('/users', boat_controller.get_users);


/* --------------- Load Routes -------------- */

// Load Collection
router.get('/loads', load_controller.get_all_loads);

// (C) Create a load
router.post('/loads', load_controller.post_load);

// (R) Get a load
router.get('/loads/:load_id', load_controller.get_one_load);

// (U) Update load (put)
router.put('/loads/:load_id', load_controller.put_load);

// (U) Update load (patch)
router.patch('/loads/:load_id', load_controller.patch_load);

// (D) Delete a load, Protected because it accesses and changes boat attributes
router.delete('/loads/:load_id', check_jwt, load_controller.delete_load);


/* --------------- Relationship Routes -------------- */

// Create relationship
router.put('/boats/:boat_id/loads/:load_id', check_jwt, boat_controller.assign_load_to_boat);

// Remove relationship
router.put('/loads/:load_id/boats/:boat_id', check_jwt, boat_controller.remove_load_from_boat);


/* --------------- Index JWT Routes -------------- */

// Homepage
router.get('/', index_controller.index);

// Middle route
router.get('/mid', index_controller.mid);

// OAuth redirect displays user info page
router.get('/oauth', index_controller.oauth);


/* --------------- Handle bad requests to URLs -------------- */

router.copy('/', boat_controller.bad_method);




// Needed to use router
module.exports = router;
