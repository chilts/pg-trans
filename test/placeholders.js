// --------------------------------------------------------------------------------------------------------------------

'use strict'

// npm
var test = require('tape')
var pg = require('pg')

// local
var pgTrans = require('../')

// --------------------------------------------------------------------------------------------------------------------

var trans = pgTrans(pg, 'postgres://postgres@localhost:5432/acme')

test('test some statements which have no placeholders', function(t) {
  trans(
    [
      'SELECT 1 AS number, true AS bool',
      {
        sql : 'SELECT 1 AS number, true AS bool',
      },
      {
        sql  : 'SELECT 1 AS number, true AS bool',
        vals : [],
      },
      {
        sql  : 'SELECT 1 AS number, true AS bool',
        vals : function() {
          return []
        },
      },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when doing selects which require no placeholders')
      var row = { number : 1, bool : true }
      t.deepEqual(res, [ [ row ], [ row ], [ row ], [ row ] ], 'All results were correct')
      t.end()
    }
  )
})

test('disconnect all clients', function(t) {
  pg.end()
  t.end()
})

// --------------------------------------------------------------------------------------------------------------------
