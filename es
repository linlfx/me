#!/bin/bash

if [ "$1" == "fuser" ]; then
  fusermount -u ~/me/secret
else
  encfs ~/me/.secret ~/me/secret
fi
