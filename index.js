'use strict';

var fold = require('savoy').fold;
var fs = require('fs');
var path = require('path');
var rename = require('rename');
var request = require('request');
var strfmt = require('strfmt');
var titleCase = require('titlecase');
var url = require('url');

var tmpl = strfmt('{ season: %-d }{ episode: %02d } - { title }');

var ep = function(oldPath, cb) {
  var oldPaths;
  if (oldPath == null) {
    oldPaths = fs.readdirSync('./');
  } else {
    oldPaths = [oldPath];
  }
  fold(oldPaths, [], run, function(err, results) {
    cb(err, results.join('\n'));
  });
};

var run = function(cb, acc, oldPath) {
  var query = parseFilename(path.parse(oldPath).base);
  if (!query.name || query.season === -1 || query.episode === -1) {
    return cb(null, acc);
  }
  getEpisodeTitle(query, function(err, title) {
    if (err) {
      return cb(err);
    }
    var data = {
      season: query.season,
      episode: query.episode,
      title: title
    };
    var newFile = rename(oldPath, { basename: tmpl(data) });
    fs.rename(oldPath, newFile, function(err) {
      acc.push(oldPath + ' => ' + newFile);
      cb(err, acc);
    });
  });
};

var SEASON_AND_EPISODE = /^s(\d+)e(\d+)$/i;

var parseFilename = function(filename) {
  var split = filename.split('.');
  var season = -1;
  var episode = -1;
  var name = [];
  var i = -1;
  var len = split.length;
  while (++i < len) {
    var str = split[i];
    var matches = SEASON_AND_EPISODE.exec(str);
    if (matches) {
      season = parseInt(matches[1], 10);
      episode = parseInt(matches[2], 10);
      break;
    }
    name.push(str);
  }
  return {
    name: name.join(' ').trim(),
    season: season,
    episode: episode
  };
};

var protocol = 'http';
var host = 'omdbapi.com';

var getEpisodeTitle = function(query, cb) {
  var omdbUrl = url.format({
    protocol: protocol,
    host: host,
    query: {
      t: query.name,
      episode: query.episode,
      season: query.season
    }
  });
  request(omdbUrl, function(err, response, body) {
    if (err) {
      return cb(err);
    }
    var data = JSON.parse(body);
    if (data.Response === 'False') {
      return cb('Episode not found');
    }
    cb(null, titleCase(data.Title));
  });
};

module.exports = ep;
