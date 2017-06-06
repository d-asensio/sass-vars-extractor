'use strict'

const path = require('path')
const crypto = require('crypto')
const sass = require('node-sass')
const SassImporter = require('./SassImporter')

class SassVarsExtractor {
  /**
   * Generates a unique identifier.
   *
   * @returns {String}
   */
  static generateCompilationID () {
    let currentDate = new Date().valueOf().toString()
    let random = Math.random().toString()

    return crypto.createHash('sha1').update(currentDate + random).digest('hex')
  }

  /**
   * Given an object, if it has some null values those are purged from the object (just in the first level of the
   * object).
   *
   * @param object
   */
  static purgeObjectNulls (object) {
    for (let key of Object.keys(object)) {
      if (object[key] === null) {
        delete object[key]
      }
    }
  }

  /**
   * @todo add documentation here.
   *
   * @param entryPoint
   * @returns {Promise}
   */
  static extract (entryPoint, includePaths = []) {
    return new Promise((resolve, reject) => {
      let compilationID = SassVarsExtractor.generateCompilationID()

      includePaths.push(path.dirname(entryPoint))

      sass.render({
        data: `
            @import "${entryPoint}";
            
            @import "node_modules/sass-json-export/stylesheets/sass-json-export";
              
            @import "${compilationID}";
        `,
        includePaths: includePaths,
        importer: SassImporter.exec(compilationID)
      }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          const regex = new RegExp(`json-${compilationID}-content: +'(.+)'; +}`, 'g')
          let m

          if ((m = regex.exec(result.css.toString())) !== null) {
            const parsedVars = JSON.parse(m[1])

            SassVarsExtractor.purgeObjectNulls(parsedVars)

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
