#!/usr/bin/env bash

set -e

VERSION=$(git rev-parse --short HEAD)
NODE_NAME=acala/oracle-dispatcher

docker build . -t $NODE_NAME:$VERSION
docker push $NODE_NAME:$VERSION
