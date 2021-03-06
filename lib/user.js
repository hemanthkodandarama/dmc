var _            = require('lodash');
var fs           = require('../lib/fs');
var Promise      = require('bluebird');
var paths        = require('../lib/paths');
var configSchema = require('../lib/config-schema');

function bootstrap() {
  return fs.ensureDirAsync(paths.dir.home).then(function(){
    return fs.ensureDirAsync(paths.dir.auth);
  }).then(function(){
    return fs.ensureDirAsync(paths.dir.index);
  }).then(function(){
    return fs.existsAsync(paths.file.globalConfig);
  }).then(function(configExists) {
    if(!configExists) {
      return fs.outputJsonAsync(
        paths.file.globalConfig,
        configSchema.getDefaultConfig()
      );
    }
  }).then(function(){
    return fs.existsAsync(paths.dir.tmp).then(function(exists) {
      if(exists) {
        return fs.removeAsync(paths.dir.tmp);
      }
    });
  });
}

function hasCredential(org) {
  return fs.existsAsync(paths.dir.auth + '/' + org + '.json');
}

function getCredential(org) {
  var cp = paths.dir.auth + '/' + org + '.json';
  return fs.existsAsync(cp).then(function(exists) {
    if(!exists) return Promise.reject('Credential does not exist: ' + org);
    return fs.readJsonAsync(paths.dir.auth + '/' + org + '.json');
  });
}

function saveCredential(org, data) {
  data.name = org;
  return fs.outputJsonAsync(paths.dir.auth + '/' + org + '.json', data);
}

function deleteCredential(org) {
  return hasCredential(org).then(function(doesExist) {
    if(doesExist) {
      return fs.unlinkAsync(paths.dir.auth + '/' + org + '.json');
    }
  });
}

function listCredentials() {
  return fs.readdirAsync(paths.dir.auth).then(function(orgs) {

    var promises = _(orgs)
      .map(function(orgFileName) {
        if(/\.json/.test(orgFileName)) {
          return fs.readJsonAsync(paths.dir.auth + '/' + orgFileName).then(function(org) {
            if(!org.name) {
              org.name = orgFileName.replace('.json', '');
            }
            return org;
          });
        }
      })
      .compact()
      .value();

    return Promise.all(promises);
  });
}

/* exports */

module.exports.bootstrap        = bootstrap;
module.exports.hasCredential    = hasCredential;
module.exports.getCredential    = getCredential;
module.exports.saveCredential   = saveCredential;
module.exports.deleteCredential = deleteCredential;
module.exports.listCredentials  = listCredentials;
