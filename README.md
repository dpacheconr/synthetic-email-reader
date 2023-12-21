# New Relic Synthetic email reader 

## CUSTOM MODULE
- STEP 1: Clone custom-modules-folder in this repo to the machine running CPM
- STEP 2: Obtain private location key as per https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/private-locations/install-containerized-private-minions-cpms/
- STEP 3: Run CPM and mount the custom-modules-folder to /var/lib/newrelic/synthetics/modules as read write as per https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/private-locations/containerized-private-minion-cpm-configuration/#custom-npm-modules-custom-modules

'''
docker run -e MINION_PRIVATE_LOCATION_KEY=NRSP-XXXXXXXXXXXXX -d --restart unless-stopped \ 
-v /tmp:/tmp:rw -v /var/run/docker.sock:/var/run/docker.sock:rw \
-v /PATH_TO_CUSTOM_MODULE_FOLDER/custom-module-folder:/var/lib/newrelic/synthetics/modules:rw \
quay.io/newrelic/synthetics-minion:latest

'''

## GMAIL example
- STEP 1: create app password for script to use as per https://support.google.com/mail/answer/185833?sjid=8024189058214870792-NC
- STEP 2: update the imapConfig in script.js with password obtained in step 1 and your email address 
- STEP 3: create your synthetic script and choose your private location


## This custom module depends on the following libraries 
- https://www.npmjs.com/package/imap
- https://www.npmjs.com/package/mailparser