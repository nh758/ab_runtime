#!/bin/bash
Dev=
Test=
# Read flags -d for dev, -t for test
while getopts dt name
do
    case $name in
    d)    Dev="true";;
    t)    Test="true";;
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
./logs.js
