'use strict';

module.exports = function (grunt) {
  // init config
  grunt.initConfig({
    // default package
    pkg       : grunt.file.readJSON('package.json'),

    todo      : {
      options : {
        marks       : [
          { name : 'TODO', pattern : /TODO/, color : 'yellow' },
          { name : 'FIXME', pattern : /FIXME/, color : 'red' },
          { name : 'NOTE', pattern : /NOTE/, color : 'blue' }
        ],
        file        : 'REPORT.md',
        githubBoxes : true,
        colophon    : true,
        usePackage  : true
      },
      src     : [
        'src/*.js',
      ]
    },

    // hint our app
    yoctohint : {
      options  : {},
      all      : [ 'src/***', 'Gruntfile.js' ]
    },

    // Uglify our app
    uglify    : {
      options : {
        banner  : '/* <%= pkg.name %> - <%= pkg.description %> - V<%= pkg.version %> */\n'
      },
      api     : {
        files : [ {
          expand  : true,
          cwd     : 'src',
          src     : '*.js',
          dest    : 'dist'
        } ]
      }
    },
    clean     : {
      dist        : [ 'dist/*']
    },
    // test our app
    mochacli  : {
      options : {
        'reporter'       : 'spec',
        'inline-diffs'   : false,
        'no-exit'        : true,
        'force'          : false,
        'check-leaks'    : true,
        'bail'           : false
      },
      all     : [ 'tests/unit/*.js' ]
    },
    // copy files
    copy      : {
      all : {
        expand  : true,
        cwd     : 'src/',
        src     : '**',
        dest    : 'dist/'
      }
    }
  });

  // load tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-todo');
  grunt.loadNpmTasks('yocto-hint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // register tasks
  grunt.registerTask('report', 'todo');
  grunt.registerTask('hint', [ 'yoctohint' ]);
  grunt.registerTask('tests', 'mochacli');
  grunt.registerTask('build', [ 'yoctohint', 'clean:dist', 'copy', 'uglify' ]);
  grunt.registerTask('default', [ 'tests', 'build' ]);
};
