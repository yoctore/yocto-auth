## Overview

This module is a part of yocto node modules for NodeJS.

Please see [our NPM repository](https://www.npmjs.com/~yocto) for complete list of available tools (completed day after day).

This module provide a simple config validator tools for your node app.

## Motivation

Our main motivation for this module is, create and provide a single, simple and custom config manager (with validation) for each of our program.

## How validation schema works ?

Default validation schema was build with [joi](https://www.npmjs.com/package/joi) package manager, and all custom all schema must be associate with a **joi rules too**.

During load process given files was auto validated with associated schema.

## Config files priority

**Priority** : `(Other file).json` < `all.json` < `common.json` < `development.json` < `stagging.json` < `production.json`

all.json : place in this file all general property (shared key, node port, etc) 

common.json : place in this file all common data between each env (app name, express config, etc) 

development.json : place in this file all development property for development environnement

stagging.json : place in this file all stagging property for stagging environnement

production.json : place in this file all production property for production environnement

**IMPORTANT** : file was merged with previous defined priority, so it should be understood that we dont need to define multiple times the same property if we doesn't need to replace it.

*For example :* 

```javascript
// a development.json file with these property
{
"test" : {
  "db" : {
    "uri" : "http://test.com/123456"
  }
}
```

```javascript
// a production.json file with these property
{
"test" : {
  "db" : {
    "options" : {
        "op1" : "my-value1",
        "op2" : "my-value2"
    }
  }
}
```

Will produce on production this config data :
```javascript
// generated config in production env
{
"test" : {
  "db" : {
    "uri" : "http://test.com/123456",
    "options" : {
        "op1" : "my-value1",
        "op2" : "my-value2"
    }
  }
}
```

## Pre-defined configuration

Predefined configuration schema was already defined. To use them see methods below : 

- enableExpress(complete) : add to default schema an express configuration
- enableMongoose(complete) : add to default schema a mongoose configuration
- enablePassportJs(complete) : add to default schema a passportjs configuration for (facebook, twitter, google, active-directory, standard login)
- enableRender(complete) : add to default schema a [yocto-render](https://www.npmjs.com/package/yocto-render) configuration
- enableRouter(complete) : add to default schema a [yocto-router](https://www.npmjs.com/package/yocto-router) configuration

All of these function was replaced by default an already defined configuration.

If you want to enable a new configuration and keep safe the previous configuration, just pass `true` on enable function, for example :

```javascript
var config  = require('yocto-config')();

// defined base config
config.enableExpress();
// add new config ofr mongoose and keep safe previous defined config
config.enableMongoose(true); 
```

## Adding custom config schema

You can add your custom config schema for custom validation, two methods was available for these action : 

- addCustomSchema(name, schema, autoenable, keepSafePreviousSchema) : add new schema with given name
- enableSchema(name, keepSafePreviousSchema) : enable a schema with given name

Example :

```javascript
var config  = require('yocto-config')();
var joi     = require('joi');

// define your schema
var schema = joi.object().required().keys({
  mailer  : joi.object().required(),
  daemon  : joi.object().required(),
  core    : joi.object().keys({
    daemon : joi.object().default({ delay : 10, retry : 10 }).keys({
      delay : joi.number().min(0).default(10),
      retry : joi.number().min(0).default(10)
    }).allow([ 'delay', 'retry' ]),
    mailer : joi.object().default({ limit : 1, sort : 'ascending' }).keys({
      limit : joi.number().min(1).default(1),
      sort  : joi.string().empty().default('ascending').allow([ 'ascending', 'descending' ]),
    }).allow([ 'limit', 'sort' ])
  }).allow([ 'daemon', 'mailer' ])
}).unknown();

// add custom schema named 'test'
// third parameter enable given schema (optional, by default to false)
// fourth parameter keep safe all predefined schema (optional, by default to false)
config.addCustomSchema('test', schema, true, true);

// OR classic process
config.addCustomSchema('test', schema);
config.enableSchema('test');
```

## How to use

```javascript

var config  = require('yocto-config')();

// enable defined config
config.enableExpress(true);
config.enableMongoose(true);
config.enablePassportJs(true);

// Set config path
config.setConfigPath('./example/config');

// Load and retreive data from callback
config.load().then(function(data) {
  // your code here
  // you can also get data with a method
  var c = config.getConfig();
  console.log(c);
}).catch(function(error) {
  // your code here
});

```

## Tricks

You can also use a utility method `autoEnableValidators` to enable your validator. See below key associated with schema : 

- express : for express schema
- passportJs : for passportJs schema
- mongoose : for mongoose schema

Example : 

```javascript
var config  = require('yocto-config')();
config.autoEnableValidators([ 'express', 'passportJs', 'mongoose' ]);
// Extra process
```

## Default configuration rules

- Mongoose schema can be find [here](https://gitlab.com/yocto-node-modules/yocto-config/blob/master/documentation/markdown/schema/Mongoose.md)
- Express schema can be find [here](https://gitlab.com/yocto-node-modules/yocto-config/blob/master/documentation/markdown/schema/Express.md)
- Yocto Render schema can be find [here](https://gitlab.com/yocto-node-modules/yocto-config/blob/master/documentation/markdown/schema/YRender.md)
- Yocto Router schema can be find [here](https://gitlab.com/yocto-node-modules/yocto-config/blob/master/documentation/markdown/schema/YRouter.md)

## Logging in tool

By Default this module include [yocto-logger](https://www.npmjs.com/package/yocto-logger) for logging.
It's possible to inject in your mailer instance your current logger instance if is another `yocto-logger` instance.

## Changelog

All history is [here](https://gitlab.com/yocto-node-modules/yocto-config/blob/master/CHANGELOG.md)