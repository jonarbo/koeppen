#!/bin/bash 

if [ $# == 0 ]; then 
	echo "Error! Need a file as a parameter"
	exit
fi

function InitFile() {
	cat <<EOF > $1
eqfeed_callback (
        {"type" : "FeatureCollection" ,
         "features":
                 [
EOF
}

function FinishFile() {
	cat <<EOF >> $1
                    }
                 ]
        }
);
EOF
}

function InitProperty() {
	cat <<EOF >>$1
                   { "type":"Feature" ,
                     "properties": 
                                    {
EOF
}

function AddProperty() {
	cat <<EOF >>$1
					"$2":$3,
EOF
}

function AddLastProperty() {
	cat <<EOF >>$1
					"$2":$3
                                    },
EOF
}

function AddCoordinate() {
	#
	# Before lets remove the last ','
	# 
	cat <<EOF >>$1
                      "geometry": {
                                        "type":"Polygon",
					"coordinates":[ [ [ `bc <<< $2-0.025`,`bc <<< $3-0.025`],[`bc <<< $2+0.025`,`bc <<< $3-0.025`],[`bc <<< $2+0.025`,`bc <<< $3+0.025`],[`bc <<< $2-0.025`,`bc <<< $3+0.025`],[`bc <<< $2-0.025`,`bc <<< $3-0.025`] ] ]
                                  }
EOF
}

function FinishProperty() {
	cat <<EOF >>$1
                    },
EOF
}

i=1
declare -a HEADERS
declare lon
declare lat
declare lastElemIndex

while [ ! -z $1 ] ;
do
	#	
	# create GeoJSON file
	#
	filename=$(basename -- "$1")
	filename="${filename%.*}"
	if [ -f "$filename.js" ]; then 
		echo "File '$filename.js' already exists ... skipping"; 
	else
		InitFile $filename.js
	
		#
		# First be sure the text file doesnt have any DOS hidden char
		#	
		dos2unix $1

		cat $1 | while read a;
		do
			if [ $i -eq 2 ]; then FinishProperty $filename.js; fi
			if [ $i -eq 1 ]; then 
				# Process headers
				IFS=',' read -ra HEADERS <<< "$a"
				i=0
				lastElemIndex=$((${#HEADERS[@]}-1))	
			else
			 	# process values "$f"
				IFS=',' read -ra FIELDS <<< "$a"
				k=0
				InitProperty $filename.js 
				for f in "${FIELDS[@]}"; do
					if [ "${HEADERS[$k]}" == "lon" ] ; then 
						lon=$f
					elif [ "${HEADERS[$k]}" == "lat" ] ; then	
						lat=$f
					else
 						# Process fields
						if [ $k -eq $lastElemIndex ]; then 
							AddLastProperty $filename.js ${HEADERS[$k]} $f
						else 
							AddProperty $filename.js ${HEADERS[$k]} $f
						fi
					fi 					
					k=$(($k+1))	
				done
				# Add coordinates here
				AddCoordinate $filename.js $lon $lat	
				i=2
			fi
		done
	fi
	FinishFile $filename.js   	
	shift
done

