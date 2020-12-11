/* --------------- Node.js setup ---------------- */

const express = require('express');
const app = express();

app.use('/', require('./index'));

// Catch invalid tokens
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({'Error' : 'invalid token...'});
  }
})

/* ---------------- Server Function --------------- */

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
