const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

const firebase = require("firebase");
// Required for side-effects
require("firebase/functions");

admin.initializeApp();

// get the firestore ref
const db = admin.firestore();

exports.getCountries = functions.https.onCall( function(data, context){
  //  const uid = context.uid;
  //  const name = context.name || null;
  //  const email = context.email || null;

    if (!context.auth) return {status: 'error', code: 401, message: 'Not signed in'}

    var countriesRef = db.collection('countries');
    var users = db.collection('users');

    var countries = "";
    
    return countriesRef.get().then(function (qsnapshot){
                        qsnapshot.forEach(function(doc){
                            countries += doc.id;
                        });
                        return {countries: countries}
                    })
                    .catch(error => {
                        return {status: 'error', error}
                    });
});

exports.getCountriesPublic = functions.https.onCall( function(data, context){

    if (!context.auth) return {status: 'error', code: 401, message: 'Not signed in'}
  
      var pointsRef = db.collection('points');

      geojson = {
          properties: {
              columns: ""
          },
          type: "FeatureCollection",
          features: [{}]
      }

      var maxlon=-10000
      var minlon=10000
      var maxlat=-10000
      var minlat=10000     
      var tile = 0.025
      var columns="lon,lat"
      var colmaxs = {} ;
      var colmins = {} ;
      var countries=""
      return pointsRef.get().then(function (qsnapshot){
                          qsnapshot.forEach(function(doc){
                            if ( doc.data().ispublic ){
                                feature = {
                                    type: "Feature",
                                    properties: {},
                                    geometry:{
                                        type: "Polygon",
                                        coordinates: [[]]
                                    }
                                }
                                Object.keys(doc.data()).forEach( function(key){
                                    switch (key){
                                        case 'country':
                                            // code
                                            var country = doc.data()[key].toString();
                                            var countArray = countries.split(',');
                                            if ( countArray.indexOf(country) == "-1" ){
                                                countries += "," + country
                                            }
                                            break;
                                         case 'coords':
                                             //compute maxlat and maxlon
                                             var lon = parseFloat(doc.data()[key][1]);
                                             var lat = parseFloat(doc.data()[key][0]);
                                             if ( lat > maxlat ) { maxlat = lat }
                                             if ( lon > maxlon ) { maxlon = lon }
                                             if ( lat < minlat ) { minlat = lat }
                                             if ( lon < minlon ) { minlon = lon }                                 
                                             feature['properties']['lon'] = lon
                                             feature['properties']['lat'] = lat
                                             feature['geometry']['coordinates'] = [[ [parseFloat(lon)+parseFloat(tile),parseFloat(lat)-parseFloat(tile)],[parseFloat(lon)-parseFloat(tile),parseFloat(lat)-parseFloat(tile)],[parseFloat(lon)-parseFloat(tile),parseFloat(lat)+parseFloat(tile)],[parseFloat(lon)+parseFloat(tile),parseFloat(lat)+parseFloat(tile)],[parseFloat(lon)+parseFloat(tile),parseFloat(lat)-parseFloat(tile)] ]]   
                                             break;
                                         case 'ispublic':
                                             break;
                                         default:
                                             // is a column of data
                                             var value = parseFloat(doc.data()[key]) 
                                             var colarray = columns.split(',');
                                             if ( colarray.indexOf(key.toString()) == "-1" ){
                                                //catch a column
                                                columns += "," + key.toString() 
                                                colmaxs[key.toString()+"_max"] = -200
                                                colmins[key.toString()+"_min"] = 200
                                            }        
                                             // add the coords to the feature 
                                             feature['properties'][key.toString()] = value
                                             if ( value < parseFloat(colmins[key.toString()+"_min"])) { 
                                                colmins[key.toString()+"_min"] = value  
                                             }       
                                             if ( value > parseFloat(colmaxs[key.toString()+"_max"])) {
                                                colmaxs[key.toString()+"_max"] = value  
                                             }                                 
                                             break;
                                    } 
                                });
                                geojson['features'].push(feature)
                            }
                               
                          });  
                         geojson['properties']['countries'] = countries.substring(1);
                         geojson['properties']['columns'] = columns
                         geojson['properties']['maxlat']  = maxlat
                         geojson['properties']['maxlon']  = maxlon
                         geojson['properties']['minlat']  = minlat
                         geojson['properties']['minlon']  = minlon   
                         Object.keys(colmaxs).forEach( function(key){ 
                            geojson['properties'][key]  =  colmaxs[key] 
                         })
                         Object.keys(colmins).forEach( function(key){ 
                            geojson['properties'][key]  =  colmins[key] 
                         })
                         return {geojson: geojson}
                      })
                     .catch(error => {
                        return {status: 'error', error}
                     });
  });
  

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

