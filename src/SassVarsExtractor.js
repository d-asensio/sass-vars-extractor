'use strict'

const path = require('path')
const crypto = require('crypto')
const sass = require('node-sass')
const SassImporter = require('./SassImporter')

class SassVarsExtractor {
  static generateCompilationID () {
    let currentDate = new Date().valueOf().toString()
    let random = Math.random().toString()

    return crypto.createHash('sha1').update(currentDate + random).digest('hex')
  }

  static purgueObjectNulls (object) {
    for (let key of Object.keys(object)) {
      if (object[key] === null) {
        delete object[key]
      }
    }
  }

  static extract (entryPoint) {
    return new Promise((resolve, reject) => {
      let compilationID = SassVarsExtractor.generateCompilationID()
      let importerInstance = new SassImporter(compilationID)

      sass.render({
        data: `
            @import "${entryPoint}";
            
            @import "sass-json-export/stylesheets/sass-json-export";
              
            @import "${compilationID}";
        `,
        includePaths: [
          path.dirname(entryPoint),
          'node_modules'
        ],
        importer: importerInstance.exec()
      }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          const regex = new RegExp(`json-${compilationID}-content: +'(.+)'; +}`, 'g')
          let m

          if ((m = regex.exec(result.css.toString())) !== null) {
            const parsedVars = JSON.parse(m[1])

            SassVarsExtractor.purgueObjectNulls(parsedVars)

            resolve(parsedVars)
          } else {
            reject(new Error(`Unexpected error trying to extract sass variables from ${entryPoint}`))
          }
        }
      })
    })
  }
}

module.exports = SassVarsExtractor
