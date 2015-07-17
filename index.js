// --------------------------------------------------------------------------------------------------------------------

'use strict'

// npm
var async = require('async')

// --------------------------------------------------------------------------------------------------------------------

function trans(pg, conStr, statements, callback) {
  // save the 'client' and 'done' once we have connected
  var client
  var doneWithClient

  // store all the results
  var results = []

  // wrap all these statements in a transaction
  statements.unshift({ sql : 'begin' })
  statements.push({ sql : 'commit' })

  async.series(
    [
      function connect(doneConnect) {
        pg.connect(conStr, function(err, newClient, newDoneWithClient) {
          if (err) return doneWithClient(err)
          client = newClient
          doneWithClient = newDoneWithClient
          doneConnect()
        })
      },
      function doStatements(doneStatements) {
        async.eachSeries(
          statements,
          function(statement, doneStatement) {
            // start the 'query' for the client.query()
            var query = {}
            if ( typeof statement === 'string' ) {
              query.text = statement
            }
            else {
              query = {
                text : statement.sql,
              }
            }

            // see if we have any values to pass with the sql
            if ( statement.vals ) {
              if ( typeof statement.vals === 'function' ) {
                // call this function and use the returned array
                query.values = statement.vals()
              }
              else if ( Array.isArray(statement.vals) ) {
                // call this function and use the returned array
                query.values = statement.vals
              }
              else {
                // this is probably a string, number/float, boolean or date
                query.values = [ statement.vals ]
              }
            }

            // run this query
            client.query(query, function(err, res) {
              if (err) return doneStatement(err)

              // now that we have a result, see if we need to call the 'res' function
              var rows = res.rows
              if ( statement.res ) {
                // Note: this function MUST be synchronous
                rows = statement.res(rows)
              }

              // remember this result
              results.push(rows)

              // finally, we're finished with this particular statement
              doneStatement()
            })
          },
          doneStatements
        )
      },
    ],
    function(err) {
      // if anything ever went wrong, then rollback
      if (err) {
        client.query('rollback', function(errRollback) {
          // if there was an additional error on rollback, just output a warning
          if (errRollback) {
            console.warn(errRollback)
          }
          doneWithClient()
          return callback(err)
        })
        return
      }

      // we're all finished with this transaction
      doneWithClient()

      // [].slice() is `.slice(begin, end)` which is why it's just '-1' and not '-2'
      callback(null, results.slice(1, statements.length - 1))
    }
  )
}

// --------------------------------------------------------------------------------------------------------------------

module.exports = function(pg, conStr) {
  return function(statements, callback) {
    trans(pg, conStr, statements, callback)
  }
}

// --------------------------------------------------------------------------------------------------------------------