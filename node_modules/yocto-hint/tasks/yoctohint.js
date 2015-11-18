'use strict';

var _         = require('lodash');
var reporters = require('jshint-stylish').toString();
var hooker    = require('hooker');
var chalk     = require('chalk');
var path      = require('path');

/**
 * Default export for grunt yocto-norme-plugin
 */ 
module.exports = function (grunt) {

  // Default yocto config for jshint and jscs code style
  var defaultOptions = {
    jshint  : {
      options : {
        curly     : true,
        node      : true,
        yui       : true,
        eqeqeq    : true,
        unused    : true,
        undef     : true,
        freeze    : true,
        reporter  : reporters
      },
      all     : []
    },
    jscs    : {
      options : {
        config : [ __dirname, 'yocto.json' ] .join('/')
      },
      all     : []
    }
  };

  // Append default options to grunt config
  grunt.config.set('jshint', defaultOptions.jshint);
  grunt.config.set('jscs', defaultOptions.jscs);

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerTask('yoctohint:hintchecker', 'My hint checker', function () {
    // Current internal Task
    var currentTask;

    // Filte task to get correct task to process.
    // Keep safe all other task in grunt config
    var tasks = _.filter(Object.keys(grunt.config.data), function (key) {
      return (key === 'jshint' || key === 'jscs');
    });

    // Hook grunt task execution
    hooker.hook(grunt.task, 'runTaskFn', {
      pre : function (context) {
        if (currentTask !== undefined) {
          currentTask = true; // true indicates the task has finished successfully.
        }
        currentTask = context.nameArgs;
      }
    });

    // Hook into the success / fail writer.
    hooker.hook(grunt.log.writeln(), [ 'success', 'fail' ], function (res) {
      // check done or aborted
      var done    = res === 'Done, without errors.';
      var warning = res === 'Done, but with warnings.';
      var aborted = res === 'Aborted due to warnings.';
      var error   = warning || aborted;

      // Is finish ??
      if (done || error) {
        if (currentTask !== undefined) {
          currentTask = error ? false : true;

          try {
            // Get file path of art place
            var artPath = [ __dirname, 'art', 'art.json' ].join('/');

            if (!grunt.file.exists(artPath)) {
              throw ([ 'art config file"', artPath, '"not found.' ].join(' '));
            }
            var arts  = JSON.parse(grunt.file.read(artPath));

            // Is success or error !!!
            var state = error ? 'error' : 'success';

            // Define end state
            var sMsg  = {
              file  : _.map(arts[state], function (art) {
                return [ __dirname, 'art', state, art ].join('/');
              }),
              color : error ? 'red' : 'green'
            };

            // Build message file
            sMsg.file = sMsg.file[_.random(0, sMsg.file.length - 1)];
            console.log(chalk[sMsg.color](grunt.file.read(sMsg.file)));
          } catch (e) {
            // default message config
            var cMsg = {
              level : error ? 'warn' : 'ok',
              msg   : error ? 'Please correct your code !!! ' : 'Good Job. Jeune padawan !!'
            };

            // Log exeption, but it produces by art config
            grunt.log.warn([ 'Plugin error.', e ].join(' '));
            // Need to log end message with custom param
            grunt.log[cMsg.level](cMsg.msg);
          }
        }
      }
    });

    // Run each given task
    _.each(tasks, function (task) {
      grunt.task.run(task);
    });
  });

  // Register default plugin process
  grunt.registerMultiTask('yoctohint',
    'Manage and process code usage on yocto. Process jshint and jscs', function () {
    // retrive options
    var options = this.options();

    // keep only with options -- boolean type only
    _.omit(options.jshint, function (o) {
      return !_.isBoolean(o) || (!_.isString(o) && !_.isEmpty(o));
    });

    // check if jshint option is given
    if (!_.isUndefined(options.jshint) && !_.isNull(options.jshint) &&
      _.isObject(options.jshint) && !_.isEmpty(options.jshint)) {

      // Log message and merge options
      grunt.log.ok('New jshint options given for yocto norme. Processing update.');
      _.merge(grunt.config.data.jshint.options, options.jshint);
    }

    // Filter file and return correct file path
    this.data = this.filesSrc.map(function (filepath) {
      // exists ?
      if (!grunt.file.exists(filepath)) {
        grunt.log.warn([ 'Source file"', filepath, '"not found.' ].join(' '));

        // bash value retutning false
        return false;
      } else {
        grunt.log.ok([ 'Source file "', filepath, '"exists. adding on filter list.'].join(' '));

        // return file path
        return filepath;
      }
    });

    // Has data ?
    if (!_.isEmpty(this.data)) {
      // notify console
      grunt.log.ok([
        this.data.length,
        [ 'file', (this.data.length > 1 ? 's' : '') ].join(''),
        'found. Adding on hinter list.'
      ].join(' '));

      // Assign default options to config file
      defaultOptions.jshint.all = this.data;
      defaultOptions.jscs.all   = this.data;

      // Merge config data to grunt config
      grunt.config.merge('jshint', defaultOptions.jshint);
      grunt.config.merge('jscs', defaultOptions.jscs);

      // notif console
      grunt.log.ok('Processing yoctohint:checker ...');

      // Run tasks
      grunt.task.run('yoctohint:hintchecker');
    }
  });
  // save initial path
  var cwd = process.cwd();
  // change path to yocto-hint modules
  process.chdir(path.normalize([ __dirname, '..' ].join('/')));

  // Load grunt needed task
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  // return to the initial path
  process.chdir(cwd);
};
