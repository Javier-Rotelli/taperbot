var pkg = require('./package.json')

module.exports = function (shipit) {
  require('shipit-deploy')(shipit)
  require('shipit-npm')(shipit)
  require('shipit-pm2')(shipit)
  var config = require('./shipitfile.config.json')

  shipit.initConfig({
    default: {
      workspace: '/tmp/edison-gp/backend',
      deployTo: '/home/taperbot/code',
      repositoryUrl: pkg.repository.url,
      branch: 'master',
      ignores: ['.git'],
      keepReleases: 2,
      deleteOnRollback: false,
      shallowClone: true,
      shared: {
        overwrite: true,
        files: [
          'config.yml'
        ]
      }
    },
    staging: {
      servers: {
        host: config.staging.host,
        user: config.staging.user
      },
      key: config.staging.sshKey
    }
  })
}
