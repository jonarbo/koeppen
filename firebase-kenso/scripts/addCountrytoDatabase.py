#!/usr/bin/env python 

#
# This script just adds a Cuntry name to the Firestore Database
# 

import sys
import firebase_admin
from firebase_admin import credentials , firestore

if (len(sys.argv) < 2):
	print ("Need a country name")
	sys.exit() 

countryName =  sys.argv[1]

cred = credentials.Certificate("/Users/jonarbo/Devel/firebase-kenso/kenso-a0b7c-firebase-adminsdk-i81kh-7a750e5f93.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

data = {}

db.collection(u'countries').document(countryName).set(data)

