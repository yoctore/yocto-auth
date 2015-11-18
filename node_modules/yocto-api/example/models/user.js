"use strict";

var _         = require('lodash');
var path      = require('path');
var base      = path.normalize(process.cwd()); //Get curent path
var fs        = require('fs');
var logger    = require('yocto-logger');

/**
 * Save object in database used for images and new event
 *
 * @param  {[type]} obj [description]
 * @param  {Object} res Optional request
 * @return {[type]}     [description]
 */
exports.create = function(obj, callback) {
  // save the object and check for errors
  obj.save(function(err) {

    var objToSend  = { success : 'Object added on database' };
    var statusCode = 200;

    if (err) {
      objToSend  = { error : err };
      statusCode = 400;
    }

    if (!_.isUndefined(callback)) {
      callback(statusCode, objToSend);
    }
  });
};
