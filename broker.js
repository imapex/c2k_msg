/**
 * Created by harishchawla on 11/21/16.
 */

'use strict';

const express = require('express');


//var config = require('./config');

var app = require('express')();

app.get('/', function (req, res) {
    //res.send('Hey man - config file has this port for Redis \n' + config.redis.port);
    res.send('Hey man - Tropo token \n' + process.env.TROPO_SMS_TOKEN
    + '\n Redis connection string is \n' + process.env.REDIS_CONNECTOR
    );
});

var listener = app.listen(process.env.BROKER_LISTEN_PORT, function(){
    console.log('Listening on port ' + listener.address().port);
});