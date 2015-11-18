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
exports.addAcountSync = function(req, res) {
  // save the object and check for errors

  var objToSend = {
    status : "success",
    code : 200000,
    message : "test",
    date : ""
  };

  if (true) {
    objToSend.data = 'ok';
  } else {
    objToSend.status = 'error';
    objToSend.message = 'error test';

  }

  res.jsonp(objToSend);
};
