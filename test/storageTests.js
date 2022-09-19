/* eslint-env mocha */
import chai from "chai"
import fs from 'fs'

import createStorage from "../src/modules/storage"

const expect = chai.expect;

describe("Test storage", function () {
  let storage = createStorage("tests")
  fs.existsSync('data/tests.json') && fs.unlinkSync('data/tests.json')
  fs.existsSync('data/tests-other.json') && fs.unlinkSync('data/tests-other.json')
  it("default store", function () {
    const store = storage.createStore() // default
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
})
