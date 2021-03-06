var fs = require('fs');
var request = require('request');

/**
 * DAUM MyPeople Client
 */
var Client = module.exports = function(key, options) {
  var options = options || {};
  var server = options.server || 'https://apis.daum.net';

  if (typeof(key) == 'string' && key !== '') {
    console.log('MyPeople - server: ' + server + ', key: ' + key);
  } else {
    throw new Error('api key must be not null.');
  }

  this.APIs = {
    FRIEND_INFO: server + '/mypeople/profile/buddy.json?apikey=' + key,
    SEND_MESSAGE: server + '/mypeople/buddy/send.json?apikey=' + key,
    GROUP_MESSAGE: server + '/mypeople/group/send.json?apikey=' + key,
    GROUP_MEMBERS: server + '/mypeople/group/members.json?apikey=' + key,
    EXIT_GROUP: server + '/mypeople/group/exit.json?apikey=' + key,
    DOWNLOAD: server + '/mypeople/file/download.json?apikey=' + key
  };
};

/**
 * http://dna.daum.net/apis/mypeople/ref#send1on1message
 */
Client.prototype.sendMessage = function(buddyId, content, attach, callback) {
  if (attach != null) {
    var self = this;
    fs.readFile('mypeople/bot_data/' + attach + '.jpg', function(err, res) {
      request.post({
        uri: self.APIs.SEND_MESSAGE,
        headers: {
          'content-type': 'multipart/form-data'
        },
        multipart: [{
          'Content-Disposition': 'form-data; name="attach"; filename="image.jpg"',
          'Content-Type': 'image/jpg',
          body: res
        }, {
          'Content-Disposition': 'form-data; name="buddyId"',
          body: buddyId
        }]
      }, self.createResponseHandler(callback));
    });
  } else {
    request.get({uri: this.APIs.SEND_MESSAGE + '&buddyId=' + buddyId
        + '&content=' + encodeURIComponent(content)}
      , responseHandler(callback));
  }
};

/**
 * http://dna.daum.net/apis/mypeople/ref#getfriendsinfo
 */
Client.prototype.getFriendInfo = function(buddyId, callback) {
  request.get({uri: this.APIs.FRIEND_INFO + '&buddyId=' + buddyId},
    profileResponseHandler(callback));
};

/**
 * http://dna.daum.net/apis/mypeople/ref#groupuserlist
 */
Client.prototype.getGroupMembers = function(groupId, callback) {
  request.get({uri: this.APIs.GROUP_MEMBERS + '&groupId=' + groupId},
    profileResponseHandler(callback));
};

/**
 * http://dna.daum.net/apis/mypeople/ref#sendgroupmessage
 */
Client.prototype.sendGroupMessage = function(groupId, content, attach, callback) {
  if (attach != null) {
    var self = this;
    fs.readFile('mypeople/bot_data' + attach + '.jpg', function(err, res) {
      request.post({
        uri: self.APIs.GROUP_MESSAGE,
        headers: {
          'content-type': 'multipart/form-data'
        },
        multipart: [{
          'Content-Disposition': 'form-data; name="attach"; filename="image.jpg"',
          'Content-Type': 'image/jpg',
          body: res
        }, {
          'Content-Disposition': 'form-data; name="groupId"',
           body: groupId
        }]
      }, self.createResponseHandler(callback));
    });
  } else {
    request.get({uri: this.APIs.GROUP_MESSAGE + '&groupId=' + groupId
        + '&content=' + encodeURIComponent(content)}, responseHandler(callback));
  }
};

/**
 * http://dna.daum.net/apis/mypeople/ref#leavegroup
 */
Client.prototype.exitGroup = function(groupId, callback) {
  request.get({uri: this.APIs.EXIT_GROUP + '&groupId=' + groupId},
    responseHandler(callback));
};

/**
 * http://dna.daum.net/apis/mypeople/ref#filedownload
 */
Client.prototype.download = function(fileId, filename) {
  request.get({uri: this.APIs.DOWNLOAD + '&fileId=' + fileId})
    .pipe(fs.createWriteStream('mypeople/bot_data/download/' + filename + '.jpg'));
};

function responseHandler(callback) {
  if (typeof(callback) != 'function') {
    return;
  }
  return function(error, resp, data) {
    if (error) {
      callback(error, null);
    } else {
      var result;
      try {
        result = JSON.parse(data);
      } catch (e) {
        callback('API Server Error - response is not JSON literal.', e);
        return;
      }
      if (parseInt(result.code, 10) == 200) {
        callback(null, result);
      } else {
        callback('API Server Error - unexpected result code (' + result.code + ')\n'
          + resp.request.uri.href + '\n' + data, null);
      }
    }
  };
};

function profileResponseHandler(callback) {
  if (typeof(callback) != 'function') {
    return;
  }
  return function(error, resp, data) {
    if (error) {
      callback(error, null);
    } else {
      var result;
      try {
        result = JSON.parse(data);
      } catch (e) {
        callback('API Server Error - response is not JSON literal.', e);
        return;
      }

      if (parseInt(result.code, 10) == 200) {
        if (result.buddys && result.buddys.length > 0 && result.buddys[0] === null) {
          callback('API Server Error - response is wrong.', null);
        } else {
          callback(null, result.buddys);
        }
      } else {
        callback('API Server Error - unexpected result code (' + result.code + ')\n'
          + resp.request.uri.href + '\n' + data, null);
      }
    } // if else
  };
};

