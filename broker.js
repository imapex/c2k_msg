//*****************************************************************
// SPARCKTICAL BY HARISH CHAWLA @ CISCO SYSTEMS 2016
//*****************************************************************
//VALIDATION LIBRARIES SECTION
//*****************************************************************
//var validator = require('validator');   // validates email string, phone string etc
var phonenorm = require('phone');       // normalizes phone number to +E164
//var urlencode = require('urlencode');   //URL encoder for emoticon support
var http = require ('http');
//var https = require('https');
var fs = require('fs');
//var privateKey  = fs.readFileSync('smsbot.cisco.com.key', 'utf8');
//var certificate = fs.readFileSync('smsbot.cisco.com.cer', 'utf8');
//var credentials = {key: privateKey, cert: certificate};

// This script listens for Tropo JSON objects
var listenport = process.env.LISTEN_HTTP_PORT;   			//TCP listening port for this broker
var listenurl = process.env.APP_URL;
var bodyParser = require('body-parser');
var _ = require('lodash');
var express = require('express');
var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//*****************************************************************
//REDIS LIBRARIES SECTION
//*****************************************************************
var redis = require('redis');
var Promise = require('bluebird');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
//RedisLabs connection string
//var client = redis.createClient("redis://spigot:P0p01121@pub-redis-15137.us-east-1-3.2.ec2.garantiadata.com:15137");
var client = redis.createClient(process.env.REDIS_CONNECTION);
//Establish connections to RedisLabs
client.onAsync('connect', function() {
    console.log('Connected to RedisLabs');
});

//*****************************************************************
// Declare a Tropo function
var tropo_webapi = require('tropo-webapi');
//var troposmstoken = '646a666751456a45524974676b794b5355446d755758764856637866796d724c656e4275467a7276486e7161';
var troposmstoken = process.env.TROPO_SMS_TOKEN;
//var tropoSessionAPI = 'api.tropo.com';
var smsrequest = require("request");
//var http = require('http');
//var tropo = new tropo_webapi.TropoWebAPI();

//app.use(express.bodyParser());


//Deal with GET requests to this webservice
app.get('/tropo', function(req, res){
    console.log(new Date().toString() + " GET request from "+ req.connection.remoteAddress);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    //res.header("Content-Type", "application/json; charset=utf-8");
    //res.setEncoding('utf8');
    res.setHeader('Author', 'Harish Chawla');
    res.setHeader('Company', 'Cisco Systems');
    res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('BROKER OPERATIONAL @ '+ new Date().toString());
    //res.end();

});


