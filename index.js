#!/usr/bin/env node

const c = require('chalk')
const rc = require('./lib/rc')
const stack = require('./lib/stack')(rc)

const createId = validate(rc.create || rc.c)
const applyIds = validate(rc.apply || rc.a)
const useYarn = rc.yarn || rc.y
const rmId = validate(rc.rm)
const list = rc.list || rc.l

if (createId) {
  stack.create(createId, err => {
    if (!err) console.log(c.green('Created', createId))
    end(err)
  })
} else if (applyIds) {
  console.log(c.yellow('Applying', applyIds))
  stack.apply(applyIds.split(','), useYarn ? 'yarn' : 'npm', end)
} else if (rmId) {
  stack.remove(rmId, err => {
    if (!err) console.log(c.green('Removed', rmId))
    end(err)
  })
} else if (list) {
  if (Object.keys(rc.stacks).length > 0) {
    console.log(JSON.stringify(rc.stacks, null, 2))
  } else {
    end(null, 'No stacks found')
  }
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
