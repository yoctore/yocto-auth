![alt text](https://david-dm.org/yoctore/yocto-auth.svg "Dependencies Status")

## Middleware for ExpressJS

This module permit an user to in an api by implementing passportJS and his strategies.
You can add multiple same stragtegy, it's usefull to handle an front and back office connection.

## Supported authentication methods

  - Facebook
  - Twitter
  - Google +
  - Standard (with login and password)
  - LDAP - Active directory

## How use it

### initialize module
```javascript

// You can pass an yocto-logger instance
var auth   = require('yocto-auth')(core.logger);

// Init the yocto-auth with the express app and model from
auth.init(app, model, {
  host                  : 'http://api.com', // hostname of your express app, it's necessary for oAuth connection eg. Facebook ...
  internalUrlRedirect   : 'http://api.com/auth/callback', // url of end point
  secretCookieKey       : 'FAIFEAOHONFEA', // Key to sign cookie with cookie-signature
  session               : session // express session that should be store in an express store session
});

```

### Standard
```javascript

// add Strategy Standard
auth.addStandard({
  urls : {
    connect   : 'http://api.com/auth/connect/standard', // url of connection
    callback  : '/' // callback no needed
  }
});
```

### Facebook
```javascript

// add Strategy Facebook
auth.addFacebook({
  urls : {
    connect   : 'http://api.com/auth/connect/facebook', // url of connection
    callback  : 'http://api.com/auth/connect/callback/facebook' // callback of connection
  },
  identifier  : 'FAFEAFA', // id of your app
  secret      : 'FEAFEA', // secret key of app
  db : {
    method : 'connect' // method to call to connect user
  },
  fields : [ // fields you want retrieve
    "id", "name", "gender", "displayName", "photos", "emails", "profileUrl"
  ]
});
```

### Google
```javascript

// add Strategy Google
auth.addGoogle({
  urls : {
    connect   : 'http://api.com/auth/connect/google', // url of connection
    callback  : 'http://api.com/auth/connect/callback/google' // callback of connection
  },
  identifier  : 'FAFEAFA', // id of your app
  secret      : 'FEAFEA', // secret key of app
  db : {
    method : 'connect' // method to call to connect user
  },
  scope : [ // fields you want retrieve
    'https://www.googleapis.com/auth/plus.login'
  ]
});
```

### Twitter
```javascript

// add Strategy Twitter
auth.addTwitter({
  urls : {
    connect   : 'http://api.com/auth/connect/twitter', // url of connection
    callback  : 'http://api.com/auth/connect/callback/twitter' // callback of connection
  },
  identifier  : 'FAFEAFA', // id of your app
  secret      : 'FEAFEA', // secret key of app
  db : {
    method : 'connect' // method to call to connect user
  }
});
```
### Active directory
```javascript

// add Strategy Active directory
auth.addActiveDirectory({
  urls : {
    connect   : 'http://api.com/auth/connect/ad', // url of connection
    callback  : '/' // callback no needed
  },
  // server informations
  server : {
    bindDn : "CN=John Snow, DC=api, DC=com", // distinguish name of admin account
    bindCredentials : 'apiapi', // password of admin account
    url : 'ldap://192.168.1.1:389', // url of server ldap
    searchBase : 'CN=Users,DC=api,DC=com', // place to search
    searchFilter : '(cn=({username}))' // filter to fing user
  },
  db : {
    method : 'connect' // method to call to connect user
  }
});
```
