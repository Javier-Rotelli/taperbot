export default text => {
  const wordsRegex = /((<[@!#][^>]+>)|(:[^\s:]+:)|([^,.:\s?¿¡!\\/"'`*+\-;_=()&$|@#[\]]+))/igm
  const removeNameRegex = /(\|[^>]*)/ig
  return [...((text || '').match(wordsRegex) || [])].map(x => x.replace(removeNameRegex, ''))
}
