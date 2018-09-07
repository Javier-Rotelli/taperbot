import request from 'request'

export const getFromAPI = (conf, log) => (method, args, cb) => {
  const url = `https://slack.com/api/${method}`
  const qs = {
    token: conf.apiToken,
    ...args
  }
  log('Web Request Method:', method, 'args', args)
  request(url, {qs, json: true}, handleResponse(cb))
}

export const postToAPI = (conf, log) => (method, args, cb) => {
  const url = `https://slack.com/api/${method}`
  const body = {
    ...args
  }
  log('Web Request Method:', method, 'args', args)
  request({
    auth: {
      'bearer': conf.apiToken
    },
    method: 'POST',
    json: true,
    url,
    body
  }, handleResponse(cb))
}

const handleResponse = cb => (err, resp, body) => {
  if (err) {
    cb(err)
  }
  cb(null, body)
}
