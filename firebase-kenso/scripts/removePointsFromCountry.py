#!/usr/bin/env python 

#
# remove Country for the database along with all the points of this country
#

import sys
import os
import firebase_admin
from firebase_admin import credentials , firestore
from google.cloud.firestore_v1 import ArrayRemove, ArrayUnion

if (len(sys.argv) < 2):
	print ("Need a Country name")
	sys.exit() 

countryName =  sys.argv[1]

cred = credentials.Certificate("/Users/jonarbo/Devel/firebase-kenso/kenso-a0b7c-firebase-adminsdk-i81kh-7a750e5f93.json")
firebase_admin.initialize_app(cred)

db = firestore.client()
batch = db.batch()

print ("Deleting points for country: ", countryName )

pointsRef = db.collection(u'points')

#
# If Country is in the database, remove it
#
docs =  db.collection(u'tags').where(u'array', u'array_contains', countryName).get()
exists =  sum(1 for x in docs) != 0 
if ( exists  ):
	docRef = db.collection(u'tags').document(u'countries')
	docRef.update( {u'array': ArrayRemove([countryName])}  )	

#
# Get only points that belongs to Country
# and remove it
#
points = pointsRef.where(u'country',u'==',countryName).get()
for point in points:
	#batch.delete(point.getReference())
	point.reference.delete()


