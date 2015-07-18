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
  var row = { number : 1, bool : true }
  var expectedRes = {
    begin  : [],
    one    : [ row ],
    two    : [ row ],
    three  : [ row ],
    commit : [],
  }

  t.plan(2)

  trans(
    [
      {
        name : 'one',
        sql  : 'SELECT 1 AS number, true AS bool',
      },
      {
        name : 'two',
        sql  : 'SELECT 1 AS number, true AS bool',
        vals : [],
      },
      {
        name : 'three',
        sql  : 'SELECT 1 AS number, true AS bool',
        vals : function() {
          return []
        },
      },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when doing selects which require no placeholders')
      t.deepEqual(res, expectedRes, 'All results were correct')
      t.end()
    }
  )
})

test('disconnect all clients', function(t) {
  pg.end()
  t.end()
})

// --------------------------------------------------------------------------------------------------------------------
