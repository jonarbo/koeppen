#!/bin/bash 

if [ $# == 0 ]; then 
	echo "Error! Need a file as a parameter"
	exit
fi

while [ ! -z $1 ] ;
do
	filename=$(basename -- "$1")
	filename="${filename%.*}"
	
	cat $1 | sed "s/ *//g" | sed "s/	*//g" | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g'  > ${filename}-compact.js 
	
	shift
done
