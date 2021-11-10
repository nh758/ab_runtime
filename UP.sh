#!/bin/bash
Dev=
Test=
Quiet=
# Read flags -d for dev, -t for test, -q for no logs
while getopts dtq name
do
    case $name in
    d)    Dev="true";;
    t)    Test="true";;
		q)		Quiet="true"
    esac
done
File="docker-compose.yml"
TestOveride=""
if [[ -n $Dev ]]
then
	File="docker-compose.dev.yml"
fi
if [[ -n $Test ]]
then
	TestOveride="-c ./test/setup/ci-test.overide.yml"
fi
nohup node ab_system_monitor.js &> /dev/null &
docker stack deploy -c $File -c docker-compose.override.yml $TestOveride ab
if [[ -z $Quiet ]]
then
./logs.js
fi
