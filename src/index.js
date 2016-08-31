var passport          = require('passport');
var FacebookStrategy  = require('passport-facebook').Strategy;
var GoogleStrategy    = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy   = require('passport-twitter').Strategy;
var _                 = require('lodash');
var qs                = require('qs');
var logger            = require('yocto-logger');
var Strategy          = require('passport-local').Strategy;
var signature         = require('cookie-signature');
var LdapStrategy      = require('passport-ldapauth');
var url               = require('url');
var base64            = require('base-64');
var utf8              = require('utf8');
var utils             = require('yocto-utils');

/**
 * Yocto-Auth : Express middleware for authentication
 *
 * @date : 29/09/2015
 * @author : Cedric Balard <cedric@yocto.re>
 * @copyright : Yocto SAS, All right reserved
 * @class Auth
 */
function Auth (yLogger) {

  /**
  * Express app
  * @type {Object}
  */
  this.app          = {};

  /**
  * Common data for app
  * @type {Object}
  */
  this.dataCommon   = {};

  /**
  * Model Auth from mongoose model
  * @type {Object}
  */
  this.authmodel    = {};

  /**
  * Object that contains all configuration
  * @type {Object}
  */
  this.configs      = {};

  // define array for standard strategy
  this.configs.standard = [];

  // define array for ad strategy
  this.configs.ad = [];

  /**
  * Default logger instance. can be override by set function
  *
  * @type {Object}
  */
  this.logger       = yLogger || logger;
}

/**
 * Init Middleware
 *
 * @param  {Obejct} app          THe app express
 * @param  {Obejct} authmodel    Auth model from mongoose
 * @param  {Obejct} data         configuration of stragtegy
 */
Auth.prototype.init = function (app, authmodel, data) {
  // check if necessary data is defined
  if (_.isUndefined(app) || _.isNull(app) || _.isEmpty(app) ||
  _.isUndefined(authmodel) || _.isNull(authmodel) || _.isEmpty(authmodel) ||
  _.isUndefined(data) || _.isNull(data) || _.isEmpty(data)) {
    // init false
    return false;
  }

  // Set data
  this.app          = app;
  this.authmodel    = authmodel;
  this.dataCommon   = data;

  // initialize passportjs
  app.use(passport.initialize());

  // enable serialize user
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  // enable deserialize user
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  // Set end point
  this.setEndPoint();

  // success init
  return true;
};

/**
 * Set end point of all authentication routes and method or social network association
 */
