#!/usr/bin/env node

var fs = require('fs')
var util = require('util')
var c = require('chalk')
var rc = require('./lib/rc')
var stack = require('./lib/stack')(rc)

var create_id = validate(rc.create || rc.c)
if (create_id) return stack.create(create_id, function (err) {
  if (!err) console.log(c.green('created', create_id))
  end(err)
})

var apply_ids = validate(rc.apply || rc.a)
if (apply_ids) {
  console.log(c.yellow('applying', apply_ids))
  return stack.apply(apply_ids, end)
}

var rm_id = validate(rc.rm)
if (rm_id) return stack.remove(rm_id, function (err) {
  if (!err) console.log(c.green('removed', rm_id))
  end(err)
})

var list = rc.list || rc.l
if (list) return stack.list(end)

function validate(str) {
  if (typeof str == 'string' && str.length > 0) return str
}

function end(err, info) {
  if (err) {
    console.error(c.red(err.message || err))
  }
  if (info) {
    console.log(c.yellow(info))
  }
  process.exit(err ? err.code || 1 : 0)
}

console.log('usage: mkstack [' + c.yellow('options') + ']')
console.log(c.yellow('  -c, --create  :id') + '  create a new stack')
console.log(c.yellow('  -a, --apply   :id') + '  apply a stack')
console.log(c.yellow('      --rm      :id') + '  remove a stack')
console.log(c.yellow('  -l, --list') + '         list saved stacks')
