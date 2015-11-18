# 0.3.0 (2015-11-09)

- The middleware doesn't use express.router now, an Instance of express (app) will be passed, to create all the routes.

# 0.2.4 (2015-11-09)

- when a PATCH comes in a default model route, if the param "id" is not defined, the request doesnt execute and a error status was returned

# 0.2.3 (2015-11-09)

- Add automatcally the var updated_date when a PATCH is called, before add it, we test if the param was defined

# 0.2.2 (2015-11-04)

- Add an verification step to dermine if an request like '/accout/sync' is an subroot and not an id for the main root like '/account/:id'
- Add an verification for the main root that are the param 'id' like params, the id should be compose with 24 characters and/or digit

# 0.2.1 (2015-10-28)

- Change default response for default routes

# 0.2.0 (2015-10-15)

- Delete models part, now model should be bind by passing a yocto-mongoose object in init