Auth.prototype.setEndPoint = function () {

  // This route is the endPoint of all authentication methods
  this.app.get(this.dataCommon.internalUrlRedirect,  this.dataCommon.session, function (req, res) {

    // test if the session have correct object
    if (_.isUndefined(req.session.ecrm) || _.isUndefined(req.session.ecrm.urlRedirectFail) ||
    _.isUndefined(req.session.ecrm.urlRedirectFail)) {

      this.logger.error('[ yocto-auth.endPoint ] - an error occured when reading session, object' +
      ' ecrm was not defined, it seems that the session was reinitialized');

      this.logger.debug('[ yocto-auth.endPoint ] - session that was in error : ' +
      utils.obj.inspect(req.session));

      // retrieve headers of request
      var urlParse = url.parse(req.headers.referer);

      // redirect client to an error auth page because
      return res.redirect(urlParse.protocol + '//' + urlParse.host + '/auth/fail?value=' +
      encode('{"status":"error",' +
      '"code":"400102",' +
      '"message":"An internal error occured, please retest to connect"}'));
    }

    // Set default params
    var params = {};

    // Use try to prevent parse error
    try {

      // parse url to retrieve
      params = qs.parse(req._parsedUrl.query);
      params = JSON.parse(decode(params.value));

      // Test if an error occured during connection
      if (params.error) {

        // throw error to send an error respond to the client
        throw {
          details   : params.error,
          provider  : params.provider
        };
      }

      // underscoreKeys data
      var sessionTmp = utils.obj.camelizeKeys(req.session.passport.user);

      // Define data to find account in db ; this is for provider FB, Google, Twitter
      var dataToFind = {
        user        : req.session.passport.user,
        provider    : params.provider,
        paramToFind : {
          'auth_type'                   : params.provider,
          'social_profile.provider_id'  : sessionTmp.providerId
        }
      };

      // case provider is an Active directory
      if ((params.provider === 'ad')) {
        dataToFind.paramToFind = {
          'auth_type'                   : 'active-directory',
          'active_directory_profile.dn' : req.session.passport.user.dn
        };
      } else if (params.provider === 'standard') {

        // case standard connection
        dataToFind.paramToFind = {
          'password' : req.session.passport.user.password,
          $or        : [
            { 'login.email' : req.session.passport.user.username },
            { 'login.phone' : req.session.passport.user.username }
          ]
        };
      }

      // test if we create an Auth document for Social network
      if (!_.isUndefined(req.session.join)) {

        // Start process to join an social network account to an api-account
        this.authmodel.joinAccount(req.session.join.id, utils.obj.underscoreKeys({
          authType       : params.provider,
          socialProfile  : req.session.passport.user
        })).then(function () {

          // Association success
          this.logger.info('[ yocto-auth.endPoint ] - Document Auth created for account : "',
          req.session.join.id, '" for provider : "', params.provider, '"');

          // Call function to handle error
          delete req.session.join;

          // redirect to the 'caller' for success with the name of provider
          res.redirect(req.session.ecrm.urlRedirectSuccess + '/join/success?value=' +
          encode('{"provider":"' + params.provider + '"}'));
        }.bind(this)).catch(function (error) {

          // An error occurred during connection
          this.logger.error('[ yocto-auth.endPoint ] - error cannot create auth document for ' +
          'this social network "' , error);

          // uppdate error redirection
          req.session.ecrm.urlRedirectFail += '/join/fail?value=' +
          encode('{"provider":"' + params.provider + '"}');

          // remove the temporary value in session
          delete req.session.join;

          // call error function
          handleError(error, params.provider, req, res);
        }.bind(this));

        // Is an request to connect user
      } else {

        // retrieve object of conection
        var connectParams = this.configs[params.provider];

        // test if it's an array
        if (_.isArray(connectParams)) {

          // retrieve the Object in array
          connectParams = connectParams[params.index];
        }

        // Retrieve the function that permit to authenticate user
        this.authmodel[connectParams.db.method](dataToFind).
        then(function (account) {

          // User not found for the given credentials
          if (_.isEmpty(account)) {
            throw 'User not found for this credentials.';
          }

          // Set user in session
          req.session.passport.user = account;

          // redirect to the 'caller' with the id of session
          res.redirect(req.session.ecrm.urlRedirectSuccess + '/success?' + qs.stringify({
            session : 's:' + signature.sign(req.sessionID, this.dataCommon.secretCookieKey)
          }));
        }.bind(this)).catch(function (error) {

          // Call function to handle error
          handleError(error, params.provider, req, res);
        });
      }
    } catch (error) {

      // Call function to handle error
      handleError(error.details, error.provider, req, res);
    }

    // Handle error Connection
    var handleError = function (error, provider, req, res) {

      this.logger.error('[ yocto-auth.endPoint ] error authentication for provider "' +
      provider + '", more details : ', utils.obj.inspect(error));

      // redirect to an error page with code error in url
      res.redirect(req.session.ecrm.urlRedirectFail + '/fail?value=' +
      encode('{"status":"error",' +
      '"code":"400101",' +
      '"message":"User not found for the given credentials"}'));
    }.bind(this);
  }.bind(this));
};

/**
 * add Twitter authentication
 *
 * @method addTwitter
 * @param  {Object} data configuration of stragtegy
 */
