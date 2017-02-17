import chai from 'chai';

import commandParser from '../src/commandParser';

const should = chai.should();
const expect = chai.expect;


describe('Test commandParser', function () {
  it('should parse a valid command', function (done) {
    const text = '<@U3FTH76RZ> /testCommand asd asd';
    const result = commandParser(text);

    expect(result.command).to.be.equal('testCommand');
    expect(result.text).to.be.equal(' asd asd');
    done();
  });

  it('should return null on an invalid command', function (done) {
    let result = commandParser('<@U3FTH76RZ> testCommand asd asd');

    expect(result).to.be.equal(null);

    result = commandParser('<@U3FTH76RZ> saraza /testCommand asd asd');
    console.log(result);
    expect(result).to.be.equal(null);

    done();
  });
});