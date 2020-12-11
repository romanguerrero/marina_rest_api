const router = module.exports = require('express').Router();

const routes = require('./routes.js');

router.use('/', routes);