Auth.prototype.addTwitter = function (data) {

  // Save config
  this.configs.twitter = data;

  // define twiter Strategy
  // important : callbackUrl should have an 'hostname'
  passport.use(new TwitterStrategy({
    consumerKey       : data.identifier,
    consumerSecret    : data.secret,
    callbackURL       : this.dataCommon.host + data.urls.callback
  },
  function (token, tokenSecret, profile, done) {

    // Set user on session
    var user = utils.obj.underscoreKeys({
      providerId       : profile.id,
      displayName      : profile.displayName,
      profilePicture   : _.isUndefined(_.first(profile.photos)) ? '' :
      _.first(profile.photos).value,
      accessToken      : token,
      secretToken      : tokenSecret
    });

    // end process of connection
    done(null, user);
  }));

  // bind this strategy to middleware
  bindStrategy.apply(this, [data, 'twitter']);
};

/**
 * add Standard authentication
 *
 * @method addStandard
 * @param  {Object} data configuration of stragtegy
 */
Auth.prototype.addStandard = function (data) {

  // Save config
  this.configs.standard.push(data);

  // get index of inserted data
  var index = this.configs.standard.length - 1;

  // Define strateg local
  passport.use(new Strategy(function (username, password, done) {

    // Set data in session
    done(null, {
      username  : username,
      password  : password
    });
  }));

  // Add standard connection
  this.app.post(data.urls.connect, this.dataCommon.session,
  passport.authenticate('local', {
    failureRedirect : this.dataCommon.internalUrlRedirect +
    '?value=' + encode('{"error":true,"provider":"standard","index":' + index + '}')
  }),
  function (req, res) {

    this.logger.debug('[ yocto-auth.addStandard.cb ] - value of req.session.passport.user = ' +
    utils.obj.inspect(req.session.passport.user));

    // Test Error occur during connection
    if (req.session.passport.user.error) {

      this.logger.error('[ yocto-auth.addStandard.cb ] - error when finding session, ' +
      ' more details : ' + utils.obj.inspect(req.session.passport.user.error));

      // error so redirect to endPoint
      return res.redirect(this.dataCommon.internalUrlRedirect +
        '?value=' + encode('{"error":true,"provider":"standard","index":' + index + '}')
      );
    }

    // Set url redirect in session
    setUrlSession.apply(this, [ req ]);

    // Redirect to the endPoint
    res.redirect(this.dataCommon.internalUrlRedirect +
    '?value=' + encode('{"error":false,"provider":"standard","index":' + index + '}'));
  }.bind(this));
};

/**
 * add Facebook authentication
 *
 * @param  {Object} data configuration of stragtegy
 */
Auth.prototype.addFacebook = function (data) {

  // Save config
  this.configs.facebook = data;

  // Set Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID      : data.identifier,
    clientSecret  : data.secret,
    callbackURL   : this.dataCommon.host + data.urls.callback,
    profileFields : data.fields
  },
  function (accessToken, refreshToken, profile, done) {

    // Set user in session
    var user = utils.obj.underscoreKeys({
      providerId       : profile.id,
      displayName      : profile.displayName,
      lastname         : profile.name.familyName,
      firstname        : profile.name.givenName,
      sex              : profile.gender,
      profilePicture   : _.isUndefined(_.first(profile.photos)) ? '' :
      _.first(profile.photos).value,
      accessToken      : accessToken
    });

    // end process of connection
    done(null, user);
  }));

  // bind this strategy to middleware
  bindStrategy.apply(this, [data, 'facebook']);
};

/**
 * Function that bind a passport Strategy to an http route
 * Create the call and callback routes
 *
 * @param  {Object} data        Data of the routes and strategy
 * @param  {String} provider    Name of the provider
 */
function bindStrategy (data, provider) {

  // Create the call route for an strategy
  this.app.get(data.urls.connect, this.dataCommon.session, function (req, res, next) {

    // Set url redirect in session
    setUrlSession.apply(this, [ req ]);

    // test if it's an join request or not
    if (!_.isUndefined(req.params.id) && !_.isEmpty(req.params.id) && !_.isNull(req.params.id)) {

      // Set data in session to determine it's an request for create auth
      req.session.join = {
        id : req.params.id
      };
    }

    // call next route
    next();
  }.bind(this), passport.authenticate(provider, provider === 'google' ? {
    scope : data.scope
  } : {}));

  // Create the callback route
  this.app.get(data.urls.callback, this.dataCommon.session, passport.authenticate(provider, {

    // Set  callback to endPoint
    failureRedirect : this.dataCommon.internalUrlRedirect +
    '?value=' + encode('{"error":true,"provider":"' + provider + '"}'),
    successRedirect : this.dataCommon.internalUrlRedirect +
    '?value=' + encode('{"error":false,"provider":"' + provider + '"}')
  }));
}

