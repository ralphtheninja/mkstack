#!/usr/bin/env node

var c = require('chalk')
var rc = require('./lib/rc')
var stack = require('./lib/stack')(rc)

var createId = validate(rc.create || rc.c)
var applyIds = validate(rc.apply || rc.a)
var useYarn = rc.yarn || rc.y
var rmId = validate(rc.rm)
var list = rc.list || rc.l

if (createId) {
  stack.create(createId, function (err) {
    if (!err) console.log(c.green('created', createId))
    end(err)
  })
} else if (applyIds) {
  console.log(c.yellow('applying', applyIds))
  stack.apply(applyIds, useYarn ? 'yarn' : 'npm', end)
} else if (rmId) {
  stack.remove(rmId, function (err) {
    if (!err) console.log(c.green('removed', rmId))
    end(err)
  })
} else if (list) {
  stack.list(end)
} else {
  console.log('usage: mkstack [' + c.yellow('options') + ']')
  console.log(c.yellow('  -c, --create  :id') + '  create a new stack')
  console.log(c.yellow('  -a, --apply   :id') + '  apply a stack')
  console.log(c.yellow('      --rm      :id') + '  remove a stack')
  console.log(c.yellow('  -l, --list') + '         list saved stacks')
}

function validate (str) {
  if (typeof str === 'string' && str.length > 0) return str
}

function end (err, info) {
  if (err) {
    console.error(c.red(err.message || err))
  }
  if (info) {
    console.log(c.yellow(info))
  }
  process.exit(err ? err.code || 1 : 0)
}
