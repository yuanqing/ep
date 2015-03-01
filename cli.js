#!/usr/bin/env node

'use strict';

var ep = require('.');

ep(process.argv[2], function(err) {
  if (err) {
    console.error('ep: ' + err);
    return process.exit(1);
  }
});
