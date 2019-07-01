#!/usr/bin/env python 

#
# This script takes a CSV file representing all the points for some County and add the points to the Firestore Database
#	
#	The CSV file must have in the header the fields 'lat' and 'lon' ... any other column will be taken as data
#	for instance: 
#			lon,lat,frequency,risk
#			-81.25,19.3,0.50,0.00
#			-81.35,19.35,0.63,0.00
#			-81.25,19.35,0.38,0.38
#			-81.2,19.35,0.38,0.38

import sys
import os
import firebase_admin
from firebase_admin import credentials , firestore
from google.cloud.firestore_v1 import ArrayRemove, ArrayUnion

if (len(sys.argv) < 2):
	print ("Need an input file")
	sys.exit() 

filename =  sys.argv[1]
isPublic = True
#isPublic = False

cred = credentials.Certificate("/Users/jonarbo/Devel/firebase-kenso/kenso-a0b7c-firebase-adminsdk-i81kh-7a750e5f93.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

file = open(filename,'r')

header=file.readline().strip().split(",")
countryName = os.path.splitext( os.path.basename(filename) )[0]

print ("processing country: ", countryName )

#
# If Country not in the database, add it 
#
docs =  db.collection(u'tags').where(u'array', u'array_contains', countryName).get()
exists =  sum(1 for x in docs) != 0 
if ( not exists  ):
	data = {}
	docRef = db.collection(u'tags').document(u'countries')
	docRef.update( {u'array': ArrayUnion([countryName])}  )


pointsRef=db.collection(u'points')

lati = header.index("lat")
loni = header.index("lon")

for line in file:

    lina = line.strip().split(",")

    record = {
	u'coords': {
			u'lat': lina[lati],
			u'lon': lina[loni]
	},
        u'country': countryName,
        u'ispublic': isPublic,
	u'data': {}
    }

    for c in header:
        if (c != "lat") and (c!="lon"):
            record['data'].update( { c : lina[header.index(c)] } )

    docs =  pointsRef.where(u'coords.lat', u'==', lina[lati]).where(u'coords.lon', u'==', lina[loni]).get()
    exists =  sum(1 for x in docs) != 0 

    #
    # Add only if this coordinates are not already there	
    #
    if ( not exists ):
    	db.collection("points").add(record)
