const index = require('../models/index.js');
const path = require('path');

/* --------------- Start JWT Controller Functions ---------------- */

// Welcome page
exports.index = function (req, res) {
  res.status(200).sendFile(path.resolve("./static/html/index.html"));
};


// Middle route that generates random state, stores in session,
// and redirects user to google's authentication
exports.mid = function (req, res) {
  var url = index.generate_url(req);  // generate url
  res.status(200).redirect(url);  // Send to google
};


// Google profile redirect route
// Sends GET request to People API using bearer token from Google OAuth
// Then displays user information returned from People API
// Displays a generated JWT
exports.oauth = function (req, res) {

  // Determine if states are the same
  if (req.query.state === req.session.state) {
    index.post_oauth(req)
    .then((res) => index.get_people_api(res, req))
    .then((people) => index.render_info(people, res, req));
  } else {
  res.status(403).send('State not valid');
  }
};


/* ---------------- End JWT Controller Functions ---------------- */
