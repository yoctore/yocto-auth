## 1.3.6 (2015-11-04)

- Adding angular rules on lusca for csrf rules

## 1.3.5 (2015-11-04)

- Add an allow filter on new render rules

## 1.3.4 (2015-11-04)

- Add rules for social item on render config

## 1.3.2 <-> 1.3.3 (2015-11-04)

- Update yocto dependencies package

## 1.3.1 (2015-11-03)

- Update package and jump to v7.0.0 for joi.

## 1.3.0 (2015-10-23)

- Add cors rules on default express schema.

## 1.2.0 (2015-10-23)

- Add [yocto-render](https://www.npmjs.com/package/yocto-render) config rules and `enableRender` method to enable this config
- Add [yocto-router](https://www.npmjs.com/package/yocto-router) config rules and `enableRouter` method to enable this config

## 1.1.1 (2015-10-23)

- Change level of log for find method
- Change use of logger on auto enable method

## 1.1.0 (2015-10-23)

- Change `passportjs` config key to `passportJs` (camelCase).
- Add a new method to auto enable method from given key
- Add a `type` property on mongoose schema.

## 1.0.6 (2015-10-22)

- Change message when no files was found.

## 1.0.4 (2015-10-16)

- Add jwt rules on default express config format

## 1.0.1 && 1.0.2 && 1.0.3 (2015-10-08)

- Change readme.md content & add new setConfigPath method
- Minor fixes
- Change directory config rules (all dir is not required now)

## 0.3.0 -> 1.0.0 (2015-10-06 <-> 2015-10-07)

- Add readme description
- Add rules to process enable and activate in the same method (1.0.0)
- Add a method to enable a specific schema (0.9.0)
- Add a method to add custom schema (0.8.0)
- Add access method (0.7.0) - to enable passportJs / express / mongoose config
- Add module passportJs (0.5.0) - default config for passportjs
- Add module express  (0.4.0) -  default config for express
- Add module mongoose  (0.3.0) -  default config for mongoose

## 0.2.1 (2015-10-06)

- Hint program with yocto-hitn and fix bugs
- Add Promise return (Q) on load function.

## 0.1.0 (2015-09-25)

Add all base function.
- load : load and test given configuration from given path
- set : default set function to set value
- get : default get value to get property value
- realod : reload configuration from given path if new path was given