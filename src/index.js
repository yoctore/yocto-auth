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
  this.AuthModel    = {};

  /**
  * Object that contains all configuration
  * @type {Object}
  */
  this.configs      = {};

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
 * @param  {Obejct} AuthModel    Auth model from mongoose
 * @param  {Obejct} data         configuration of stragtegy
 */
Auth.prototype.init = function (app, AuthModel, data) {

  // Set data
  this.app          = app;
  this.AuthModel    = AuthModel;
  this.dataCommon   = data;

  // initialize passportjs
  app.use(passport.initialize());

  // Enable serialize user
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  // Enable deserialize user
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  // Set end point
  this.setEndPoint();
};

/**
 * Set end point of all authentication routes and method or social network association
 */
Auth.prototype.setEndPoint = function () {

  // Save context
  var context = this;

  // This route is the endPoint of all authentication methods
  this.app.get(this.dataCommon.internalUrlRedirect,  this.dataCommon.session, function (req, res) {

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

      // trick to pass the norme
      var providerId  = 'provider_id';

      // Define data to find account in db ; this is for provider FB, Google, Twitter
      var dataToFind = {
        user        : req.session.passport.user,
        provider    : params.provider,
        paramToFind : {
          'auth_type'                   : params.provider,
          'social_profile.provider_id'  : req.session.passport.user[providerId]
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
        context.AuthModel.joinAccount(req.session.join.id, utils.obj.underscoreKeys({
          authType       : params.provider,
          socialProfile  : req.session.passport.user
        })).then(function () {

          // Association success
          context.logger.info('[ yocto-auth.endPoint ] - Document Auth created for account : "',
          req.session.join.id, '" for provider : "', params.provider, '"');

          // Call function to handle error
          delete req.session.join;

          // TODO update redirect to : res.redirect(req.session.ecrm.urlRedirectSuccess + '/join/provider/params.provider');
          // redirect to the 'caller' for success
          res.redirect(req.session.ecrm.urlRedirectSuccess + '/join');
        }).catch(function (error) {

          // An error occurred during connection
          context.logger.error('[ yocto-auth.endPoint ] - error cannot create auth document for ' +
          'this social network "' , error);

          // uppdate error redirection
          req.session.ecrm.urlRedirectSuccess += '/join';

          // remove the temporary value in session
          delete req.session.join;

          // call error function
          handleError(error, params.provider, req, res);
        });

        // Is an request to connect user
      } else {

        // Retrieve the function that permit to authenticate user
        context.AuthModel[context.configs[params.provider].db.method](dataToFind).
        then(function (account) {

          // User not found for the given credentials
          if (_.isEmpty(account)) {
            throw 'User not found for this credentials.';
          }

          // Set user in session
          req.session.passport.user = account;

          // redirect to the 'caller' with the id of session
          res.redirect(req.session.ecrm.urlRedirectSuccess + '?' + qs.stringify({
            session : 's:' + signature.sign(req.sessionID, context.dataCommon.secretCookieKey)
          }));
        }).catch(function (error) {

          // Call function to handle error
          handleError(error, params.provider, req, res);
        });
      }
    } catch (error) {

      // Call function to handle error
      handleError(error.details, error.provider, req, res);
    }

    // Handle error Connection
    function handleError (error, provider, req, res) {

      context.logger.error('[ yocto-auth.endPoint ] error authentication for provider "' +
      provider + '", more details : ' , error);

      // test if we send an http response or redirect
      if (provider === 'standard' || provider === 'ad') {

        // Return an HTTP response
        return res.status(200).jsonp({
          status  : 'error',
          code    : '400101',
          message : error
        });
      }

      // redirect to an error page
      res.redirect(req.session.ecrm.urlRedirectFail);
    }
  });
};

/**
* Enable Twitter authentication
*
* @method enableTwitter
* @param  {Object} data configuration of stragtegy
*/
Auth.prototype.enableTwitter = function (data) {

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
  bindStrategy(data, 'twitter', this);
};

