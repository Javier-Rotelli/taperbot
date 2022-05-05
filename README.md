# TaperBot

Taperbot!

[![Build Status](https://travis-ci.org/Javier-Rotelli/taperbot.svg?branch=master)](https://travis-ci.org/Javier-Rotelli/taperbot)

# Setup

We're using yarn v3. make sure you have it installed

```
yarn install
cp config.yml.example config.yml
```

don't forget to fill the config file with the relevant information

# To Run

To start the bot run

```javascript
yarn start
```

Make sure you first change the [api token](https://api.slack.com/custom-integrations/legacy-tokens) in config.yml file with an apropriated token.

# To Test it

```javascript
yarn test
```

Credits for @javierfernandes for the initial code

# How this works?

Tapebot is not a slack bot, is a slack user. Based on any @taperbot mention followed by `/<plugin-name>` taperbot triggers a call to receive 3 basic arguments:

## Base architecture

<img here>


## 2 ingredients

To make a custom action we will need a yaml config:

```
owner: U3FTH76RZ
apiToken: thisIsASecretToken
userId: U3FTH76RZ
debug: true
ignoredChannels:
  - C02TUBDTJ #anounces
  - C052AP8CB #random
plugins:
  echo:
    true
  <plugin name>:
    <options>: U3YV35Y2Z

```

And a callback function to handle command trigger:

```
export default (config, emitter, log) => {
    ...
}
```

Where:
- config is plugin configuration.
- emmiter is a EventEmitter to allow us send and receive events for core functionality.
- log is custom log actions we want for our plugin.
