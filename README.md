# sass-vars-extractor

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm version](https://badge.fury.io/js/sass-vars-extractor.svg)](https://badge.fury.io/js/sass-vars-extractor)

👾 A secure and performant utility to extract sass variables (and use their values from JavaScript).

## Usage example

### Extract all the haiticss variables 🍍
~~~ javascript
'use strict'

const SassVarsExtractor = require('sass-vars-extractor')

SassVarsExtractor.extract('./node_modules/@haiticss/haiticss/src/haiticss.scss')
  .then((parsedVars) => {
    console.log(parsedVars)
  }).catch((sassError) => {
    console.log(sassError)
  })
~~~