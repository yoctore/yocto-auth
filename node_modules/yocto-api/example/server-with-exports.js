'use strict';

// IT USED FOR TEST UNIT


var express    = require('express'); // Load express
var bodyParser = require('body-parser'); // load bodyparser
var mongoose   = require('mongoose'); // Load the mongodb driver
var routes     = require('../src/app/routes/controller.js'); // Load the api
var app        = express(); // Create app
var path     = require('path');
var fs        = require('fs');

var createServer = function(port) {
  var base = path.normalize(process.cwd());

  // connect to our database
  routes.logger.enableConsole(false);
  try {
    mongoose.connect('mongodb://localhost:27017');

  } catch (e) {
    console.log('ERROR Please verify connection to mongodb\n' +e);
  }

  // configure app to use bodyParser()
  app.use(bodyParser.urlencoded({ extended : true }));
  app.use(bodyParser.json());

  // set our port
  //var port = process.env.PORT || 8080;

  //Initialise the API router
  routes.init(base+'/example/routes/routes.json', base +'/example/models/');

  //Use the router
  app.use('/api', routes.router);

  // START THE SERVER
  return app.listen(port);
};

module.exports = createServer;
