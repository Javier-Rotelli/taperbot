var pkg = require("./package.json");

module.exports = function (shipit) {
  require("shipit-deploy")(shipit);
  require("shipit-shared")(shipit);
  require("shipit-nvm")(shipit);
  require("shipit-yarn")(shipit);
  require("shipit-pm2")(shipit);
  var config = require("./shipitfile.config.json");

  shipit.initConfig({
    default: {
      workspace: "/tmp/taperbot",
      deployTo: "/home/taperbot/code",
      repositoryUrl: pkg.repository.url,
      branch: "master",
      ignores: [".git"],
      keepReleases: 2,
      deleteOnRollback: false,
      shallowClone: true,
      shared: {
        overwrite: true,
        dirs: ["data"],
        files: ["config.yml"],
      },
      nvm: {
        remote: true,
        sh: "~/.nvm/nvm.sh",
      },
    },
    staging: {
      servers: {
        host: config.staging.host,
        user: config.staging.user,
      },
      key: config.staging.sshKey,
    },
  });
};
