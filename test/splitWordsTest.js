/* eslint-env mocha */
import chai from "chai";

import splitWords from "../src/splitWords";

const expect = chai.expect;

describe("Test splitWords", function () {
  it("empty string", function () {
    expect(splitWords("   ")).to.be.empty;
  });
  it("simple words", function () {
    expect(splitWords("hola a todes")).to.deep.equal(["hola", "a", "todes"]);
  });
  it("mentions and emojis", function () {
    expect(
      splitWords("hola a <@12345> en el canal <#abc|mi_canal> :joy::joy: besis")
    ).to.deep.equal([
      "hola",
      "a",
      "<@12345>",
      "en",
      "el",
      "canal",
      "<#abc>",
      ":joy:",
      ":joy:",
      "besis",
    ]);
  });
  it("correct emoji parsing", function () {
    expect(splitWords("+1 :+1:")).to.deep.equal(["1", ":+1:"]);
  });
});
