import WebSocket from 'ws'
import request from 'request'
const EventEmitter = require('events').EventEmitter

import {getConfig} from './config'
import {getNextId} from './messageUtil'

const conf = getConfig()

const isFromUser = (mess, uid) => mess.user === uid
const mentionsUser = (mess, uid) => mess.text && mess.text.includes(`<@${uid}>`)
const isFromChannels = (mess, channels) => channels.includes(mess.channel)

export const shouldProcess = (message, userId) => !isFromUser(message, userId) &&
                                                  mentionsUser(message, userId)

const startServer = (url) => {
  const ws = new WebSocket(url)
  const emitter = new EventEmitter()

  ws.on('open', () => {
    console.log('Connected')
    resetPing(ws)
  })

  ws.on('error', () => {
    console.log('Error on Websocket server')
  })

  ws.on('message', (rawMessage) => {
    const payload = JSON.parse(rawMessage)
    if (isFromChannels(payload, conf.ignoredChannels)) {
      return
    }
    console.log(payload)
    switch (payload.type) {
      case 'message':
        if (shouldProcess(payload, conf.userId)) {
          emitter.emit('received:message', payload)
        }
        break
      case 'reaction_added':
        emitter.emit('reaction:added', payload)
        break
    }
  })

  emitter.on('send:message', (content, channel, id) => {
    if (conf.ignoredChannels.includes(channel)) {
      return
    }
    console.log('procesando!')
    sendMessage(ws,{
      channel: channel,
      id,
      text: content,
      type: 'message'
    })
  })

  emitter.on('startTyping', (message) => {
    sendMessage(ws,{
      channel: message.channel,
      id: nextId(),
      type: "typing",
      reply_to : message.id
    })
  })
  initPlugins(conf.plugins, emitter)
}

const sendMessage = (ws, message) => {
  if(message.id === undefined) {
    message.id = getNextId()
  }
  ws.send(JSON.stringify(message))
  resetPing(ws)
}


const initPlugins = (plugins, emitter) => {
  const pluginsFolder = './plugins/'

  return Object.keys(plugins).map((pluginName) => {
    const pluginConfig = plugins[pluginName]
    return require(`${pluginsFolder}${pluginName}`).default(pluginConfig, emitter)
  })
}

const getUrl = (apiToken) => 'https://slack.com/api/rtm.start?token=' + apiToken

request(getUrl(conf.apiToken), function (err, response, body) {
  if (!err && response.statusCode === 200) {
    var res = JSON.parse(body)
    if (res.ok) {
      startServer(res.url)
    } else {
      console.error(body)
    }
  }
})

let pingTimer
const resetPing = (ws) => {
  clearTimeout(pingTimer)
  pingTimer = setTimeout(sendPing(ws), 5000)
}

const sendPing = (ws) => () => {
  ws.send(JSON.stringify({
    "id": getNextId(),
    "type": "ping"
  }))
  console.log("sent ping")
}