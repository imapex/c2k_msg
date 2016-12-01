# C2K Messaging Services (DRAFT)

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

# C2K Messaging Services Pre-requisites

Within the C2K Messaging Services Demonstration there are two Application Components that you'll need to setup.  Each of these are independent of each other.  You could do a modified demo of using only one component

## Application Registration (future release)

This component enables Spark subscribers to register their own applications. The registration process creates an API-Key for use in their JSON requests.

## Message Broker 

This is main listening service responsible for brokering the transaction between the users application (e.g. C2K Listener) and the Spark cloud.
 
This component - 

* Listens for and validates all inbound requests against a REDIS key-value store
* First-time inbound requests create a Spark room with application owner's email address
* Subsequent inbound requests publish messages to the room created for First-time inbound request
