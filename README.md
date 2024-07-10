# New Relic Synthetic email reader 

## Docker -> CPM (EOL)

- STEP 1: Clone custom-modules-folder in this repo to the machine running CPM
- STEP 2: Change custom-modules-folder permissions (chown -R 1000:3729) as per https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/private-locations/containerized-private-minion-cpm-configuration/#guidelines-for-mounting-volumes
- STEP 3: Obtain private location key as per https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/private-locations/install-containerized-private-minions-cpms/
- STEP 4: Run CPM and mount the custom-modules-folder to /var/lib/newrelic/synthetics/modules as read write as per https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/private-locations/containerized-private-minion-cpm-configuration/#custom-npm-modules-custom-modules

```
docker run -e MINION_PRIVATE_LOCATION_KEY=NRSP-XXXXXXXXXXXXX \ 
-d --restart unless-stopped \ 
-v /tmp:/tmp:rw -v /var/run/docker.sock:/var/run/docker.sock:rw \
-v /PATH_CUST_MOD_FOLDER/custom-modules-folder:/var/lib/newrelic/synthetics/modules:rw \
quay.io/newrelic/synthetics-minion:latest
```

## Docker -> SJM 

- https://docs.newrelic.com/docs/synthetics/synthetic-monitoring/private-locations/job-manager-configuration/

## Kubernetes -> CPM (EOL)

To copy the repo and change directory into custom-module

```
git clone https://github.com/dpacheconr/synthetic-email-reader.git && cd synthetic-email-reader/custom-modules-folder && helm repo add newrelic https://helm-charts.newrelic.com && helm repo update
```

To install synthetic minion and copy the custom-module into running pod, update the private location key before running

```
helm upgrade --install newrelic-cpm newrelic/synthetics-minion -n newrelic --set synthetics.privateLocationKey=NRSP-XXXX --set synthetics.hordeApiEndpoint=https://synthetics-horde.eu01.nr-data.net --set persistence.customModules=custom-modules-folder --create-namespace && echo "\n Waiting for pod to be ready, before copying custom-modules \n" && kubectl wait --for=condition=Ready -n newrelic pod/newrelic-cpm-synthetics-minion-0 --timeout=120s && kubectl cp . newrelic/newrelic-cpm-synthetics-minion-0:/var/lib/newrelic/synthetics/modules/ -c synthetics-minion && echo "\n Waiting for Minion to be ready to use \n" && kubectl logs -n newrelic newrelic-cpm-synthetics-minion-0 -c synthetics-minion -f | grep -q "is ready and servicing location" && echo "\n Minion ready \n"
```

## Kubernetes -> SJM

- PRE-REQ: persistent volume and volume claim -> volume.yaml

To copy the repo and change directory into custom-module

```
git clone https://github.com/dpacheconr/synthetic-email-reader.git && cd synthetic-email-reader && helm repo add newrelic https://helm-charts.newrelic.com && helm repo update
```

To install Synthetics Job Manager and copy the custom-module into running pod, update the volume-azure.yaml as appropriate, as well as private location key before running

```
kubectl apply -f volume-azure.yaml \
&& helm upgrade --install newrelic-sjm newrelic/synthetics-job-manager -n newrelic --set synthetics.privateLocationKey=NRSP-XXX \
--set synthetics.hordeApiEndpoint=https://synthetics-horde.eu01.nr-data.net \
--set global.persistence.existingClaimName="cmf-pvc" --set global.customNodeModules.customNodeModulesPath="custom-modules-folder" \
&& echo "\nWaiting for pod to schedule to node\n" \
&& POD=$(kubectl get pod -n newrelic -l app.kubernetes.io/name=synthetics-job-manager -o jsonpath="{.items[0].metadata.name}")  \
&& kubectl wait pod --for=condition=PodScheduled -n newrelic $POD --timeout=300s \
&& echo "\nPod scheduled, waiting for containers to start\n" \
&& kubectl wait pod --for=condition=ContainersReady -n newrelic $POD --timeout=300s \
&& echo "\nPod scheduled, copying custom modules" \
&& kubectl cp custom-modules-folder/imapc -n newrelic $POD:/var/lib/newrelic/synthetics/modules/ -c synthetics-job-manager \
&& kubectl cp custom-modules-folder/package.json -n newrelic $POD:/var/lib/newrelic/synthetics/modules/ -c synthetics-job-manager \
&& echo "\nWaiting for SJM pod to be ready\n" \
&& kubectl delete $POD \
&& POD=$(kubectl get pod -n newrelic -l app.kubernetes.io/name=synthetics-job-manager -o jsonpath="{.items[0].metadata.name}")  \
&& kubectl wait pod --for=condition=Ready -n newrelic $POD --timeout=300s \
&& kubectl logs -n newrelic $POD -c synthetics-job-manager -f | grep -q "Custom node modules installed successfully." \
&& echo "\nSJM pod ready \n"
```


## GMAIL example
- STEP 1: create app password for script to use as per https://support.google.com/mail/answer/185833?sjid=8024189058214870792-NC
- STEP 2: update the imapConfig in script.js with password obtained in step 1 and your email address 
- STEP 3: create your synthetic script and choose your private location


## This custom module depends on the following libraries 
- https://www.npmjs.com/package/imap
- https://www.npmjs.com/package/mailparser
