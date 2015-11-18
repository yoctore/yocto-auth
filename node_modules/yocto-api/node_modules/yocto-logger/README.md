## Overview

This module is a part of yocto node modules for NodeJS. 

Please see https://www.npmjs.com/~yocto for complete list of available module (completed day after day).

This module manage your own logger request on your node app.

This module his based on winston package : https://github.com/flatiron/winston

**IMPORTANT : This module is not a complete reimplantation of winston** we only use winston for the core process.

## Motivation

In all of our project we use a logger library like winston. But all the time we need to
configure again and again the same library. 

That why we decided to create yocto-Logger.

This tool is designed to be a very very simple and pre-configured and ready to use tool
based on the universal logging library winston.

## Configuration : console transport

By default a console is configured with these options : 
(Cf. winston & momentjs documentation for more details)

```javascript
{
  level             : 'debug',
  handleExceptions  : false,
  json              : false,
  showLevel         : true,
  silent            : false,
  timestamp         : function () {
    // return special timestamp format
    return moment().format('YYYY/MM/DD HH:mm:ss');
  }
};
```
## Configuration : daily rotate transport

By default a daily rotate transport is configured with these options : 
(Cf. winston & momentjs documentation for more details)

```javascript
{
  name              : 'default-daily-rotate-transport',
  level             : 'verbose',
  dirname           : './',
  filename          : uuid.v4(), // default name if name is not given
  handleExceptions  : true,
  json              : false,
  maxsize           : 5242880,
  maxFiles          : 5,
  colorize          : true,
  datePattern       : '-yyyy-MM-dd.log',
  timestamp         : function () {
    // return special timestamp format
    return moment().format('YYYY/MM/DD HH:mm:ss');
  }
};
```

## Logging Method

 Avaiblable methods are : 
 
- error (for error message)
- warning (for warning message)
- info (for information message)
- debug (for debug message)
- verbose (for normal message)

```javascript
var logger = require('yocto-logger');
// error message
logger.error('Hello world');
// warning message
logger.warning('Hello world');
// info message
logger.info('Hello world');
// debug message
logger.debug('Hello world');
// verbose message
logger.verbose('Hello world');
// banner message
logger.banner('Hello world');
```

## Banner Method 

To display on console.log a more significant message we implemened a banner method.
You can customize style (color and background color) of message but is not save on available transports.

```javascript
var logger = require('yocto-logger');
// banner usage
logger.banner("Banner customized",{ color: "red" , bgColor: "white" });
```

## Transport : Adding a new daily rotate transport

```javascript
var logger = require('yocto-logger');

// add new daily rotate transport with default config
logger.addDailyRotateTransport();

// add new daily rotate transport and process new action when async is finish
logger.addDailyRotateTransport().then(function(success) {
    // your process here
}, function(error) {
    // error process here
});

// add new daily transport on specific path + changing filename and more options
logger.addDailyRotateTransport('/your-new-path-here', 'your-file-name-here', {});
```

## Change level manually

You can change current logger level manually by method `setLogLevel(name)`.

Property `name` of this function must be one of these values :

 
- error (for error message)
- warning (for warning message)
- info (for information message)
- debug (for debug message)
- verbose (for normal message)

For example if we need to set current logger instance to `error` level : 

```javascript
var logger = require('yocto-logger');

logger.setLogLevel('error);
// YOUR Extra code here
```

## Utility Methods

For a better usage we can interact with all transport by utility methods.
Methods available are : 

- more  :to change the log level to a higher level
- less  : to change the log level to a less level
- enableConsole : to enable console transport if is disable
- disableConsole : to disable console transport if is enable
- enableExceptions : to enable catch exception on logger if is disable
- disableExceptions : to disable catch exception on logger if is enable

```javascript
var logger = require('yocto-logger');

// Less & more - initial level is debug
logger.more(); // level change to verbose
logger.less(); // level change to debug

// Others method
logger.enableConsole();
logger.disableConsole();
logger.enableExceptions();
logger.disableExceptions();
```




