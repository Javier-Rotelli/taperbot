import {create} from 'apisauce'
import commandParser from '../commandParser'

export default (config, emitter, log) => {
  const query = {query: `{
      repository(owner: "${config.org}", name: "${config.repo}") {
        issues(last: 20, states: OPEN) {
          edges {
            node {
              title
              url
              reactions(last:20) {
                totalCount
              }
            }
          }
        }
      }
    }`}

  // define the api
  const api = create({
    baseURL: 'https://api.github.com/graphql',
    headers: {
      Authorization: `bearer ${config.token}`,
      'Content-Type': 'application/json'
    }
  })

  emitter.on('received:message', (message) => {
    const command = commandParser(message.text)
    if (command === null || command.command !== 'tiltalks') {
      return
    }

    api.post('', query).then(res => {
      const mapped = res.data.data.repository.issues.edges
        .sort((is1, is2) => is1.node.reactions.totalCount < is2.node.reactions.totalCount)
        .map(talk =>
        `${talk.node.title} => ${talk.node.reactions.totalCount} \r\n ${talk.node.url}`)

      emitter.emit('send:message', mapped.join('\r\n'), message.channel)
    }).catch(err => { throw err })
  })
}
