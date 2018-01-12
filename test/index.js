const test = require('tape')
const rimraf = require('rimraf')
const path = require('path')
const fs = require('fs')
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

function rc () {
  return {
    config: rcFile()
  }
}

function rcFile () {
  return path.join(__dirname, 'mkstack-test.json')
}