//-----HANDLE ALL POST REQUESTS FROM TROPO SERVICE -----//
app.post('/tropo', function(req, res){

    var payload=req.body;
    console.log("----- CONDITION: TROPO SENT PAYLOAD -----");
    console.log(new Date().toString() + 'Recieved new payload from Tropo \n' + JSON.stringify(payload));
    var tropo = new tropo_webapi.TropoWebAPI();

    //-----HANDLE OUTBOUND SMS INITIATED BY API CALLS-----//
    if (_.size(payload.session.initialText) == 0){
        console.log("----- CONDITION: OUTBOUND SMS REQUEST FROM NON-HUMAN RECIEVED -----");
        console.log(JSON.stringify(payload));
        console.log("INITIAL TEXT SIZE: " + _.size(payload.session.initialText));
        // Create outbound SMSes using REST API POST to this webservice
        tropo.call(payload.session.parameters.numberToDial,null, null, null, null, null, "SMS", null, null, null);
        var textmessage = (payload.session.parameters.msg).toString();
        //tropo.say(urlencode(payload.session.parameters.msg));
        tropo.say(decodeURIComponent(textmessage));
        tropo.hangup();
        //console.log('MSG TO SEND: ' + payload.session.parameters.msg);
        console.log('MSG TO SEND: ' + decodeURIComponent(textmessage));

        res.writeHead(200, {'Content-Type': 'application/json ; charset=utf-8'});
        res.end(tropo_webapi.TropoJSON(tropo));
        //res.write(tropo_webapi.TropoJSON(tropo));
        //res.end();
        console.log(tropo_webapi.TropoJSON(tropo));
        console.log('----------------');
    }
    //-----HANDLE SMS INITIATED BY HUMAN-----//
    if (_.size(payload.session.initialText) != 0){
        console.log("----- CONDITION: SMS FROM HUMAN RECIEVED -----");
        console.log(JSON.stringify(payload));
        var CallerMobile = _.take(phonenorm(payload.session.from.id));
        console.log("Normalized caller id: " + CallerMobile);
        client.hgetallAsync(CallerMobile).then(function(redres) {
            //console.log(typeof(redres));
            //var redis_result = JSON.stringify(redres);
            //console.log("stringified: " + redis_result);
            //console.log("to-string " + redis_result.toString());

            //----- HUMAN NOT IN DATABASE-----//
            if (_.isEmpty(redres)){
                console.log("----- CONDITION: HUMAN NOT IN DATABASE -----");
                console.log("\nFound no entry for " + CallerMobile);
                tropo.say("Please contact your CISCO Account representative to activate your account!");
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(tropo_webapi.TropoJSON(tropo));
            //console.log(_.size(redres.sparkroomid));

            //----- HUMAN EXISTS IN DATABASE, NO SPARK ROOM DEFINED -----//
            if (!_.isEmpty(redres) && _.size(redres.sparkroomid)<=1) {
                console.log("----- CONDITION: HUMAN EXISTS IN DATABASE, NO SPARK ROOM DEFINED -----");
                console.log("Client "+ CallerMobile + " has no spark room! Lets create one!\n");
                //create room
                spark.roomAdd(CallerMobile.toString()).then(function(room){
                    console.log("----- FUNCTION: CREATE SPARK ROOM & UPDATE REDIS -----");
                    console.log('Created room: '+ room.title + ' with ID: '+ room.id + ' for ' + CallerMobile.toString() + '\n');
                    client.hmsetAsync(CallerMobile.toString(), {"sparkroomid" : room.id});
                    console.log("----- FUNCTION: ADD AGENT TO ROOM -----");
                    spark.membershipAdd(room.id, redres.sparkagentid);
                    //----
                    console.log("----- FUNCTION: ADD WEBHOOK TO ROOM -----");
                    //spark.webhookUrl = 'https://exmachina-sparkspigot.c9users.io:8082/sparkhookin/'+room.id;
                    spark.webhookUrl = listenurl + ':' + listenport + '/sparkhookin/' + room.id;
                    console.log(spark.webhookUrl);
                    spark.webhookAdd('messages', 'created', CallerMobile.toString()+'HOOK', 'roomId='+room.id)
                        .then(function(webhook) {
                            client.hmsetAsync(CallerMobile.toString(), {"sparkroomwebhook" : webhook.id});
                            console.log(webhook.name);
                        })
                        .catch(function(err) {
                            // process error
                            console.log(err);
                        });
                    //-------SEND ROOM START MESSAGE TO SPARK-------//
                    spark.messageSendRoom(room.id, {
                        text: "This starts the SMS enabled Spark room with "+ redres.clientfullname +" at "+ payload.session.from.id,
                        markdown: "This starts the **SMS enabled Spark** room with **"+ redres.clientfullname +"** at **"+ payload.session.from.id +"**"
                        //markdown: '**'+redres.clientfullname+'**'+" at "+'**'+payload.session.from.id+'**' + " says via SMS: \n>" + payload.session.initialText,
                        //files: ['http://company.com/myfile.doc']
                    }).catch(function(err){
                        console.log(err);
                    });
                    //-------SEND INSTRUCTION MESSAGE TO SPARK-------//
                    spark.messageSendRoom(room.id, {
                        text: "To send messages to "+ redres.clientfullname + " send a message like this: @SMSClient Hey there!",
                        markdown: "To send messages to **"+ redres.clientfullname + "** send a message like this: \"**@SMSClient** Hey there!\""
                        //markdown: '**'+redres.clientfullname+'**'+" at "+'**'+payload.session.from.id+'**' + " says via SMS: \n>" + payload.session.initialText,
                        //files: ['http://company.com/myfile.doc']
                    }).catch(function(err){
                        console.log(err);
                    });
                    //-------SEND FIRST SMS MESSAGE TO SPARK-------//
                    spark.messageSendRoom(room.id, {
                        text: payload.session.from.id + " sent: " + payload.session.initialText,
                        markdown: '**'+redres.clientfullname+'**'+" at "+'**'+payload.session.from.id+'**' + " says via SMS: \n>" + payload.session.initialText
                        //files: ['http://company.com/myfile.doc']
                    }).then(function(message) {
                        console.log("----- FUNCTION: PUBLISH SMS TO ROOM -----");
                        console.log('Message sent: %s', JSON.stringify(message));
                    }).catch(function(err){
                        console.log(err);
                    });
                    //-----------------------------------
                }).catch(function(err) {
                    console.log(err);
                });
            }

            //----- HUMAN EXISTS IN DATABASE WITH A DEFINED SPARK ROOM -----//
            if (!_.isEmpty(redres) && _.size(redres.sparkroomid)>5) {
                console.log("----- CONDITION: HUMAN EXISTS IN DATABASE WITH DEFINED SPARK ROOM -----");
                console.log("Client "+ CallerMobile + " has a defined spark room! \n");
                spark.messageSendRoom(redres.sparkroomid, {
                    text: redres.clientfullname+" at "+payload.session.from.id+ " says via SMS: \n" + payload.session.initialText,
                    markdown: '**'+redres.clientfullname+'**'+" at "+'**'+payload.session.from.id+'**' + " says via SMS: \n>" + payload.session.initialText
                    //text: payload.session.from.id + " " + redres.clientfullname + " sent: " + payload.session.initialText,
                    //markdown: '**'+payload.session.from.id+" "+redres.clientfullname+'**' + " says: \n>" + payload.session.initialText,
                    //files: ['http://company.com/myfile.doc']
                }).then(function(message) {
                    console.log("----- FUNCTION: PUBLISH SMS TO ROOM -----");
                    console.log('Message sent: %s', JSON.stringify(message));
                }).catch(function(err){
                    console.log(err);
                });
            }
        });
    }
});


/*
 //Deal with inbound POST from Spark
 app.post('/sparkin', function(req, res)
 {
 var result = _.filter(req.body, function(u) {
 //console.log(req.body.data.mentionedPeople);
 return req.body.data.mentionedPeople == 'Y2lzY29zcGFyazovL3VzL1BFT1BMRS80ZmU0NWJlYS0wMThhLTRiMGYtODExMy03NzVhMzRjZjBkNjE';
 });

 console.log('------SPARKIN ROUTE-------');
 //console.log(new Date().toString() + '\n Filtering IN payload \n' + JSON.stringify(req.body));
 console.log(JSON.stringify(result));
 console.log('----------------');
 res.writeHead(200, {'Content-Type': 'application/json'});
 res.end();
 });
 */


//----- INBOUND WEBHOOK CALLS -----//
app.post('/sparkhookin/:id', function(req, res)
{
    console.log(new Date().toString() + '\n ----- INBOUND WEBHOOK CALLS ----- \n' + JSON.stringify(req.body));
    console.log("CHEKCING BODY FOR MENTION OF BOT - " + _.has(req.body.data,'mentionedPeople'));

    //----- IF SMSCLIENT BOT MENTIONED, THEN SEND SMS TO CALLER -----//
    if (_.has(req.body.data,'mentionedPeople')){
        //----
        console.log("SEND SMS TO: " + (req.body.name).toString().replace('HOOK',''));
        spark.messageGet(req.body.data.id, 100).then(function(message) {
            console.log("------modify the string ----");
            var pattern = /WhiteGlove|SMSClient/ig;
            //---- USING POST FOR TROPO SMS -----//
            var options = { method: 'POST',
                url: 'https://api.tropo.com/1.0/sessions',
                headers:
                    { 'content-type': 'application/x-www-form-urlencoded',
                        //'postman-token': '24978f73-8bc7-ca3e-e9f3-3c2bedfa3a78',
                        'cache-control': 'no-cache' },
                form:
                    { token: troposmstoken,
                        action: 'create',
                        numberToDial: (req.body.name).toString().replace('HOOK',''),
                        msg: encodeURIComponent((message.text).toString().replace(pattern,'')) }
            };
            smsrequest(options, function (error, response, body) {
                if (error) throw new Error(error);
            });
            //-----EoPOST ----//
        }).catch(function(err) {
            // process error
            console.log(err);
        });
        //----
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end();
});

//Start the webservice
//app.listen(listenport);
//*****************************************************************
// START THIS WEBSERVICE
//*****************************************************************

var httpServer = http.createServer(app);
//var httpsServer = https.createServer(credentials, app);

httpServer.listen(process.env.LISTEN_HTTP_PORT);
//httpsServer.listen(process.env.LISTEN_HTTPS_PORT);
/*
 https.createServer({
 key: fs.readFileSync('smsbot.cisco.com.key'),
 cert: fs.readFileSync('smsbot.cisco.com.cer')
 }, app).listen(listenport);
 */

console.log('This webservice is listening on port: ' + listenport);

//Spark integration
var Spark = require('node-sparky');

//SMSClient BOT's token declared
var spark = new Spark({
    token: process.env.SPARK_BOT_TOKEN
    //webhookUrl: 'https://exmachina-sparkspigot.c9users.io:8082/sparkin',
});

