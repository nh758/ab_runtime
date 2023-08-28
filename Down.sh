#!/bin/bash

# Import ENV variables
set -o allexport
source .env
set +o allexport

kill $( ps aux | grep "node ab_system_monitor.js" | grep -v "grep" | awk '{print $2}' ) &> /dev/null
docker stack rm ${STACKNAME}