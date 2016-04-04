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
    // copy files
    copy      : {
      all : {
        expand  : true,
        cwd     : 'src/',
        src     : '**',
        dest    : 'dist/'
      }
    },
    // unit testing
    mochaTest : {
      // Test all unit test
      all  : {
        options : {
          reporter : 'spec',
        },
        src     : [ 'test/unit/*.js' ]
      }
    }
  });

  // load tasks
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-todo');
  grunt.loadNpmTasks('yocto-hint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // register tasks
  grunt.registerTask('report', 'todo');
  grunt.registerTask('hint', [ 'yoctohint' ]);
  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('build', [ 'yoctohint', 'clean:dist', 'copy', 'uglify' ]);
  grunt.registerTask('default', [ 'test', 'build' ]);
};
