// copied from https://github.com/swang/pick-one-by-weight
export function pickOneByWeight(anObj) {
  let _keys = Object.keys(anObj);
  const sum = _keys.reduce((p, c) => p + anObj[c], 0);
  if (!Number.isFinite(sum)) {
    throw new Error("All values in object must be a numeric value");
  }
  let choose = ~~(Math.random() * sum);
  for (let i = 0, count = 0; i < _keys.length; i++) {
    count += anObj[_keys[i]];
    if (count > choose) {
      return _keys[i];
    }
  }
}

// copied from https://github.com/swang/markovchain

const isType = (t) =>
  Object.prototype.toString.call(t).slice(8, -1).toLowerCase();

class MarkovChain {
  constructor(contents, normFn = (word) => word.replace(/\.$/gi, "")) {
    this.wordBank = Object.create(null);
    this.sentence = "";
    this._normalizeFn = normFn;
    this.parseBy = /(?:\.|\?|\n)/gi;
    this.parse(contents);
  }

  startFn(wordList) {
    const k = Object.keys(wordList);
    const l = k.length;

    return k[~~(Math.random() * l)];
  }

  endFn() {
    return this.sentence.split(" ").length > 7;
  }

  process() {
    let curWord = this.startFn(this.wordBank);

    this.sentence = curWord;
    while (this.wordBank[curWord] && !this.endFn()) {
      curWord = pickOneByWeight(this.wordBank[curWord]);
      this.sentence += " " + curWord;
    }
    return this.sentence;
  }

  parse(text = "", parseBy = this.parseBy) {
    text.split(parseBy).forEach((lines) => {
      const words = lines.split(" ").filter((w) => w.trim() !== "");

      for (let i = 0; i < words.length - 1; i++) {
        const curWord = this._normalize(words[i]);
        const nextWord = this._normalize(words[i + 1]);

        if (!this.wordBank[curWord]) {
          this.wordBank[curWord] = Object.create(null);
        }
        if (!this.wordBank[curWord][nextWord]) {
          this.wordBank[curWord][nextWord] = 1;
        } else {
          this.wordBank[curWord][nextWord] += 1;
        }
      }
    });
    return this;
  }

  start(fnStr) {
    const startType = isType(fnStr);

    if (startType === "string") {
      this.startFn = () => fnStr;
    } else if (startType === "function") {
      this.startFn = (wordList) => fnStr(wordList);
    } else {
      throw new Error("Must pass a function, or string into start()");
    }
    return this;
  }

  end(fnStrOrNum) {
    const endType = isType(fnStrOrNum);

    if (endType === "function") {
      this.endFn = () => fnStrOrNum(this.sentence);
    } else if (endType === "string") {
      this.endFn = () => this.sentence.split(" ").slice(-1)[0] === fnStrOrNum;
    } else if (endType === "number" || fnStrOrNum === undefined) {
      fnStrOrNum = fnStrOrNum || Infinity;
      this.endFn = () => this.sentence.split(" ").length > fnStrOrNum;
    } else {
      throw new Error("Must pass a function, string or number into end()");
    }
    return this;
  }

  _normalize(word) {
    return this._normalizeFn(word);
  }

  normalize(fn) {
    this._normalizeFn = fn;
    return this;
  }
}

export default MarkovChain;
