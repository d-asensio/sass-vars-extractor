'use strict'

const path = require('path')
const fs = require('fs')

class SassImporter {
  /**
   * Generates a list of paths which are candidates to be imported, this is needed because in sass you can import a file
   * using the full name and extension, using the full name without extension and if the filename is preceded with an
   * underscore, you can put it or not. Furthermore, if the option 'includePaths' is set in the compiler, the include
   * could be relative to various paths.
   *
   * So, this function takes the import string (i.e. @import '<import_string>';) the path of the file where the import
   * is set, an array with the 'includePaths' options sent to the compiler and the default extension of the files, and
   * generates an array with all the possible paths where the file can be.
   *
   * @param importString
   * @param importedFromPath
   * @param includePaths
   * @param defaultExtension
   * @returns {Array}
   */
  static getPathCandidates (importString, importedFromPath, includePaths, defaultExtension = '.scss') {
    const fileExtension = path.extname(importString)
    const fileName = path.basename(importString) + (fileExtension ? '' : defaultExtension)
    const fileSubdir = path.dirname(importString)
    const importedFromDir = path.dirname(importedFromPath)

    let pathCandidates = []

    pathCandidates.push(path.normalize(path.join(importedFromDir, fileSubdir, '_' + fileName)))
    pathCandidates.push(path.normalize(path.join(importedFromDir, fileSubdir, fileName)))

    for (let includedPath of includePaths) {
      pathCandidates.push(path.normalize(path.join(includedPath, fileSubdir, '_' + fileName)))
      pathCandidates.push(path.normalize(path.join(includedPath, fileSubdir, fileName)))
    }

    return pathCandidates
  }

  /**
   * Given an array of candidate paths, returns the path that exists in the filesystem.
   *
   * @param candidatePaths
   * @returns {string}
   */
  static resolvePath (candidatePaths) {
    let n = -1
    let found = false

    while (!found && ++n < candidatePaths.length) {
      try {
        found = fs.statSync(candidatePaths[n]).isFile()
      } catch (err) {
        found = false
      }
    }

    if (found) {
      return candidatePaths[n]
    }

    throw new Error('No file found')
  }

  /**
   * Given a sass string (content of a sass file) fills the object parsedVars with all the variables inside that sass
   * string (local variables included).
   *
   * @param sassString
   * @param parsedVars
   */
  static retrieveVariablesFrom (sassString, parsedVars) {
    const variablesRegex = /\$([\w\d-_]|\\[ !"#$%&'()*+,./:;<=>?@^{|}~[\]])+/g
    let m

    while ((m = variablesRegex.exec(sassString)) !== null) {
      if (m.index === variablesRegex.lastIndex) {
        variablesRegex.lastIndex++
      }

      m.forEach((match) => {
        if (match[0] === '$') { parsedVars[match] = match }
      })
    }
  }

  /**
   * Receives an object containing sass variable names and generates the sass output that will generate the final JSON
   * with all the found variables and values on it.
   *
   * @param parsedVars
   * @returns {string}
   */
  static buildPreparsedJSON (parsedVars) {
    let jsonString = '{'

    for (let sassVar of Object.keys(parsedVars)) {
      if (jsonString !== '{') {
        jsonString += ','
      }

      let sassVarName = sassVar.substring(1)

      jsonString += `"${sassVarName}": #{if(global-variable-exists('${sassVarName}'), json-encode(${sassVar}), 'null')}`
    }

    jsonString += '}'

    return jsonString
  }

  /**
   * Returns a importer function to be passed to the node-sass compiler, that function it's responsible of retrieve all
   * the sass variables involved in the compilation.
   *
   * See: https://github.com/sass/node-sass#importer--v200---experimental
   *
   * @param compilationID
   * @returns {Function}
   */
  static exec (compilationID) {
    let retrievedVariables = {}

    return function (url, prev, done) {
      if (url === compilationID) {
        return {
          contents: `
                    .${compilationID}{json-${compilationID}-content:'${SassImporter.buildPreparsedJSON(retrievedVariables)}';}
                `
        }
      }

      const candidatePaths = SassImporter.getPathCandidates(url, prev, this.options.includePaths.split(':'))

      try {
        let pathToImport = SassImporter.resolvePath(candidatePaths)
        let fileContent = fs.readFileSync(pathToImport, {
          encoding: 'utf8'
        })

        SassImporter.retrieveVariablesFrom(fileContent, retrievedVariables)
      } catch (e) {
        // Unable to find the file let the compiler raise the error.
        done()
      }

      // Avoiding to process the file.
      done()
    }
  }
}

module.exports = SassImporter
