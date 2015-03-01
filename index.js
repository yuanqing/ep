'use strict';

var fs = require('fs');
var each = require('savoy').each;
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
  console.log(oldPaths);
  each(oldPaths, run, function(err) {
    cb(err);
  });
};

var run = function(cb, oldPath) {
  var query = parseFilename(path.parse(oldPath).base);
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
      cb(err);
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
    name: name.join(' '),
    season: season,
    episode: episode
  };
};

var protocol = 'http';
var host = 'omdbapi.com';

var getEpisodeTitle = function(query, cb) {
  console.log(query);
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
