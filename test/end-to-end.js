// --------------------------------------------------------------------------------------------------------------------

'use strict'

// npm
var test = require('tape')
var pg = require('pg')

// local
var pgTrans = require('../')

// --------------------------------------------------------------------------------------------------------------------

var trans = pgTrans(pg, 'postgres://postgres@localhost:5432/acme')

test('setup some tables in the database', function(t) {
  trans(
    [
      'CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT)',
      'CREATE SEQUENCE account_id_seq',
      [
        'CREATE TABLE account (',
        '  id INTEGER NOT NULL DEFAULT nextval(\'account_id_seq\'::TEXT) PRIMARY KEY,',
        '  name TEXT NOT NULL',
        ')',
      ].join('\n'),
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when creating these tables')
      t.deepEqual(res, [ [], [], [] ], 'All results were correct')
      t.end()
    }
  )
})

test('insert a few things into some tables', function(t) {
  trans(
    [
      {
        sql  : 'INSERT INTO kv(key, value) VALUES($1, $2)',
        vals : [ 'patch', 1 ],
      },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when inserting some rows into these tables')
      t.deepEqual(res, [ [] ], 'All results were correct')
      t.end()
    }
  )
})

test('insert a few accounts, return the new id for each', function(t) {
  trans(
    [
      {
        sql  : 'INSERT INTO account(name) VALUES($1) RETURNING id',
        vals : [ 'Simple Simon' ],
      },
      {
        sql  : 'INSERT INTO account(name) VALUES($1) RETURNING id',
        vals : 'Little Miss Moffat',
      },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when inserting some rows into the account table')
      t.deepEqual(res, [ [ { id : 1 } ], [ { id : 2 } ] ], 'All results were correct')
      t.end()
    }
  )
})

test('do some munges of the results', function(t) {
  trans(
    [
      {
        sql : 'SELECT id, name FROM account ORDER BY id',
        res : function(rows) {
          // add 'Dr. ' at the start of each name
          rows.forEach(function(row) {
            row.name = 'Dr. ' + row.name
          })
          return rows
        },
      },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when inserting some rows into these tables')
      var rows = [
        { id : 1, name : 'Dr. Simple Simon' },
        { id : 2, name : 'Dr. Little Miss Moffat' },
      ]
      t.deepEqual(res, [ rows ], 'All results were correct')
      t.end()
    }
  )
})

test('drop the tables we created earlier', function(t) {
  trans(
    [
      'DROP TABLE account',
      'DROP SEQUENCE account_id_seq',
      'DROP TABLE kv',
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when dropping everything')
      t.deepEqual(res, [ [], [], [] ], 'All results were correct')
      t.end()
    }
  )
})

test('disconnect all clients', function(t) {
  pg.end()
  t.end()
})

// --------------------------------------------------------------------------------------------------------------------
