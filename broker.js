/**
 * Created by harishchawla on 11/21/16.
 */

'use strict';

const express = require('express');

// Constants
const PORT = 8080;

// App
const app = express();
app.get('/', function (req, res) {
    res.send('Hey man - this is a crazy world\n');
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
