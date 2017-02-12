import chai from 'chai';

import {shouldProcess} from '../src/run';

const should = chai.should();
const expect = chai.expect;


describe('Test shouldProcess', function () {
  it('should return true for a valid message', function (done) {
    const msg = {
      type: 'message',
      channel: 'C25D1J2LX',
      user: 'U055VFCBP',
      text: '<@U3FTH76RZ>, te vinimos a ver...',
      ts: '1482522967.003018',
      team: 'T02TUBDT4'
    };
    const userId = 'U3FTH76RZ';
    const ignoredChannels = ['C02TUBDTJ', 'C052AP8CB'];
    expect(shouldProcess(msg, userId, ignoredChannels)).to.be.true;
    done();
  });

  it('should return false for a message from himself', function (done) {
    const msg = {
      type: 'message',
      channel: 'C25D1J2LX',
      user: 'U3FTH76RZ',
      text: '<@U3FTH76RZ>, te vinimos a ver...',
      ts: '1482522967.003018',
      team: 'T02TUBDT4'
    };
    const userId = 'U3FTH76RZ';
    const ignoredChannels = ['C02TUBDTJ', 'C052AP8CB'];
    expect(shouldProcess(msg, userId, ignoredChannels)).to.be.false;
    done();
  });

  it('should return false for a message that is not a mention to him', function (done) {
    const msg = {
      type: 'message',
      channel: 'C25D1J2LX',
      user: 'U055VFCBP',
      text: '<@U055VFCBP>, te vinimos a ver...',
      ts: '1482522967.003018',
      team: 'T02TUBDT4'
    };
    const userId = 'U3FTH76RZ';
    const ignoredChannels = ['C02TUBDTJ', 'C052AP8CB'];
    expect(shouldProcess(msg, userId, ignoredChannels)).to.be.false;
    done();
  });

});