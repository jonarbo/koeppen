#!/bin/bash 

if [ $# == 0 ]; then 
	echo "Error! Need a file as a parameter"
	exit
fi

function FindMaxMinLat() {
	maxlat=`cut -d ',' -f 2 $1 | sort -r | tail -n +2 | head -n1`
	minlat=`cut -d ',' -f 2 $1 | sort -r | tail -n +2 | tail -n1`	
}

function FindMaxMinLon() {
	maxlon=`cut -d ',' -f 1 $1 | sort -r | tail -n +2 | head -n1`
	minlon=`cut -d ',' -f 1 $1 | sort -r | tail -n +2 | tail -n1`	
}

function FindMaxMinValue() {
	incol=3
	f=`cut -d ',' -f $incol $1 | head -n 1` 
	while [ ! -z "$f" ];
	do
	    maxv+=(`cut -d ',' -f $incol $1 | sort -r | tail -n +2 | head -n1`)
		minv+=(`cut -d ',' -f $incol $1 | sort -r | tail -n +2 | tail -n1`)
		incol=$(($incol+1))
		f=`cut -d ',' -f $incol $1 | head -n 1` 
	done
}

function InitFile() {
	cat <<EOF > $1
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

function AddMaxMinCoords() {
			cat <<EOF >>$1
					"maxlat":$maxlat,
					"maxlon":$maxlon,
					"minlat":$minlat,
					"minlon":$minlon,
EOF
}

function AddMaxMinValues() {
		cat <<EOF >>$1
					"$2_max":${maxv[$3]},
					"$2_min":${minv[$3]},
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
declare -a maxv
declare -a minv
declare minlat
declare maxlat

while [ ! -z $1 ] ;
do
	#	
	# create GeoJSON file
	#
	filename=$(basename -- "$1")
	filename="${filename%.*}"
	if [ -f "$filename.json" ]; then 
		echo "File '$filename.json' already exists ... skipping"; 
	else

		FindMaxMinValue $1
		FindMaxMinLat $1
		FindMaxMinLon $1

		InitFile $filename.json
	
		#
		# First be sure the text file doesnt have any DOS hidden char
		#	
		dos2unix $1

		cat $1 | while read a;
		do
			if [ $i -eq 2 ]; then FinishProperty $filename.json; fi
			if [ $i -eq 1 ]; then 
				# Process headers
				IFS=',' read -ra HEADERS <<< "$a"
				i=0
				lastElemIndex=$((${#HEADERS[@]}-1))	
			else
			 	# process values "$f"
				IFS=',' read -ra FIELDS <<< "$a"
				k=0
				InitProperty $filename.json 
				AddMaxMinCoords  $filename.json 
				for f in "${FIELDS[@]}"; do
					if [ "${HEADERS[$k]}" == "lon" ] ; then 
						lon=$f
					elif [ "${HEADERS[$k]}" == "lat" ] ; then	
						lat=$f
					else
 						# Process fields
						AddMaxMinValues  $filename.json ${HEADERS[$k]} $(($k-2))
						if [ $k -eq $lastElemIndex ]; then 
							AddLastProperty $filename.json ${HEADERS[$k]} $f
						else 
							AddProperty $filename.json ${HEADERS[$k]} $f
						fi
					fi 					
					k=$(($k+1))	
				done
				# Add coordinates here
				AddCoordinate $filename.json $lon $lat	
				i=2
			fi
		done
	fi
	FinishFile $filename.json   	
	shift
done

