## 1.1.1 (2015-11-03)

- Update package version.

## 1.1.0 (2015-10-27)

- Add a new method `changeLogLevel(name)` to change log level manually

## 1.0.2 (2015-09-25)

- Minor changes on  package.json

## 1.0.1 (2015-09-25)

- Change license field was invalid

## 1.0.0 (2015-09-17)

Adding new functions :

- enableConsole : enable current console transporter
- disableConsole  : disable current console transporter
- enableExceptions : enable exception on transporter
- disableExceptions : disable exception on transporter
- addDailyRotateTransport : add new daily rotate transport
- more : change current log level to an higher level
- less : change current log level to an lower level
- verbose : log a message on verbose mode
- info : log an message on information mode
- error : log a message on error mode
- debug : log a message on debug mode
- banner : A specific method to display BIG message on console
- Implement core based on winston
