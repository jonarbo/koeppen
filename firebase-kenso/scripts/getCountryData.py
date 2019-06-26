#!/usr/bin/env python 
import sys
import os
import firebase_admin
from firebase_admin import credentials , firestore

if (len(sys.argv) < 2):
	print ("Need a Country name")
	sys.exit() 

country =  sys.argv[1]

cred = credentials.Certificate("/Users/jonarbo/Devel/firebase-kenso/kenso-a0b7c-firebase-adminsdk-i81kh-7a750e5f93.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

tagsRef = db.collection(u'tags')
pointsRef = db.collection(u'points')
usersRef = db.collection(u'users')

# Get only points that belongs to Cuba and are private
points = pointsRef.where(u'country',u'==',country).get()
for point in points:
        print(u'{} => {}'.format(point.id, point.to_dict()))

