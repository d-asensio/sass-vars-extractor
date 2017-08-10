# sass-vars-extractor

[![Greenkeeper badge](https://badges.greenkeeper.io/d-asensio/sass-vars-extractor.svg)](https://greenkeeper.io/)

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm version](https://badge.fury.io/js/sass-vars-extractor.svg)](https://badge.fury.io/js/sass-vars-extractor)
[![Build Status](https://travis-ci.org/d-asensio/sass-vars-extractor.svg?branch=master)](https://travis-ci.org/d-asensio/sass-vars-extractor)

👾 A secure and performant utility to extract sass variables (and use their values from JavaScript).


## Installation

```
npm i sass-vars-extractor
```


## API

### extract(fileName, [includePaths])

`fileName` (`string`): main sass file to process 

`includePaths` (`array`, default `[]`): node-sass includePaths option


```js
const SassVarsExtractor = require('sass-vars-extractor')

SassVarsExtractor.extract('main.scss')
  .then((extractedVars) => {
    console.log(extractedVars)
  }).catch((err) => {
    console.log(err)
  })
```


## Examples

### Extract all the sass variables and save to a JSON file

```js
const SassVarsExtractor = require('sass-vars-extractor')
const jsonfile = require('jsonfile')
const src = 'styles/main.scss'
const dest = 'data/sass-vars.json'

SassVarsExtractor.extract(src)
  .then((extractedVars) => {
    jsonfile.writeFile(dest, extractedVars, {spaces: 2}, function (err) {
      if (err) console.error(err)
    })
  }).catch((err) => {
    console.log(sassError)
  })
```

## How it does the job?

- Creates a virtual main sass file that imports the entry point specified, the [sass-json-export](https://github.com/oddbird/sass-json-export) mixin, and some smart output to capture values.

- By registering a [node-sass](https://github.com/sass/node-sass) importer function, evaluates each imported file content, and capture the potential var candidates using regular expressions.

- Compiles the virtual sass file and parse the smart output to get the resolved vars and values.
