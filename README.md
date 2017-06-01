# sass-vars-extractor

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

👾 A secure and performant utility to extract sass variables (and use their values from JavaScript).

## Usage example

### Extract all the haiticss variables 🍍
~~~ javascript
'use strict'

const SassVarsExtractor = require('./src/SassVarsExtractor')

SassVarsExtractor.extract('./node_modules/@haiticss/haiticss/src/haiticss.scss')
  .then((parsedVars) => {
    console.log(parsedVars)
  }).catch((sassError) => {
    console.log(sassError)
  })
~~~