/**
* Enable Standard authentication
*
* @method enableStandard
* @param  {Object} data configuration of stragtegy
*/
Auth.prototype.enableStandard = function (data) {

  // Save config
  this.configs.standard = data;

  // Save context
  var context = this;

  // Define strateg local
  passport.use(new Strategy(function (username, password, done) {

    // Set data in session
    done(null, {
      username  : username,
      password  : password
    });
  }));

  this.app.post(data.urls.connect, context.dataCommon.session,
  passport.authenticate('local', {
    failureRedirect : this.dataCommon.internalUrlRedirect +
    '?value=' + encode('{"error":true,"provider":"standard"}')
  }),
  function (req, res) {

    // Test Error occur during connection
    if (req.session.passport.user.error) {
      return res.redirect(context.dataCommon.internalUrlRedirect +
        '?value=' + encode('{"error":true,"provider":"standard"}')
      );
    }

    // Set url redirect in session
    setUrlSession(req);

    // Redirect to the endPoint
    res.redirect(context.dataCommon.internalUrlRedirect +
    '?value=' + encode('{"error":false,"provider":"standard"}'));
  });
};

/**
* Enable Facebook authentication
*
* @param  {Object} data configuration of stragtegy
*/
Auth.prototype.enableFacebook = function (data) {

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
  bindStrategy(data, 'facebook', this);
};

/**
* Function that bind a passport Strategy to an http route
* Create the call and callback routes
*
* @param  {Object} data        Data of the routes and strategy
* @param  {String} provider    Name of the provider
* @param  {Object} context     The main context
*/
function bindStrategy (data, provider, context) {

  // Create the call route for an strategy
  context.app.get(data.urls.connect, context.dataCommon.session, function (req, res, next) {

    // Set url redirect in session
    setUrlSession(req);

    // test if it's an join request
    if (!_.isUndefined(req.params.id) && !_.isUndefined(req.params.id)) {

      // Set data in session to determine it's an request for create auth
      req.session.join = {
        id : req.params.id
      };
    }

    // call next route
    next();
  }, passport.authenticate(provider, provider === 'google' ? {
    scope : data.scope
  } : {}));

  // Create the callback route
  context.app.get(data.urls.callback, context.dataCommon.session, passport.authenticate(provider, {

    // Set  callback to endPoint
    failureRedirect : context.dataCommon.internalUrlRedirect +
    '?value=' + encode('{"error":true,"provider":"' + provider + '"}'),
    successRedirect : context.dataCommon.internalUrlRedirect +
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

  // retrieve headers of request
  var urlParse = url.parse(req.headers.referer);

  // Set redirection url in session
  req.session.ecrm = {
    urlRedirectSuccess : urlParse.protocol + '//' + urlParse.host + '/auth/success',
    urlRedirectFail    : urlParse.protocol + '//' + urlParse.host + '/auth/fail'
  };
}

/**
* Enable Google authentication
*
* @method enableGoogle
* @param  {Object} data configuration of stragtegy
*/
Auth.prototype.enableGoogle = function (data) {

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
  bindStrategy(data, 'google', this);
};

/**
* Enable active directory authentication
*
* @method enableActiveDirectory
* @param  {Object} data configuration of stragtegy
*/
Auth.prototype.enableActiveDirectory = function (data) {

  // Save config
  this.configs.ad = data;

  // Save contexts
  var context = this;

  passport.use(new LdapStrategy({
    server        : data.server,
    usernameField : 'username',
    passwordField : 'display_password'
  }, function (user, done) {

    // Return user
    done(null, user);
  }));

  // Declare express route
  this.app.post(data.urls.connect, context.dataCommon.session, function (req, res, next) {

    // Set url redirect in session
    setUrlSession(req);

    passport.authenticate('ldapauth', function (err, user) {

      var data = JSON.stringify({
        error     : _.isEmpty(err) ? false : true,
        provider  : 'ad'
      });

      // Set temporary user in session
      req.session.passport = {
        user : _.isNull(user) ? {} : user
      };

      // Redirect to endPoint
      res.redirect(context.dataCommon.internalUrlRedirect +
      '?value=' + encode(data));

    })(req, res, next);
  });
};

// Exports Middleware
// module.exports = new (Auth) ();
module.exports = function (logger) {
  return new (Auth)(logger);
};
