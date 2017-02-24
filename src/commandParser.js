export default text => {
  const commandParserRegex = /<@[^>]*> *\/([a-z]*)(.*)/i
  const regexResult = commandParserRegex.exec(text)

  if (regexResult === null) {
    return regexResult
  }

  return {
    command: regexResult[1],
    text: regexResult[2]
  }
}
