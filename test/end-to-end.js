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
  var expectedRes = {
    begin                : [],
    'create-kv'          : [],
    'create-account-seq' : [],
    'create-account'     : [],
    commit               : [],
  }

  trans(
    [
      { name : 'create-kv', sql : 'CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT)' },
      { name : 'create-account-seq', sql : 'CREATE SEQUENCE account_id_seq' },
      {
        name : 'create-account',
        sql  : [
          'CREATE TABLE account (',
          '  id INTEGER NOT NULL DEFAULT nextval(\'account_id_seq\'::TEXT) PRIMARY KEY,',
          '  name TEXT NOT NULL',
          ')',
        ].join('\n'),
      },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when creating these tables')
      t.deepEqual(res, expectedRes, 'All results were correct')
      t.end()
    }
  )
})

test('insert a few things into some tables', function(t) {
  var expectedRes = {
    begin  : [],
    patch  : [],
    commit : [],
  }

  trans(
    [
      {
        name : 'patch',
        sql  : 'INSERT INTO kv(key, value) VALUES($1, $2)',
        vals : [ 'patch', 1 ],
      },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when inserting some rows into these tables')
      t.deepEqual(res, expectedRes, 'All results were correct')
      t.end()
    }
  )
})

test('insert a few accounts, return the new id for each', function(t) {
  var expectedRes = {
    begin  : [],
    ins1   : [ { id : 1 } ],
    ins2   : [ { id : 2 } ],
    commit : [],
  }

  trans(
    [
      {
        name : 'ins1',
        sql  : 'INSERT INTO account(name) VALUES($1) RETURNING id',
        vals : [ 'Simple Simon' ],
      },
      {
        name : 'ins2',
        sql  : 'INSERT INTO account(name) VALUES($1) RETURNING id',
        vals : 'Little Miss Moffat',
      },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when inserting some rows into the account table')
      t.deepEqual(res, expectedRes, 'All results were correct')
      t.end()
    }
  )
})

test('do some munges of the results', function(t) {
  var expRows = [
    { id : 1, name : 'Dr. Simple Simon' },
    { id : 2, name : 'Dr. Little Miss Moffat' },
  ]
  var expectedRes = {
    begin  : [],
    sel    : expRows,
    commit : [],
  }

  trans(
    [
      {
        name : 'sel',
        sql  : 'SELECT id, name FROM account ORDER BY id',
        res  : function(rows) {
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
      t.deepEqual(res, expectedRes, 'All results were correct')
      t.end()
    }
  )
})

test('drop the tables we created earlier', function(t) {
  var expectedRes = {
    begin          : [],
    'drop-account' : [],
    'drop-seq'     : [],
    'drop-kv'      : [],
    commit         : [],
  }

  trans(
    [
      { name : 'drop-account', sql : 'DROP TABLE account' },
      { name : 'drop-seq', sql : 'DROP SEQUENCE account_id_seq' },
      { name : 'drop-kv', sql : 'DROP TABLE kv' },
    ],
    function(err, res) {
      t.ok(!err, 'No error occurred when dropping everything')
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
