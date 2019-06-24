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

if (len(sys.argv) < 2):
	print ("Need an input file")
	sys.exit() 

filename =  sys.argv[1]

cred = credentials.Certificate("/Users/jonarbo/Devel/firebase-kenso/kenso-a0b7c-firebase-adminsdk-i81kh-7a750e5f93.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

file = open(filename,'r')

header=file.readline().strip().split(",")
country = os.path.splitext( os.path.basename(filename) )[0]

print ("processing country: ", country )

for line in file:
    lati = header.index("lat")
    loni = header.index("lon")

    lina = line.strip().split(",")

    data = {
        u'coords': [lina[lati],lina[loni]],
        u'country': country,
        u'ispublic': True
    }

    for c in header:
        if (c != "lat") and (c!="lon"):
            data.update({c: lina[header.index(c)]})


    db.collection("points").add(data)
