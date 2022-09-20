/* eslint-env mocha */
import chai from "chai"
import fs from 'fs'

import createStorage from "../src/modules/storage"

const expect = chai.expect;

describe("Test storage", function () {
  let storage = createStorage("tests")
  fs.existsSync('data/tests.json') && fs.unlinkSync('data/tests.json')
  fs.existsSync('data/tests-other.json') && fs.unlinkSync('data/tests-other.json')
  fs.existsSync('data/tests-substore.json') && fs.unlinkSync('data/tests-substore.json')
  it("default store", function () {
    let store = storage.createStore() // default
    expect(store.value).to.equal(undefined)
    expect(store).to.equal(storage._getCurrentStores()['data/tests.json'])
    store.close()
    expect(storage._getCurrentStores()['data/tests.json']).to.equal(undefined)
  })
  it("default store with value", function () {
    let store = storage.createStore(false, "defaultValue")
    expect(store.value).to.equal("defaultValue")
    store.set("nonDefaultValue")
    store.close()
    store = storage.createStore(false, "anotherDefaultValue")
    expect(store.value).to.equal("nonDefaultValue")
    store.delete()
  })
  it("other store with value", function () {
    let store = storage.createStore("other", "defaultValue")
    expect(store.value).to.equal("defaultValue")
    store.set("nonDefaultValue")
    store._flush() // so file is saved
    expect(JSON.stringify(store.value)).to.equal(fs.readFileSync('data/tests-other.json', "utf8"))
    store.set("anotherValue")
    store = storage.createStore("other", "anotherDefaultValue")
    expect(store.value).to.equal("anotherValue")
    store.delete()
  })
  it("sub store", function () {
    let store = storage.createStore("substore", {
      a: { b: [{ c: 'hola' }] }
    })
    let substore = store.get(['a', 'b', 0, 'c'])
    expect(substore.value).to.equal('hola')
    substore.set('chau')
    expect(substore.value).to.equal('chau')
    expect(store.value).to.eql({ a: { b: [{ c: 'chau' }] } })
    store.close()
    store = storage.createStore("substore", {})
    substore = store.get(['a', 'b', 0])
    expect(substore.value).to.eql({ c: 'chau' })
    substore.get(['c']).set((value) => `hola-${value}`)
    expect(substore.value).to.eql({ c: 'hola-chau' })
    substore = substore.get(["d"])
    substore.set("nuevo")
    expect(substore.value).to.equal("nuevo")
    store.delete()
  })
})
