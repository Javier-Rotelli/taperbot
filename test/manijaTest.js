/* eslint-env mocha */
import chai from 'chai'

import { getLetsPlayFriendlyMessage } from '../src/plugins/manija'

const expect = chai.expect

describe('Test getLetsPlayFriendlyMessage', function () {
  it('should return a message for multiple rivals', function (done) {
    const rivals = '@jarro(v), @ema(l)'
    const result = getLetsPlayFriendlyMessage(rivals)

    expect(result).to.be.a('string')
    done()
  })

  it('should return a message for one rival', function (done) {
    const rivals = '@jarro(l)'
    const result = getLetsPlayFriendlyMessage(rivals)

    expect(result).to.be.a('string')
    done()
  })

  it('should return a custom message when the rival is aspero', function (done) {
    const rivals = '@aspero(v)'
    const result = getLetsPlayFriendlyMessage(rivals)

    expect(result).to.be.a('string')
    expect(result).to.include('gluteos')
    done()
  })

})
