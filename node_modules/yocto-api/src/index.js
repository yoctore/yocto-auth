'use strict';

var joi         = require('joi');
var _           = require('lodash');
var logger      = require('yocto-logger');
var fs          = require('fs');
var path        = require('path');
var utils       = require('yocto-utils');

// Define a Joi schema for test if route have a goodformat
var routeJoiSchema = joi.object().keys({
  path            : joi.string().required().min(1).trim(),
  alias           : joi.array().items(joi.string().min(1).trim()),
  model           : joi.string().required().min(1).trim(),
  excluded        : joi.array().items(
    joi.string().valid('post', 'get', 'put', 'patch', 'delete', 'head')
  ),
  methods         : joi.array().items(
    joi.object().keys({
      method : joi.string().required().allow('post', 'get', 'put', 'patch', 'delete', 'head'),
      path   : joi.string().required().min(1),
      fn     : joi.string().required().min(1)
    })
  )
});

/**
* Yocto API : Routes Controller
*
* Controller of routes based on Express
*
* It read a jsonfile and create each routenode
*
* Cors Express is enable to permit test with apidocjs
*
* For more details on these dependencies read links below :
* - LodAsh : https://lodash.com/
* - yocto-logger : git+ssh://lab.yocto.digital:yocto-node-modules/yocto-utils.git
* - express : http://expressjs.com/
* - joi : https://github.com/hapijs/joi
*
* @date : 11/05/2015
* @author : Cedric Balard <cedric@yocto.re>
* @copyright : Yocto SAS, All right reserved
* @class RouteController
*/
function RouteController () {
  /**
  * List of all http request that supported by api
  *
  * @property ALL_HTTP_REQUESTS
  * @type Array of String
  * @default [ 'post', 'get', 'put', 'patch', 'delete', 'head']
  */
  this.ALL_HTTP_REQUESTS = [ 'post', 'get', 'put', 'patch', 'delete', 'head' ];

  /**
  * Model's Controller, is the controller that will use to retrieve a model
  *
  * @property models
  * @type Object
  */
  this.models = {};

  /**
  * Instance of app
  *
  * @property app
  * @type Object
  */
  this.app = {};

  /**
  * The main logger
  *
  * @property logger
  * @type Object
  */
  this.logger = logger;
}

