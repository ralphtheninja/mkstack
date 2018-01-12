'use strict'

const test = require('tape')
const rimraf = require('rimraf')
const path = require('path')
const fs = require('fs')
const xtend = require('xtend')
const cp = require('child_process')
const EventEmitter = require('events').EventEmitter
const Stack = require('../lib/stack')

test('stack.create', t => {
  t.test('missing id throws', t => {
    const stack = Stack(rc())
    t.throws(stack.create.bind(null), /missing id/)
    t.end()
  })

  t.test('missing package.json fails', t => {
    const stack = Stack(rc())
    const cwd = process.cwd
    process.cwd = () => { return __dirname }
    stack.create('webstack', err => {
      t.equal(err.message, 'missing package.json')
      process.cwd = cwd
      t.end()
    })
  })

  t.test('missing dependencies fails', t => {
    const stack = Stack(rc())
    const cwd = process.cwd
    process.cwd = () => {
      return path.join(__dirname, 'module-no-deps')
    }
    stack.create('webstack', err => {
      t.equal(err.message, 'missing dependencies and devDependencies')
      process.cwd = cwd
      t.end()
    })
  })

  t.test('saves stack properly', t => {
    const stack = Stack(rc())
    const cwd = process.cwd
    process.cwd = () => {
      return path.join(__dirname, 'module-with-deps')
    }
    rimraf.sync(rcFile())
    stack.create('WOOHOO', err => {
      t.error(err, 'no error')
      process.cwd = cwd
      const saved = JSON.parse(fs.readFileSync(rcFile()))
      t.ok(saved.stacks, '.stacks ok')
      t.ok(saved.stacks.WOOHOO, '.stacks.WOOHOO ok')
      t.ok(saved.stacks.WOOHOO.dependencies, '.stacks.WOOHOO.dependencies ok')
      t.ok(saved.stacks.WOOHOO.devDependencies, '.stacks.WOOHOO.dependencies ok')
      t.end()
    })
  })
})

test('stack.apply', t => {
  t.test('ids non array throws', t => {
    const stack = Stack(rc())
    t.throws(stack.apply.bind(null), /ids must be an array/)
    t.end()
  })
  t.test('ids non array throws', t => {
    const stack = Stack(rc())
    t.throws(stack.apply.bind(null, []), /no stack\(s\) provided/)
    t.end()
  })
  t.test('missing stack errors', t => {
    const stack = Stack(rc())
    stack.apply([ 'NOWAYDUDE' ], 'npm', err => {
      t.equal(err.message, 'No such stack NOWAYDUDE')
      t.end()
    })
  })
  t.test('applies dependencies and devDependencies - npm', t => {
    const stack = Stack(xtend(rc(), {
      stacks: {
        WEB: {
          dependencies: {
            express: '^4.16.2'
          }
        },
        TEST: {
          devDependencies: {
            tape: '^4.8.0'
          }
        }
      }
    }))
    const expected = [
      [ 'install', 'express@^4.16.2', '--save' ],
      [ 'install', 'tape@^4.8.0', '--save-dev' ]
    ]
    let allArgs = []
    const spawn = cp.spawn
    cp.spawn = (cmd, args) => {
      t.equal(cmd, 'npm', 'npm packager')
      allArgs.push(args)
      const ee = new EventEmitter()
      process.nextTick(() => {
        ee.emit('close')
      })
      return ee
    }
    stack.apply([ 'WEB', 'TEST' ], 'npm', err => {
      t.error(err, 'no error')
      t.same(allArgs, expected, 'correct npm args')
      cp.spawn = spawn
      t.end()
    })
  })
  t.test('applies dependencies and devDependencies - yarn', t => {
    const stack = Stack(xtend(rc(), {
      stacks: {
        WEB: {
          dependencies: {
            express: '^4.16.2'
          }
        },
        TEST: {
          devDependencies: {
            tape: '^4.8.0'
          }
        }
      }
    }))
    const expected = [
      [ 'add', 'express@^4.16.2' ],
      [ 'add', 'tape@^4.8.0', '--dev' ]
    ]
    let allArgs = []
    const spawn = cp.spawn
    cp.spawn = (cmd, args) => {
      t.equal(cmd, 'yarn', 'yarn packager')
      allArgs.push(args)
      const ee = new EventEmitter()
      process.nextTick(() => {
        ee.emit('close')
      })
      return ee
    }
    stack.apply([ 'WEB', 'TEST' ], 'yarn', err => {
      t.error(err, 'no error')
      t.same(allArgs, expected, 'correct yarn args')
      cp.spawn = spawn
      t.end()
    })
  })
})

test('stack.remove', t => {
  t.test('errors if missing stack', t => {
    const stack = Stack(rc())
    stack.remove('nonononono', err => {
      t.equal(err.message, 'No stack named nonononono')
      t.end()
    })
  })
  t.test('saves modified stack', t => {
    const stack = Stack(xtend(rc(), {
      stacks: {
        WEB: {
          dependencies: {
            express: '^4.16.2'
          }
        },
        TEST: {
          devDependencies: {
            tape: '^4.8.0'
          }
        }
      }
    }))
    rimraf.sync(rcFile())
    stack.remove('TEST', err => {
      t.error(err, 'no error')
      const saved = JSON.parse(fs.readFileSync(rcFile()))
      t.same(saved, {
        stacks: {
          WEB: {
            dependencies: {
              express: '^4.16.2'
            }
          }
        }
      })
      t.end()
    })
  })
})

function rc () {
  return {
    config: rcFile(),
    stacks: {}
  }
}

function rcFile () {
  return path.join(__dirname, 'mkstack-test.json')
}
