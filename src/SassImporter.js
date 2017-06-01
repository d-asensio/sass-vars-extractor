'use strict'

const path = require('path')
const fs = require('fs')

class SassImporter {
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

  constructor (compilationID) {
    this.compilationID = compilationID
    this.retrievedVariables = {}
  }

  exec () {
    let retrievedVariables = this.retrievedVariables
    let compilationID = this.compilationID

    return function (url, prev) {
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
        return null
      }

            // Avoiding to process the file.
      return null
    }
  }
}

module.exports = SassImporter