/**
* Add a route to the main router
*
* @method addRoute
* @param {String} pathRequest route to add
* @param {String} nameModel name of the model object to retrieve into the controller of model
* @param {Array} reqExcluded array of excluded request
* @param {String} param name of the param to retrieve
* @param {Object} route the current route
* @return {Boolean} If success return true, otherwise false
*/
RouteController.prototype.addRoute = function (pathRequest, nameModel, reqExcluded, param, route,
pathCallback) {

  // Save scope
  var scope = this;

  var httpMethods = {};

  logger.debug('[ ControllerRoutes.addRoute ] - new route found, path : ' + pathRequest);

  // array that contains all subroot for filtering route
  var methods = [];

  /**
   * Check if the request is valid : if = 24 characters and/or if the request is an subrequest of an model
   *
   * @param  {Object}   req        Default req from express
   * @param  {Object}   res        Default res from express
   * @param  {Function} next       Default next from express
   * @param  {Array}    subMethods  List of subMethods of the route (ex: /account/sync)
   * @return {Boolean}              Return true if the request is valid otherwise the function that should be called
   */
  var isValidRequest = function (req, res, next, subMethods) {

    if (!_.isUndefined(req.params.id)) {

      // Test if is an subroute method
      if (_.indexOf(subMethods, req.params.id) >= 0) {

        // call next to the good root will be called
        return next();
      }

      // check if the params id have 24 characters
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {

        // Return to the user an special error
        return res.status(200).jsonp({
          status  : 'error',
          code    : '400000',
          message : 'You have an error in your request, an Id should be compose ' +
          'by 24 digit and/or characters',
          data    : {}
        });
      }
    }
    return true;
  };

  /**
  * Implement the http request : GET and HEAD</br>
  * Get an object </br>
  * Send a error to the client if the request failed, or a json file to the client with the data requested if it's an GET requerst </br>
  * OR if it's a head request, send a http header
  *
  * @method addHTTPRequestGets
  * @param  {Object} model the data model object
  * @param  {String} path the root path
  * @param  {String} param The property to retrieve on url
  */
  httpMethods.get = function (model, path, param) {

    // Add methode head to the route
    scope.app.get(path, function (req, res, next) {

      // Check if this root is valid for this request
      var checkRequest = isValidRequest(req, res, next, methods);
      if (!checkRequest) {
        return checkRequest;
      }

      logger.debug('[ ControllerRoutes.get ] - revceiving request,' +
      ' route is : ' + path);

      model.read(req.params[param]).then(function (result) {
        // Send respond to client
        res.status(200).jsonp({
          status  : 'success',
          code    : '200000',
          message : 'Document(s) are found',
          data    : _.isEmpty(result) ? [] : result
        });

      }).catch(function (error) {

        res.status(200).jsonp({
          status  : 'error',
          code    : '400000',
          message : 'An error occured when retrieving document',
          data    : {}
        });

        logger.error('[ ControllerRoutes.get ] - error : ' + error);
      });
    });
  };

  httpMethods.head = function (model, path, param, method) {

    httpMethods.get(model, path, param, method);
  };

  // Delete an document specified by his ID, only if 'deleted_date' was defined in his mongoose schema
  httpMethods.delete = function (model, path) {

    // Add methode update to the route
    scope.app.delete(path, function (req, res, next) {

      // Check if this root is valid for this request
      var checkRequest = isValidRequest(req, res, next, methods);
      if (!checkRequest) {
        return checkRequest;
      }

      logger.debug('[ ControllerRoutes.delete ] - revceiving request,' +
      ' route is : ' + path);

      // tricks to pass the yocto-hint norme
      var deletedDate = 'deleted_date';

      // Test if variable deletedDate was defined, and an id is specified
      if (!_.isUndefined(model.schema.paths[deletedDate]) &&
      !_.isUndefined(req.params.id)) {

        var data = utils.obj.underscoreKeys({
          updatedDate : Date.now(),
          deletedDate : Date.now()
        });

        // Set date in the param deleted_date in document to indicate it was deleted
        return model.update(req.params.id, data).then(function (value) {

          // test if an document was deleted
          if (_.isEmpty(value)) {
            logger.error('[ ControllerRoutes.delete ] - the document with id : ' +  req.params.id +
            ' wasn\'t deleted because this id doesn\'t correspond to an existant document');

            return res.status(200).jsonp({
              status  : 'error',
              code    : '400000',
              message : 'An error occured, the document was not deleted because this id doesn\'t ' +
              'correspond to an existant document',
              data    : {}
            });
          }

          // The document was deleted
          res.status(200).jsonp({
            status  : 'success',
            code    : '200000',
            message : 'The document(s) was deleted',
            data    : {}
          });
          logger.info('[ ControllerRoutes.delete ] - the document with id : ' +  req.params.id +
          ' was deleted');
        }).catch(function (error) {

          res.status(200).jsonp({
            status  : 'error',
            code    : '400000',
            message : 'An error occured, the document was not deleted',
            data    : {}
          });
          logger.error('[ ControllerRoutes.delete ] - error : ' + error);
        });
      }

      // The pramas id was not specified or deleted_date doesnt exist in this schema
      res.status(200).jsonp({
        status  : 'error',
        code    : '400000',
        message : 'The document was not deleted because id wasn\'t' +
        'specified, or the field deleted_date doesn\'t exist in schema',
        data    : {}
      });
      logger.error('[ ControllerRoutes.delete ] - The document was not deleted because id wasn\'t' +
      'specified, or the field deleted_date doesn\'t exist in schema');
    });
  };

  // patch method update only param given
  httpMethods.patch = function (model, path, param) {

    scope.app.patch(path, function (req, res, next) {

      // Check if this root is valid for this request
      var checkRequest = isValidRequest(req, res, next, methods);
      if (!checkRequest) {
        return checkRequest;
      }

      logger.debug('[ ControllerRoutes.patch ] - revceiving request,' +
      ' route is : ' + path);

      var data = req.body;

      // Test if id is specified, because ID is required to an patch an document
      if (!_.isUndefined(req.params.id)) {

        // tricks to pass the yocto-hint norme
        var updatedDate = 'updated_date';

        // Test if variable updated_date was defined, and update it
        if (!_.isUndefined(model.schema.paths[updatedDate])) {

          data = _.merge(data, utils.obj.underscoreKeys({
            updatedDate : Date.now()
          }));
        }

        return model.update(req.params[param], data, 'patch').then(function (value) {

          // test if an document was updated for this id
          if (_.isEmpty(value)) {
            logger.error('[ ControllerRoutes.patch ] - the document with id : ' +  req.params.id +
            ' wasn\'t updated because this id doesn\'t correspond to an existing document');

            return res.status(200).jsonp({
              status  : 'error',
              code    : '400000',
              message : 'An error occured, the document was not updated because this id doesn\'t ' +
              'correspond to an existing document',
              data    : {}
            });
          }

          // Document updated
          res.status(200).jsonp({
            status  : 'success',
            code    : '200000',
            message : 'The document(s) was updated',
            data    : {}
          });
        }).catch(function (error) {

          res.status(200).jsonp({
            status  : 'error',
            code    : '400000',
            message : 'An error occured, the document was not updated',
            data    : {}
          });
          logger.error('[ ControllerRoutes.patch ] - error : ' + error);
        });
      }

      // The pramas id was not specified or deleted_date doesnt exist in this schema
      res.status(200).jsonp({
        status  : 'error',
        code    : '400000',
        message : 'The document wasn\'t updated because id wasn\'t specified in params.',
        data    : {}
      });
      logger.error('[ ControllerRoutes.patch ] - The document was not updated because id wasn\'t' +
      'specified');
    });
  };

  // put should update the whole object with data given ..
  httpMethods.put = function (model, path, param) {

    scope.app.put(path, function (req, res, next) {

      // Check if this root is valid for this request
      var checkRequest = isValidRequest(req, res, next, methods);
      if (!checkRequest) {
        return checkRequest;
      }

      logger.debug('[ ControllerRoutes.put ] - revceiving request,' +
      ' route is : ' + path);

      model.update(req.params[param], req.body, 'put').then(function () {

        res.status(200).jsonp({
          status  : 'success',
          code    : '200000',
          message : 'The document(s) was updated',
          data    : {}
        });
      }).catch(function (error) {

        res.status(200).jsonp({
          status  : 'error',
          code    : '400000',
          message : 'An error occured, the document was not updated',
          data    : {}
        });

        logger.error('[ ControllerRoutes.put ] - error : ' + error);
      });
    });
  };

  /**
  * Implement the http request : POST </br>
  * Add a new Object in DB </br>
  * Send a error to the client if the request failed, otherwise a json file to the client with the data
  *
  * @method post
  * @param  {Object} model the data model object (Model start with an uppercase for jshint validation)
  * @param  {String} path The root path of model
  */
  httpMethods.post = function (model, path) {

    // Add methode post to the route
    scope.app.post(path, function (req, res, next) {

      // Check if this root is valid for this request
      var checkRequest = isValidRequest(req, res, next, methods);
      if (!checkRequest) {
        return checkRequest;
      }

      logger.debug('[ ControllerRoutes.post ] - revceiving request, route is : ' + path);

      model.create(req.body).then(function (value) {

        // Objet created
        res.status(200).jsonp({
          status  : 'success',
          code    : '200000',
          message : 'The document(s) was created',
          data    : value
        });
      }).catch(function (error) {

        // Error creating object
        res.status(200).jsonp({
          status  : 'error',
          code    : '400000',
          message : 'An error occured, the document was not created, please check your request',
          data    : {}
        });

        logger.error('[ ControllerRoutes.post ] - error : ' + error);
      });
    });
  };

  // retrieve the model
  var model = scope.models.db.getModel(nameModel);

  // check if model is not false
  if (model) {
    logger.debug('[ ControllerRoutes.addRoute ] - adding new route, path : ' + pathRequest);

    // retrieve specifiq route in model
    _.each(route.methods, function (method) {

      // Push first subroot of the path
      var splited = method.path.split('/');
      methods.push(_.first(splited));

      try {
        var pathSubReq = path.normalize(route.path + '/' + method.path);

        // Load corresponded callback file to retrieve function
        var callbackFile = require(path.normalize(pathCallback + nameModel.toLowerCase() + '.js'));

        if (!_.isUndefined(callbackFile[method.fn])) {

          // Bind method to the route
          scope.app[method.method](pathSubReq, function (req, res, next) {
            callbackFile[method.fn](req, res, next, model);
          });

        } else {
          throw ' Function \'' + method.fn + '\' not found';
        }

      } catch (e) {
        logger.error('[ ControllerRoutes.addRoute ] - can\'t add specifiq route : \'' +
        method.sync + '\' for model : \'' + nameModel + '\', more details : ' + e);
      }
    });

    // Handle wich requests are implemented
    // Retrieve the difference betwenn ALL_HTTP_REQUESTS and all requests excluded
    _.each(_.difference(scope.ALL_HTTP_REQUESTS, reqExcluded), function (fn) {

      // Bind routes to model
      httpMethods[fn](model, pathRequest, 'id', fn);
    }, this);

    return true;
  }
  logger.error('[ ControllerRoutes.addRoute ] - can\'t add route : \'' +
  pathRequest + '\' ,because model is not defined');
  return false;
};

