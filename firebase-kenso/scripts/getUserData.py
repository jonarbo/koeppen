#!/usr/bin/env python 
import sys
import os
import firebase_admin
from firebase_admin import credentials , firestore

if (len(sys.argv) < 2):
	print ("Need a user's email")
	sys.exit() 

email =  sys.argv[1]

cred = credentials.Certificate("/Users/jonarbo/Devel/firebase-kenso/kenso-a0b7c-firebase-adminsdk-i81kh-7a750e5f93.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

tagsRef = db.collection(u'tags')
pointsRef = db.collection(u'points')
usersRef = db.collection(u'users')

# Get only points that belongs to the user
user = usersRef.document(email).get()
print(u'Document data: {}'.format(user.to_dict()))
