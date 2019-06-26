#!/usr/bin/env python 

#
# This script just adds a Country name to the Firestore Database
# 

import sys
import firebase_admin
from firebase_admin import credentials , firestore
from google.cloud.firestore_v1 import ArrayRemove, ArrayUnion

if (len(sys.argv) < 2):
	print ("Need a country name")
	sys.exit() 

countryName =  sys.argv[1]

cred = credentials.Certificate("/Users/jonarbo/Devel/firebase-kenso/kenso-a0b7c-firebase-adminsdk-i81kh-7a750e5f93.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

#
# If Country not in the database, add it
#
docs =  db.collection(u'tags').where(u'array', u'array_contains', countryName).get()
exists =  sum(1 for x in docs) != 0 
if ( not exists  ):
	data = {}
	docRef = db.collection(u'tags').document(u'countries')
	docRef.update( {u'array': ArrayUnion([countryName])}  )