// TODO : migrer vers yocto-utils
/**
 * Encode data in base64
 *
 * @param  {String} data data to encode
 * @return {String} The encoded string
 */
function encode (data) {
  var bytes = utf8.encode(data);
  return base64.encode(bytes);
}

// TODO : migrer vers yocto-utils
/**
 * Decode  data in base64
 *
 * @param  {String} data data to decode
 * @return {String} The decoded string
 */
function decode (data) {
  var bytes = base64.decode(data);
  return utf8.decode(bytes);
}

/**
 * Set Default url redirection in session
 *
 * @param  {Object} req Default obj req of ExpressJS
 */
function setUrlSession (req) {
  // log info
  this.logger.debug('[ yocto-auth.setUrlSession ] - headers.referer value is : ',
  req.headers.referer);

  // retrieve headers of request
  var urlParse = url.parse(req.headers.referer);

  // Set redirection url in session
  req.session.ecrm = {
    urlRedirectSuccess : urlParse.protocol + '//' + urlParse.host + '/auth',
    urlRedirectFail    : urlParse.protocol + '//' + urlParse.host + '/auth'
  };

  // log info
  this.logger.debug('[ yocto-auth.setUrlSession ] - url was set in session, req.session = ',
  utils.obj.inspect(req.session));
}

/**
 * add Google authentication
 *
 * @method addGoogle
 * @param  {Object} data configuration of stragtegy
 */
Auth.prototype.addGoogle = function (data) {

  // Save config
  this.configs.google = data;

  // Set Google Strategy
  passport.use(new GoogleStrategy({
    clientID      : data.identifier,
    clientSecret  : data.secret,
    callbackURL   : this.dataCommon.host + data.urls.callback
  },
  function (accessToken, refreshToken, profile, done) {

    // Set user on session
    var user = utils.obj.underscoreKeys({
      providerId       : profile.id,
      displayName      : profile.displayName,
      lastname         : profile.name.familyName,
      firstname        : profile.name.givenName,
      sex              : profile.gender,
      profilePicture   : _.isUndefined(_.first(profile.photos)) ? '' :
      _.first(profile.photos).value,
      accessToken      : accessToken
    });

    // end process of connection
    done(null, user);
  }));

  // Bind the current stragtegy
  bindStrategy.apply(this, [data, 'google']);
};

/**
 * add active directory authentication
 *
 * @method addActiveDirectory
 * @param  {Object} data configuration of stragtegy
 */
Auth.prototype.addActiveDirectory = function (data) {

  // Save config
  this.configs.ad.push(data);

  // get index of inserted data
  var index = this.configs.ad.length - 1;

  passport.use(new LdapStrategy({
    server        : data.server,
    usernameField : 'username',
    passwordField : 'display_password'
  }, function (user, done) {

    // Return user
    done(null, user);
  }));

  // Declare express route
  this.app.post(data.urls.connect, this.dataCommon.session, function (req, res, next) {

    // Set url redirect in session
    setUrlSession.apply(this, [ req ]);

    // LDAP Strategy
    passport.authenticate('ldapauth', function (err, user) {

      var data = JSON.stringify({
        error     : _.isNull(err) ? false : true,
        provider  : 'ad',
        index     : index
      });

      // Set temporary user in session
      req.session.passport = {
        user : _.isNull(user) ? {} : user
      };

      // Redirect to endPoint
      res.redirect(this.dataCommon.internalUrlRedirect +
      '?value=' + encode(data));

    }.bind(this))(req, res, next);
  }.bind(this));
};

// Exports Middleware
module.exports = function (logger) {
  return new (Auth)(logger);
};
