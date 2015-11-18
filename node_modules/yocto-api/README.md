# Yocto API

This is a REST API for yocto

All http requests that are implemented by the yocto rest api :
  - get : get an object or all object
  - head : it 's the same that get, but return only the header
  - post : add a new object
  - put : a full update of object
  - patch : update a property of object that is specified
  - delete : delete an object

Important : to use yocto-api, you should use the midlleware cors for express : https://www.npmjs.com/package/cors 

## apidoc

Apidoc is a tool that permit to generate documentation of our REST API from comments  https://github.com/apidoc/apidoc

You should add this main params in your package.json

SampleUrl is the main url of your api, this params will be use in each method you will define

```json
"apidoc": {
  "title": "Yocto Rest Api",
  "sampleUrl": "http://localhost:8080/api",
  "url": "http://localhost:8080/api"
}
```

## apidocGenerator

Apidoc generator is a little module that read each model file and create a comments file that will be used by apidoc



## Example :

#### Using the api with a mongodb

```javascript
'use strict';

var express    = require('express'); // Load express
var bodyParser = require('body-parser'); // load bodyparser
var mongoose   = require('mongoose'); // Load the mongodb driver
var routes     = require('./app/routes/controller.js'); // Load the api
var app        = express(); // Create app

// connect to our database
mongoose.connect('mongodb://localhost:27017');

// configure app to use bodyParser()
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());

// set our port
var port = process.env.PORT || 8080;

//Initialise the API router
routes.init();

//Use the router
app.use('/api', routes.router);

// START THE SERVER
app.listen(port);

```


#### model.json file

Each Model is defined in one json file.

In this file an object "apidoc" is also declared to generate the doc automatically

The structure of the json is as follows :
```json
{
  "models" : {
    "model" : {}
  },
  "apidoc"  : {
    "methods" : []
  }
}
```


##### model object

A model have means a name, and one properties

Each properties can be a type, required or/and an array.


###### Example for firstaname that is a stirng required :  

```json
"model" : {
  "name"       : "user",
  "properties" : {
    "firstname" : {
      "type"      : "String",
      "required"  : true
    }
  }
}
```


###### Example for surname that is an optional String :  

```json
"model" : {
  "name"       : "user",
  "properties" : {
    "firstname" : "String"
  }
}
```


###### Example for cart_id that is an optional array of ObjectId :

```json
"model" : {
  "name"       : "user",
  "properties" : {
    "cart_id"   : ["ObjectId"]
  }
}
```


###### Example for category_id that is an required array of ObjectId :

```json
"model" : {
  "name"       : "user",
  "properties" : {
    "category_id" : [
      {
      "type"     : "ObjectId",
      "required" : true
      }
    ]
  }
}
```

###### Whole example :

```json
{
  "models" : {
    "model" : {
      "name"       : "product",
      "properties" : {
        "name"  : {
          "type"      : "String",
          "required"  : true
        },
        "reference" : {
          "type"      : "String",
          "required"  : true
        },
        "availability_id" : ["ObjectId"],
        "category_id"     : [{
          "type"      : "ObjectId",
          "required"  : true
          }
        ]
      }
    }
  },
  "apidoc" : {}
}
```

##### apidoc object

An apidoc object can have lot of http methods, each method will create a new item in the doc

All this params are required :
  - apiVersion : version of the api ( you can put multiple version of api)
  - type : type of the request ( only : get, post, put, patch, delete, head)
  - title : name of the method
  - path : path of the method to test. We add path to sampleUrl declared in package.json. So your final url will be : 'sampleURL+path'
  - apiPermission : the permission you should have to use it
  - addDefaultParamFromModel : this option determine if you want add automatically params (thoose params are retrieve in model object), if it's false, none param will be added
  - methoDescription : Description of the method

###### specificParam

This array of object define all param you want add and which are not present in model.

You can specify if it's required

```json
"methods" : [
  {
    "apiVersion"    : "0.1.0",
    "type"          : "get",
    "title"         : "GET product(s)",
    "path"          : "/product/:product_id",
    "apiPermission"  : "admin",
    "addDefaultParamFromModel" : false,
    "methodDescription" : "Method to retrieve one or all product, if you want get one product you should specify his id, otherwise the whole products are returned",
    "specificParam" : [
      {
          "name"     : "product_id",
          "type"     : "Object_id",
          "required" : true
      }
    ],
  }
]
```


###### apiSuccessExample param

This define the response that you will receive if your request is a success

They have default apiSuccess, you can call it by :

```json
"methods" : [
  {
    "apiVersion"    : "0.1.0",
    "type"          : "get",
    "title"         : "GET product(s)",
    "path"          : "/product/:product_id",
    "apiPermission"  : "admin",
    "addDefaultParamFromModel" : false,
    "methodDescription" : "Method to retrieve one or all product, if you want get one product you should specify his id, otherwise the whole products are returned",
    "apiSuccessExample" : "success"
  }
]
```

Or specify you own response :

```json
"methods" : [
  {
    "apiVersion"    : "0.1.0",
    "type"          : "get",
    "title"         : "GET product(s)",
    "path"          : "/product/:product_id",
    "apiPermission"  : "admin",
    "addDefaultParamFromModel" : false,
    "methodDescription" : "Method to retrieve one or all product, if you want get one product you should specify his id, otherwise the whole products are returned",
    "apiSuccessExample" : {
      "name"    : "Success-Response",
      "addDefaultParamFromModel" : true,
      "example" : {
        "header"  : "HTTP/1.1 200 OK"
      }
    }
  }
]
```

###### apiErrorrExample param

This define the response that you will receive if your request is a an error

They have default apiErrorrExample, you can call it by :

```json
"methods" : [
  {
    "apiVersion"    : "0.1.0",
    "type"          : "get",
    "title"         : "GET product(s)",
    "path"          : "/product/:product_id",
    "apiPermission"  : "admin",
    "addDefaultParamFromModel" : false,
    "methodDescription" : "Method to retrieve one or all product, if you want get one product you should specify his id, otherwise the whole products are returned",
    "apiErrorrExample" : "notFound"
  }
]
```

Or specify you own response :

```json
"methods" : [
  {
    "apiVersion"    : "0.1.0",
    "type"          : "get",
    "title"         : "GET product(s)",
    "path"          : "/product/:product_id",
    "apiPermission"  : "admin",
    "addDefaultParamFromModel" : false,
    "methodDescription" : "Method to retrieve one or all product, if you want get one product you should specify his id, otherwise the whole products are returned",
    "apiErrorrExample" : {
      "name"    : "Success-Response",
      "addDefaultParamFromModel" : true,
      "example" : {
        "header"  : "HTTP/1.1 400 NOT OK"
      }
    }
  }
]
```

#### routes.json file

You can add multiple routes in the json file

You can add alias for the main Object of the url (it's useful for plurial)

By default all http request are implemented, you can exclude each request

You can specify the name of one parameter to retrieve in the url

You should specify the name of the model that you want use

```json
{
  "routes" : [
    {
      "path"                : "/users/:user_id",
      "alias"               : ["user"],
      "model"               : "User",
      "paramToRetrieve"     : "user_id",
      "requestExcluded"     : ["post"]
    }
  ]
}
```
