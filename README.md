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
