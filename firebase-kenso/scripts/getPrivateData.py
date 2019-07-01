#!/usr/bin/env python 
import sys
import os
import firebase_admin
from firebase_admin import credentials , firestore

cred = credentials.Certificate("/Users/jonarbo/Devel/firebase-kenso/kenso-a0b7c-firebase-adminsdk-i81kh-7a750e5f93.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

tagsRef = db.collection(u'tags')
pointsRef = db.collection(u'points')
usersRef = db.collection(u'users')

points = pointsRef.where(u'ispublic',u'==',False).get()
for point in points:
        print(u'{} => {}'.format(point.id, point.to_dict()))

