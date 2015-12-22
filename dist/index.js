/* yocto-auth - Yocto auth is an express middleware that permit an user to login it on an api, the module is based on passportJS - V0.2.1 */
function Auth(a){this.app={},this.dataCommon={},this.AuthModel={},this.configs={},this.configs.standard=[],this.configs.ad=[],this.logger=a||logger}function bindStrategy(a,b,c){c.app.get(a.urls.connect,c.dataCommon.session,function(a,b,c){setUrlSession(a),_.isUndefined(a.params.id)||_.isEmpty(a.params.id)||_.isNull(a.params.id)||(a.session.join={id:a.params.id}),c()},passport.authenticate(b,"google"===b?{scope:a.scope}:{})),c.app.get(a.urls.callback,c.dataCommon.session,passport.authenticate(b,{failureRedirect:c.dataCommon.internalUrlRedirect+"?value="+encode('{"error":true,"provider":"'+b+'"}'),successRedirect:c.dataCommon.internalUrlRedirect+"?value="+encode('{"error":false,"provider":"'+b+'"}')}))}function encode(a){var b=utf8.encode(a);return base64.encode(b)}function decode(a){var b=base64.decode(a);return utf8.decode(b)}function setUrlSession(a){var b=url.parse(a.headers.referer);a.session.ecrm={urlRedirectSuccess:b.protocol+"//"+b.host+"/auth",urlRedirectFail:b.protocol+"//"+b.host+"/auth"}}var passport=require("passport"),FacebookStrategy=require("passport-facebook").Strategy,GoogleStrategy=require("passport-google-oauth").OAuth2Strategy,TwitterStrategy=require("passport-twitter").Strategy,_=require("lodash"),qs=require("qs"),logger=require("yocto-logger"),Strategy=require("passport-local").Strategy,signature=require("cookie-signature"),LdapStrategy=require("passport-ldapauth"),url=require("url"),base64=require("base-64"),utf8=require("utf8"),utils=require("yocto-utils");Auth.prototype.init=function(a,b,c){this.app=a,this.AuthModel=b,this.dataCommon=c,a.use(passport.initialize()),passport.serializeUser(function(a,b){b(null,a)}),passport.deserializeUser(function(a,b){b(null,a)}),this.setEndPoint()},Auth.prototype.setEndPoint=function(){var a=this;this.app.get(this.dataCommon.internalUrlRedirect,this.dataCommon.session,function(b,c){function d(b,c,d,e){a.logger.error('[ yocto-auth.endPoint ] error authentication for provider "'+c+'", more details : ',b),e.redirect(d.session.ecrm.urlRedirectFail+"/fail?value="+encode('{"status":"error","code":"400101"}'))}var e={};try{if(e=qs.parse(b._parsedUrl.query),e=JSON.parse(decode(e.value)),e.error)throw{details:e.error,provider:e.provider};var f="provider_id",g={user:b.session.passport.user,provider:e.provider,paramToFind:{auth_type:e.provider,"social_profile.provider_id":b.session.passport.user[f]}};if("ad"===e.provider?g.paramToFind={auth_type:"active-directory","active_directory_profile.dn":b.session.passport.user.dn}:"standard"===e.provider&&(g.paramToFind={password:b.session.passport.user.password,$or:[{"login.email":b.session.passport.user.username},{"login.phone":b.session.passport.user.username}]}),_.isUndefined(b.session.join)){var h=a.configs[e.provider];_.isArray(h)&&(h=h[e.index]),a.AuthModel[h.db.method](g).then(function(d){if(_.isEmpty(d))throw"User not found for this credentials.";b.session.passport.user=d,c.redirect(b.session.ecrm.urlRedirectSuccess+"/success?"+qs.stringify({session:"s:"+signature.sign(b.sessionID,a.dataCommon.secretCookieKey)}))})["catch"](function(a){d(a,e.provider,b,c)})}else a.AuthModel.joinAccount(b.session.join.id,utils.obj.underscoreKeys({authType:e.provider,socialProfile:b.session.passport.user})).then(function(){a.logger.info('[ yocto-auth.endPoint ] - Document Auth created for account : "',b.session.join.id,'" for provider : "',e.provider,'"'),delete b.session.join,c.redirect(b.session.ecrm.urlRedirectSuccess+"/join/success?value="+encode('{"provider":"'+e.provider+'"}'))})["catch"](function(f){a.logger.error('[ yocto-auth.endPoint ] - error cannot create auth document for this social network "',f),b.session.ecrm.urlRedirectFail+="/join/fail?value="+encode('{"provider":"'+e.provider+'"}'),delete b.session.join,d(f,e.provider,b,c)})}catch(i){d(i.details,i.provider,b,c)}})},Auth.prototype.addTwitter=function(a){this.configs.twitter=a,passport.use(new TwitterStrategy({consumerKey:a.identifier,consumerSecret:a.secret,callbackURL:this.dataCommon.host+a.urls.callback},function(a,b,c,d){var e=utils.obj.underscoreKeys({providerId:c.id,displayName:c.displayName,profilePicture:_.isUndefined(_.first(c.photos))?"":_.first(c.photos).value,accessToken:a,secretToken:b});d(null,e)})),bindStrategy(a,"twitter",this)},Auth.prototype.addStandard=function(a){this.configs.standard.push(a);var b=this.configs.standard.length-1,c=this;passport.use(new Strategy(function(a,b,c){c(null,{username:a,password:b})})),this.app.post(a.urls.connect,c.dataCommon.session,passport.authenticate("local",{failureRedirect:this.dataCommon.internalUrlRedirect+"?value="+encode('{"error":true,"provider":"standard","index":'+b+"}")}),function(a,d){return a.session.passport.user.error?d.redirect(c.dataCommon.internalUrlRedirect+"?value="+encode('{"error":true,"provider":"standard","index":'+b+"}")):(setUrlSession(a),void d.redirect(c.dataCommon.internalUrlRedirect+"?value="+encode('{"error":false,"provider":"standard","index":'+b+"}")))})},Auth.prototype.addFacebook=function(a){this.configs.facebook=a,passport.use(new FacebookStrategy({clientID:a.identifier,clientSecret:a.secret,callbackURL:this.dataCommon.host+a.urls.callback,profileFields:a.fields},function(a,b,c,d){var e=utils.obj.underscoreKeys({providerId:c.id,displayName:c.displayName,lastname:c.name.familyName,firstname:c.name.givenName,sex:c.gender,profilePicture:_.isUndefined(_.first(c.photos))?"":_.first(c.photos).value,accessToken:a});d(null,e)})),bindStrategy(a,"facebook",this)},Auth.prototype.addGoogle=function(a){this.configs.google=a,passport.use(new GoogleStrategy({clientID:a.identifier,clientSecret:a.secret,callbackURL:this.dataCommon.host+a.urls.callback},function(a,b,c,d){var e=utils.obj.underscoreKeys({providerId:c.id,displayName:c.displayName,lastname:c.name.familyName,firstname:c.name.givenName,sex:c.gender,profilePicture:_.isUndefined(_.first(c.photos))?"":_.first(c.photos).value,accessToken:a});d(null,e)})),bindStrategy(a,"google",this)},Auth.prototype.addActiveDirectory=function(a){this.configs.standard.push(a);var b=this.configs.standard.length-1,c=this;passport.use(new LdapStrategy({server:a.server,usernameField:"username",passwordField:"display_password"},function(a,b){b(null,a)})),this.app.post(a.urls.connect,c.dataCommon.session,function(a,d,e){setUrlSession(a),passport.authenticate("ldapauth",function(e,f){var g=JSON.stringify({error:_.isEmpty(e)?!1:!0,provider:"ad",index:b});a.session.passport={user:_.isNull(f)?{}:f},d.redirect(c.dataCommon.internalUrlRedirect+"?value="+encode(g))})(a,d,e)})},module.exports=function(a){return new Auth(a)};