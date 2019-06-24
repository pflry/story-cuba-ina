var FtpDeploy = require('ftp-deploy');
var ftpDeploy = new FtpDeploy();

var config = {
  user: "zygomatik",
  password: "FTkDe2ThryA1",
  host: "pizza.o2switch.net",
  port: 21,
  localRoot: __dirname + '/export/',
  remoteRoot: '/sites/ina/',
  include: ['*', '**/*'],
  deleteRemote: false,
  forcePasv: true
}

// use with promises
ftpDeploy.deploy(config)
  .then(res => console.log('finished:', res))
  .catch(err => console.log(err))

ftpDeploy.on('uploading', function (data) {
  data.totalFilesCount;       // total file count being transferred
  data.transferredFileCount; // number of files transferred
  data.filename;             // partial path with filename being uploaded
});
ftpDeploy.on('uploaded', function (data) {
  console.log(data);         // same data as uploading event
});
ftpDeploy.on('log', function (data) {
  console.log(data);         // same data as uploading event
});