/**
* Initialise the controller </br>
* Retrieve all routes and thoose alias and add there into router
*
* @method init
* @param {Object} app Instance of express
* @param {String} pathRoutes the path of the file route.json
* @param {Object} ecrmDatabase The whole database model, it's an yocto-mongoose object
* @param {String} pathCallback the path folder where all the callback are
* @return {Boolean} If success return true, otherwise false
*/
RouteController.prototype.init = function (app, pathRoutes, ecrmDatabase, pathCallback) {

  logger.debug('[ ControllerRoutes.init ] - start');

  // Retrieve Instance of express and save it
  this.app   = app;

  // define object that contains all routes
  var routes = {};

  // test if the two params are string and not empty
  if (!_.isString(pathRoutes) || !_.isString(pathCallback) ||
  _.isEmpty(pathRoutes) || _.isEmpty(pathCallback)) {
    return false;
  }

  // Test if the config files exist and retrive routes files
  try {

    // Use fs.accessSync in try/catch because fs.accessSync throw an exception if one file doesn't exist
    fs.accessSync(pathRoutes);

    // Load route config file
    routes = JSON.parse(fs.readFileSync(pathRoutes, 'utf-8'));
  } catch (e) {
    logger.error('[ ControllerRoutes.init ] - error during loading files, more details : ' + e);
    return false;
  }

  this.models = ecrmDatabase;

  // read json file and add each routes
  _.each(routes.routes, function (route) {

    // Execute the joi vailidation
    var result = routeJoiSchema.validate(route);

    // Check if have no error in joi validation
    if (_.isEmpty(result) || _.isEmpty(result.error)) {

      // create a array that contains the main route, and all thoose aliases
      var routeAndAlias = [];
      routeAndAlias.push(route.path);

      // Add alias if exists
      if (!_.isEmpty(route.alias)) {
        routeAndAlias.push(route.alias);
        routeAndAlias = _.flatten(routeAndAlias);
      }

      // add Main route
      _.each(routeAndAlias, function (val) {

        // add default params id
        val += '/:id?';

        // Add route in router
        this.addRoute(val, route.model, route.excluded, route.param, route, pathCallback,
        route.optionalParam);
      }, this);

    } else {
      logger.error('[ ControllerRoutes.init ] - Joi Validation failed ; error when trying to add ' +
      'a new route, please check the file : \'routes.json\'');

      // log each error
      _.each(result.error.details, function (val) {

        logger.warning('[ ControllerRoutes.init ] - ' + val.message + ' at ' + val.path);
      });
    }
  }, this);

  return true;
};

/**
* Export current Controller to use it on node
*/
module.exports = new (RouteController)();
