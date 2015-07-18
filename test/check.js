// --------------------------------------------------------------------------------------------------------------------

'use strict'

// npm
var test = require('tape')
var pg = require('pg')

// local
var pgTrans = require('../')

// --------------------------------------------------------------------------------------------------------------------

var trans = pgTrans(pg, 'postgres://postgres@localhost:5432/acme')

test('run a query but make sure we do not run the second', function(t) {
  var i = 'none'
  t.plan(4)

  var expectedRows = [
    { bool : true },
  ]
  var expectedRes = [ expectedRows, expectedRows ]
  var errMsg = 'Pretending that something went wrong'

  trans(
    [
      'SELECT True AS bool',
      {
        sql   : 'SELECT True AS bool',
        check : function(rows) {
          // firstly, make sure i is still 0
          if ( i !== 'none' ) {
            t.fail('This .check() should be called before .res()')
          }
          i = 'check-called'
          t.deepEqual(rows, expectedRows, 'Got expected rows')
          return new Error(errMsg)
        },
        res : function(/* ignore rows */) {
          t.fail('This .res() function should not be called at all')
        },
      },
      'SELECT True AS bool',
    ],
    function(err, res) {
      t.ok(err, 'There was an error with this transaction')
      t.equal('' + err, 'Error: ' + errMsg, 'The error messages are the same')
      t.deepEqual(res, expectedRes, 'All results (so far) were passed back correctly')
      t.end()
    }
  )
})

test('disconnect all clients', function(t) {
  pg.end()
  t.end()
})

// --------------------------------------------------------------------------------------------------------------------
