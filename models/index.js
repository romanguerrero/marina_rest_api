/* -------------  Import modules ------------- */

const axios = require('axios');
const jwt_decode = require('jwt-decode');
const ds = require('../datastore');
const datastore = ds.datastore;

/* ------------- Begin Model Functions ------------- */

/* ------------------------------------------------------------------
func: generate_url
desc: Creates + returns url for Google People GET Request
-------------------------------------------------------------------*/
function generate_url(req) {
  // Create random number for state
  var rng = Math.floor(Math.random()*1001);

  // Store state in HTTP session
  req.session.state = "SuperSecret" + rng;

  // Create URL to Google OAuth 2.0
  var base = 'https://accounts.google.com/o/oauth2/v2/auth?';
  var response_type = 'response_type=code&';
  var client_id = 'client_id=REDACTED.apps.googleusercontent.com&';
  var redirect_uri = 'redirect_uri=https://guerrero-493-final.wl.r.appspot.com/oauth&';
  var scope = 'scope=https://www.googleapis.com/auth/userinfo.profile&';
  var state = 'state=SuperSecret' + rng;

  // Put together
  var url = base + response_type + client_id + redirect_uri + scope + state;

  return url;
}


/* ------------------------------------------------------------------
func: post_oauth
desc: Sends POST request for OAuth2 client
-------------------------------------------------------------------*/
function post_oauth(req) {
  // Use code to create POST request
  var promise = axios.post('https://oauth2.googleapis.com/token', {
    code: req.query.code,
    // guerrero-493-final client
    client_id: "817622098631-k8jc0ufg3bd245asgagibpvhnpc3pnfh.apps.googleusercontent.com",
    client_secret: "REDACTED",
    redirect_uri: "https://guerrero-493-final.wl.r.appspot.com/oauth",
    grant_type: "authorization_code"
  });
  return promise;
}


/* ------------------------------------------------------------------
func: get_people_api
desc: Sends GET request for user's name to Google People API
-------------------------------------------------------------------*/
function get_people_api(response, req)
{
  req.session.id_token = response.data.id_token;  // <-- JWT

  // Save token to use in GET
  var val = "Bearer " + response.data.access_token;

  // Create GET, send to People API
  var promise = axios.get('https://people.googleapis.com/v1/people/me?personFields=names', {
    headers: {
      Authorization: val
    }
  });
  return promise;
}


/* ------------------------------------------------------------------
func: create_user
desc: Creates a user in datastore. Takes name of user and sub from
JWT as parameters
-------------------------------------------------------------------*/
function create_user(name, sub) {
  var key = datastore.key('USER');  // Make key needed to input entity in datastore
  const new_user = {"name": name, "sub": sub};  // Makes attributes for entity
  return datastore.save({"key": key, "data": new_user})
  .then( () => {return key});  // Save entity in datastore and then return its key
}


/* ------------------------------------------------------------------
func: get_one_user
desc: Searches datastore for user with this sub. If user exists, returns
user. Otherwise, returns undefined
-------------------------------------------------------------------*/
function get_one_user(req, sub) {
  var q = datastore.createQuery('USER').filter('sub', '=', sub);
  return datastore.runQuery(q)
  .then( (entities) => {return entities[0].map(ds.fromDatastore);});  // Store id's to each entity
}


/* ------------------------------------------------------------------
func: render_info
desc: After JWT has been received, displays user and JWT. Creates
user if user not in datastore already
-------------------------------------------------------------------*/
function render_info(people, res, req) {

  // Get and decode jwt
  var token = req.session.id_token;
  var jwt = jwt_decode(token);

  // Place info in readable variables
  var sub = jwt.sub;
  var fn = people.data.names[0].givenName;
  var ln = people.data.names[0].familyName;
  var name = fn + ' ' + ln;

  // Check if user already created
  get_one_user(req, sub)

  // Render user info
  .then( (user) => {

    // If already created, just display JWT
    if (user.length > 0) {
      res.write('User ALREADY in datastore!');
      res.write(' | Name: ' + fn + ' ' + ln);
      res.write(' | Sub/Unique ID: ' + sub);
      res.write(' | Generated JWT: ' + token);
      res.status(200).end();

    // Create new user if not in datastore
    } else {
      create_user(name, sub);  // Add user to datastore
      res.write('User CREATED in datastore!');
      res.write(' | Name: ' + fn + ' ' + ln);
      res.write(' | Sub/Unique ID: ' + sub);
      res.write(' | Generated JWT: ' + token);
      res.status(200).end();
    }
  });
}


/* ------------- Export Functions ------------- */

module.exports = {
  generate_url,
  post_oauth,
  get_people_api,
  render_info
}
