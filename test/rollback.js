// --------------------------------------------------------------------------------------------------------------------

'use strict'

// npm
var test = require('tape')
var pg = require('pg')

// local
var pgTrans = require('../')

// --------------------------------------------------------------------------------------------------------------------

var trans = pgTrans(pg, 'postgres://postgres@localhost:5432/acme')

test('run a query with an invalid syntax', function(t) {
  t.plan(3)

  var expectedRes = [ undefined ]

  trans(
    [
      'SELECT blah',
    ],
    function(err, res) {
      t.ok(err, 'There was an error with this transaction')
      t.equal('' + err, 'error: column "blah" does not exist', 'The error messages are the same')
      t.deepEqual(res, expectedRes, 'All results (so far) were passed back correctly')
      t.end()
    }
  )
})

test('create a table, insert a row, cause a syntax error (and rollback) - select for this row', function(t) {
  t.plan(6)

  var expectedRes1 = [ [], undefined ]
  var expectedRes2 = [ undefined ]
  var expectedErr2 = 'error: relation "foo" does not exist'

  trans(
    [
      'CREATE TABLE foo (bar TEXT)',
      'SELECT blah',
    ],
    function(err1, res1) {
      t.ok(err1, 'There was an error with this transaction')
      t.equal('' + err1, 'error: column "blah" does not exist', 'The error messages are the same')
      t.deepEqual(res1, expectedRes1, 'All results (so far) were passed back correctly')

      // now let's select the rows from 'foo' - the table and rows shouldn't even exist
      trans(
        [ 'SELECT * FROM foo' ],
        function(err2, res2) {
          t.ok(err2, 'There was an error with this transaction')
          t.equal('' + err2, expectedErr2, 'The error message is as expected')
          t.deepEqual(res2, expectedRes2, 'The result is as expected')
          t.end()
        }
      )
    }
  )
})

test('disconnect all clients', function(t) {
  pg.end()
  t.end()
})

// --------------------------------------------------------------------------------------------------------------------
