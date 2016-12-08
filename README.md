# C2K Messaging Services

The C2K Messaging Service is a micro-service associated to the [C2K Project](https://github.com/imapex/c2k_demo). This particular micro-service is responsible for publishing messages from other C2K or standalone applications into a Spark room.    

## C2K Demo Application Background

The C2K program is an attempt to highlight the cpabilities of the [Cisco 829 Industrial Integrated Services Routers](http://www.cisco.com/c/en/us/products/routers/829-industrial-router/index.html) with integrations into the [Cisco Collaboration](http://www.cisco.com/c/en/us/solutions/collaboration/index.html) portfolio as an alternatives to AVLS GPS vehicle tracking systems.

This solution will initially attempt to monitor and report the movement and activity of school buses along with various other real-time use-cases in future releases.

## Other Associated Repositories

This repository and README provide overall details on the C2K Messaging Service and steps to deploy 

The following repositories are where the actual code for the different involved micro-services/components are located.  

* [c2k_demo](https://github.com/imapex/c2k_demo) - Full Demo Application Setup and Details
* [c2k_iox](https://github.com/imapex/c2k_iox) - Details on the Cisco IOx Client Application 
* [c2k_listener](https://github.com/imapex/c2k_listener) - Details on the C2K payload listener

## Message Broker 

This is the main listening service responsible for brokering the transaction between the users application (e.g. C2K Listener) and the Spark cloud.
 
This application does the following:  

* Listens for and validates all inbound requests against a REDIS key-value store
* First-time inbound requests create a Spark room with application owner's email address
* Subsequent inbound requests publish messages to the room created for First-time inbound request

![alt tag](https://raw.githubusercontent.com/zoneix/c2k_msg/master/first-message.png)

![alt tag](https://raw.githubusercontent.com/zoneix/c2k_msg/master/subsequent-message.png)

# Pre-requisites

To use this application effectively, you will need the following

* An active [Cisco Spark](https://developer.ciscospark.com/)
 account and BOT token 
 
* Redis store - consider using [RedisLabs Cloud Service](https://redislabs.com/)
 
* A Mantl or marathon stack

# Redis key value store

This release of the application requires manually creating a Redis Hash store for example

Key: app-01-k0NiHzhql6

| Field  	| Value 	|
|------------------	|-----------------------------------	|
| sparkagentemail      	| joe@example.com              	|


The following fields will be auto created by the application

| Field  	| Value 	|
|------------------	|-----------------------------------	|
| sparkroomid      	| Spark room id obtained by application e.g. YIDHIHDSFJH/...
             	|
| sparkroomwebhook 	| Spark room webhook created by application e.g. UI8IQEKJH/... (used in future release)                                 	|


# Application Installation

This application can be installed locally on your server, or by using Docker (preferred).
In either mode the following environment variables must be present

*     APP_URL=http://the.deployment.url
*     LISTEN_HTTPS\_PORT=the HTTPS listening port
*     LISTEN_HTTP\_PORT=the HTTP listening port
*     REDIS_CONNECTION=redis://the-redis-provider-url:port
*     SPARK_BOT\_TOKEN=Your Spark BOT token    
    

## Docker installation

The latest version of this application is available on Docker hub. Start it by using
the following command:
```
 docker run -it \
-e APP_URL=http://the.deployment.url \
-e LISTEN_HTTPS\_PORT=the HTTPS listening port \
-e LISTEN_HTTP\_PORT=the HTTP listening port \
-e REDIS_CONNECTION=redis://the-redis-provider-url:port \
-e SPARK_BOT\_TOKEN=Your Spark BOT token \
-p 8080:8080 imapex/c2k_msg`
```
## Local Installation

* Clone this repo

```
git clone https://github.com/imapex/c2k_msg
```
* Make sure you have node.js setup 

```
cd c2k_msg
```
* Install dependencies in package.json

```
npm install
```
* Start the app

```
node broker.js
```

## Marathon Deployment

Alternatively, installation scripts are provided for deploying to a Marathon infrastructure

```
bash app_install.sh

```
