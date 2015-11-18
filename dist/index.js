/* yocto-auth - Yocto auth is an express middleware that permit an user to login it on an api, the module is based on passportJS - V0.1.0 */
function Auth(a){this.app={},this.dataCommon={},this.AuthModel={},this.configs={},this.logger=a||logger}function bindStrategy(a,b,c){c.app.get(a.urls.connect,c.dataCommon.session,function(a,b,c){setUrlSession(a),_.isUndefined(a.params.id)||_.isUndefined(a.params.id)||(a.session.join={id:a.params.id}),c()},passport.authenticate(b,"google"===b?{scope:a.scope}:{})),c.app.get(a.urls.callback,c.dataCommon.session,passport.authenticate(b,{failureRedirect:c.dataCommon.internalUrlRedirect+"?value="+encode('{"error":true,"provider":"'+b+'"}'),successRedirect:c.dataCommon.internalUrlRedirect+"?value="+encode('{"error":false,"provider":"'+b+'"}')}))}function encode(a){var b=utf8.encode(a);return base64.encode(b)}function decode(a){var b=base64.decode(a);return utf8.decode(b)}function setUrlSession(a){var b=url.parse(a.headers.referer);a.session.ecrm={urlRedirectSuccess:b.protocol+"//"+b.host+"/auth/success",urlRedirectFail:b.protocol+"//"+b.host+"/auth/fail"}}var passport=require("passport"),FacebookStrategy=require("passport-facebook").Strategy,GoogleStrategy=require("passport-google-oauth").OAuth2Strategy,TwitterStrategy=require("passport-twitter").Strategy,_=require("lodash"),qs=require("qs"),logger=require("yocto-logger"),Strategy=require("passport-local").Strategy,signature=require("cookie-signature"),LdapStrategy=require("passport-ldapauth"),url=require("url"),base64=require("base-64"),utf8=require("utf8"),utils=require("yocto-utils");Auth.prototype.init=function(a,b,c){this.app=a,this.AuthModel=b,this.dataCommon=c,a.use(passport.initialize()),passport.serializeUser(function(a,b){b(null,a)}),passport.deserializeUser(function(a,b){b(null,a)}),this.setEndPoint()},Auth.prototype.setEndPoint=function(){var a=this;this.app.get(this.dataCommon.internalUrlRedirect,this.dataCommon.session,function(b,c){function d(b,c,d,e){return a.logger.error('[ yocto-auth.endPoint ] error authentication for provider "'+c+'", more details : ',b),"standard"===c||"ad"===c?e.status(200).jsonp({status:"error",code:"400101",message:b}):void e.redirect(d.session.ecrm.urlRedirectFail)}var e={};try{if(e=qs.parse(b._parsedUrl.query),e=JSON.parse(decode(e.value)),e.error)throw{details:e.error,provider:e.provider};var f="provider_id",g={user:b.session.passport.user,provider:e.provider,paramToFind:{auth_type:e.provider,"social_profile.provider_id":b.session.passport.user[f]}};"ad"===e.provider?g.paramToFind={auth_type:"active-directory","active_directory_profile.dn":b.session.passport.user.dn}:"standard"===e.provider&&(g.paramToFind={password:b.session.passport.user.password,$or:[{"login.email":b.session.passport.user.username},{"login.phone":b.session.passport.user.username}]}),_.isUndefined(b.session.join)?a.AuthModel[a.configs[e.provider].db.method](g).then(function(d){if(_.isEmpty(d))throw"User not found for this credentials.";b.session.passport.user=d,c.redirect(b.session.ecrm.urlRedirectSuccess+"?"+qs.stringify({session:"s:"+signature.sign(b.sessionID,a.dataCommon.secretCookieKey)}))})["catch"](function(a){d(a,e.provider,b,c)}):a.AuthModel.joinAccount(b.session.join.id,utils.obj.underscoreKeys({authType:e.provider,socialProfile:b.session.passport.user})).then(function(){a.logger.info('[ yocto-auth.endPoint ] - Document Auth created for account : "',b.session.join.id,'" for provider : "',e.provider,'"'),delete b.session.join,c.redirect(b.session.ecrm.urlRedirectSuccess+"/join")})["catch"](function(f){a.logger.error('[ yocto-auth.endPoint ] - error cannot create auth document for this social network "',f),b.session.ecrm.urlRedirectSuccess+="/join",delete b.session.join,d(f,e.provider,b,c)})}catch(h){d(h.details,h.provider,b,c)}})},Auth.prototype.enableTwitter=function(a){this.configs.twitter=a,passport.use(new TwitterStrategy({consumerKey:a.identifier,consumerSecret:a.secret,callbackURL:this.dataCommon.host+a.urls.callback},function(a,b,c,d){var e=utils.obj.underscoreKeys({providerId:c.id,displayName:c.displayName,profilePicture:_.isUndefined(_.first(c.photos))?"":_.first(c.photos).value,accessToken:a,secretToken:b});d(null,e)})),bindStrategy(a,"twitter",this)},Auth.prototype.enableStandard=function(a){this.configs.standard=a;var b=this;passport.use(new Strategy(function(a,b,c){c(null,{username:a,password:b})})),this.app.post(a.urls.connect,b.dataCommon.session,passport.authenticate("local",{failureRedirect:this.dataCommon.internalUrlRedirect+"?value="+encode('{"error":true,"provider":"standard"}')}),function(a,c){return a.session.passport.user.error?c.redirect(b.dataCommon.internalUrlRedirect+"?value="+encode('{"error":true,"provider":"standard"}')):(setUrlSession(a),void c.redirect(b.dataCommon.internalUrlRedirect+"?value="+encode('{"error":false,"provider":"standard"}')))})},Auth.prototype.enableFacebook=function(a){this.configs.facebook=a,passport.use(new FacebookStrategy({clientID:a.identifier,clientSecret:a.secret,callbackURL:this.dataCommon.host+a.urls.callback,profileFields:a.fields},function(a,b,c,d){var e=utils.obj.underscoreKeys({providerId:c.id,displayName:c.displayName,lastname:c.name.familyName,firstname:c.name.givenName,sex:c.gender,profilePicture:_.isUndefined(_.first(c.photos))?"":_.first(c.photos).value,accessToken:a});d(null,e)})),bindStrategy(a,"facebook",this)},Auth.prototype.enableGoogle=function(a){this.configs.google=a,passport.use(new GoogleStrategy({clientID:a.identifier,clientSecret:a.secret,callbackURL:this.dataCommon.host+a.urls.callback},function(a,b,c,d){var e=utils.obj.underscoreKeys({providerId:c.id,displayName:c.displayName,lastname:c.name.familyName,firstname:c.name.givenName,sex:c.gender,profilePicture:_.isUndefined(_.first(c.photos))?"":_.first(c.photos).value,accessToken:a});d(null,e)})),bindStrategy(a,"google",this)},Auth.prototype.enableActiveDirectory=function(a){this.configs.ad=a;var b=this;passport.use(new LdapStrategy({server:a.server,usernameField:"username",passwordField:"display_password"},function(a,b){b(null,a)})),this.app.post(a.urls.connect,b.dataCommon.session,function(a,c,d){setUrlSession(a),passport.authenticate("ldapauth",function(d,e){var f=JSON.stringify({error:_.isEmpty(d)?!1:!0,provider:"ad"});a.session.passport={user:_.isNull(e)?{}:e},c.redirect(b.dataCommon.internalUrlRedirect+"?value="+encode(f))})(a,c,d)})},module.exports=function(a){return new Auth(a)};