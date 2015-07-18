

## Synopsis ##

```js
var pg = require('pg')
var trans = require('pg-trans')(pg, conStr)

trans(
  [
    'CREATE TABLE foo(bar TEXT)',
    {
      sql : "INSERT INTO foo(bar) VALUES($1)",
      vals : [ 'Hello, World!' ],
    }
    {
      sql : 'SELECT * FROM foo',
    }
    {
      sql : 'SELECT * FROM foo',
      res : function(rows) {
        return rows
      }
    }
  ],
  function(err, result) {
    // check err
    // rows contains the result of the last query
    // result is equal to : [ [], [], [ { } ] ]
  }
)
```

## Example

This example shows how to insert a `name` into the `account` table and an associated `social_id` into the `social`
table. It remembers which `account_id` was created (from a sequence in the database) to use in the 2nd statement.

```js
function signUp(name, social_id, callback) {
  var account_id
  trans(
    [
      {
        sql : 'INSERT INTO account(name) VALUES($1) RETURNING id AS account_id',
        vals : [ name ],
        res : function(rows) {
          account_id = rows[0].account_id
        },
      }
      {
        sql : 'INSERT INTO social(account_id, social_id) VALUES($1, $2) RETURNING id AS social_id',
        vals : function() {
          return [ account_id, social_id ]
        },
      }
    ],
    callback
  )
}
```

## Actions ##

Each action must have the `sql` for the statement. All other attributes are optional:

* sql (required) - the sql statement to be executed
* vals (optional) - the values for the placeholders in the sql (default: [])
* check (optional) - a function to run to check everything is ok (return a true value (an error) to rollback the transaction)
* res (optional) - a function to run once the result is known

Note: the `vals` can also be a function which returns an array of vals.

## The Process ##

The process goes through the following:

1. a connection to the database is made
2. a `BEGIN` is sent
3. a loop through all actions is started:
  1. if `vals` is a function, it is called to retrieve the vals to use
  2. the `sql` and `vals` is sent
  3. the `check` function is called (if it exists). Return an error to stop the transaction and rollback (falsey to continue)..
  4. finally, the `res` function is called (if it exists). Whatever you return will be saved instead of the actual rows returned.
4. a `COMMIT` is sent

If at any stage an error occurs, then a `ROLLBACK` is sent and the callback called with the error provided.

See all of the [tests](https://github.com/chilts/pg-trans/tree/master/test) if you want to see how anything works.

## History ##

* v0.2.0 (2015-07-18)
  * ability to call a '.check()' function at each stage
  * more tests
* v0.1.0 (2015-07-17)
  * tests for most non-error paths
  * initial version

## AUTHOR ##

Written by [Andrew Chilton](http://chilts.org/):

* [Blog](http://chilts.org/)
* [GitHub](https://github.com/chilts)
* [Twitter](https://twitter.com/andychilton)
* [Instagram](http://instagram.com/thechilts)

(Ends)
