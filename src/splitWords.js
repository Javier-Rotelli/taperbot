export default (text) => {
  const wordsRegex =
    /((<[@!#][^>]+>)|(:[^\s:]+:)|([^,.:\s?¿¡!\\/"'`*+\-;_=()&$|@#[\]]+))/gim;
  const removeNameRegex = /(\|[^>]*)/gi;
  return [...((text || "").match(wordsRegex) || [])].map((x) =>
    x.replace(removeNameRegex, "")
  );
};
