#!/bin/bash
STACK=${1}
STACK=${STACK:=test_ab}

ID_Service=`docker ps | grep ${STACK}_db | awk '{ print $1 }'`
if [ -z "$ID_Service" ]
then
	echo ""
	echo "couldn't find process matching '${STACK}_db' "
	echo ""
	echo "current processes :"
	docker ps
	echo ""
else
	docker exec $ID_Service bash reset.sh
fi
