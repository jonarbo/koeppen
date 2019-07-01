const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

const firebase = require("firebase");
// Required for side-effects
require("firebase/functions");

admin.initializeApp();

// get the firestore ref
const db = admin.firestore();

exports.getCountriesPublic = functions.https.onCall( function(data, context){

    if (!context.auth) return {status: 'error', error : { code: 401, details: 'Not signed in'}}
  
      var pointsRef = db.collection('points');

      var geojson = {
          properties: {
              columns: ""
          },
          type: "FeatureCollection",
          features: [{}]
      } 

      var maxlon=-180
      var minlon=180
      var maxlat=-180
      var minlat=180
      var tile = 0.025
      var columns="lon,lat"
      var colmaxs = {} ;
      var colmins = {} ;
      var countries=""

      return pointsRef.where('ispublic','==',true).get().then(function (qsnapshot){
            qsnapshot.forEach(function(doc){
                var feature = {
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
                                var lon = parseFloat(doc.data().coords.lon);
                                var lat = parseFloat(doc.data().coords.lat);
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
                            case 'data':
                            // get the columns of data          
                            var data = doc.data().data                              
                            for (var skey in data ) {
                                // check if the property/key is defined in the object itself, not in parent
                                if ( data.hasOwnProperty(skey)) {           
                                    var value = parseFloat( data[skey] ) 
                                    var colarray = columns.split(',');
                                    if ( colarray.indexOf(skey.toString()) == "-1" ){
                                        //catch a column
                                        columns += "," + skey.toString() 
                                        colmaxs[skey.toString()+"_max"] = -200
                                        colmins[skey.toString()+"_min"] = 200
                                    }               
                                    // add the value at coords to the feature 
                                    feature['properties'][skey.toString()] = value
                                    if ( value < parseFloat(colmins[skey.toString()+"_min"])) { 
                                    colmins[skey.toString()+"_min"] = value  
                                    }       
                                    if ( value > parseFloat(colmaxs[skey.toString()+"_max"])) {
                                        colmaxs[skey.toString()+"_max"] = value  
                                    }                                                                
                                }
                            }
                            break;
                            default:
                            break;
                    } 
                });
                geojson['features'].push(feature)
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

exports.getCountry = functions.https.onCall( function(data, context){

    const uid   = context.auth.token.uid;
    const name  = context.auth.token.name  || null;
    const email = context.auth.token.email || null;
    const sCountry =  data.toString();
       
    if (!context.auth)     return {status: 'error', error: { details: 'Not signed in'} }
    if ( email == null ) { return {status: 'error', error: { details: 'Unable to identify user' }} }

    var pointsRef = db.collection('points');
    var userRef = db.collection('users').doc(email);

    geojson = {
        properties: {
            columns: ""
        },
        type: "FeatureCollection",
        features: [{}]
    } 

    var maxlon=-180
    var minlon=180
    var maxlat=-180
    var minlat=180
    var tile = 0.025
    var columns="lon,lat"
    var colmaxs = {} ;
    var colmins = {} ;
        
    return userRef.get().then( async function (doc){
        
        var user = doc.data()
        var countries = Object.values(user.tags.countries).toString()
        var cArray = countries.split(',')
        var cArrayLen = cArray.length;

        try {
            var cFound = false
            for (var i = 0; i < cArrayLen ; i++) {
                if ( sCountry == cArray[i].toString() ){
                    cFound = true
                    break
                }
            }

            if ( ! cFound ) { return  {status: 'error', error: { details: 'User ' + name + ' do not have access to selected Country ' + sCountry} } }

            const qsnapshot = await pointsRef.where('country','==',sCountry).get();
            qsnapshot.forEach(function (doc_1) {
                var feature = {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Polygon",
                        coordinates: [[]]
                    }
                };
                Object.keys(doc_1.data()).forEach(function (key) {
                    switch (key) {
                        case 'country':
                            // Do nothing                                
                            break;
                        case 'coords':
                            //compute maxlat and maxlon
                            var lon = parseFloat(doc_1.data().coords.lon);
                            var lat = parseFloat(doc_1.data().coords.lat);
                            if ( lat > maxlat ) { maxlat = lat }
                            if ( lon > maxlon ) { maxlon = lon }
                            if ( lat < minlat ) { minlat = lat }
                            if ( lon < minlon ) { minlon = lon }                                 
                            feature['properties']['lon'] = lon
                            feature['properties']['lat'] = lat
                            feature['geometry']['coordinates'] = [[ [parseFloat(lon)+parseFloat(tile),parseFloat(lat)-parseFloat(tile)],[parseFloat(lon)-parseFloat(tile),parseFloat(lat)-parseFloat(tile)],[parseFloat(lon)-parseFloat(tile),parseFloat(lat)+parseFloat(tile)],[parseFloat(lon)+parseFloat(tile),parseFloat(lat)+parseFloat(tile)],[parseFloat(lon)+parseFloat(tile),parseFloat(lat)-parseFloat(tile)] ]]   
                            break;
                        case 'ispublic':
                            // Do nothing 
                            break;
                        case 'data':
                            // get the columns of data          
                            var data = doc_1.data().data                              
                            for (var skey in data ) {
                                // check if the property/key is defined in the object itself, not in parent
                                if ( data.hasOwnProperty(skey)) {           
                                    var value = parseFloat( data[skey] ) 
                                    var colarray = columns.split(',');
                                    if ( colarray.indexOf(skey.toString()) == "-1" ){
                                        //catch a column
                                        columns += "," + skey.toString() 
                                        colmaxs[skey.toString()+"_max"] = -200
                                        colmins[skey.toString()+"_min"] = 200
                                    }               
                                    // add the value at coords to the feature 
                                    feature['properties'][skey.toString()] = value
                                    if ( value < parseFloat(colmins[skey.toString()+"_min"])) { 
                                    colmins[skey.toString()+"_min"] = value  
                                    }       
                                    if ( value > parseFloat(colmaxs[skey.toString()+"_max"])) {
                                        colmaxs[skey.toString()+"_max"] = value  
                                    }                                                                
                                }
                            }
                            break;
                        default:
                            break;
                    }
                });
                geojson['features'].push(feature);
            });
            geojson['properties']['countries'] = countries;
            geojson['properties']['columns'] = columns;
            geojson['properties']['maxlat'] = maxlat;
            geojson['properties']['maxlon'] = maxlon;
            geojson['properties']['minlat'] = minlat;
            geojson['properties']['minlon'] = minlon;
            Object.keys(colmaxs).forEach(function (key) {
                geojson['properties'][key] = colmaxs[key];
            });
            Object.keys(colmins).forEach(function (key) {
                geojson['properties'][key] = colmins[key];
            });
            return { geojson: geojson };
        }
        catch (error) {
            return { status: 'error', error };
        }
    })
  });

exports.getCountriesForUser = functions.https.onCall( function(data, context){

    const uid   = context.auth.token.uid;
    const name  = context.auth.token.name  || null;
    const email = context.auth.token.email || null;
    
    if (!context.auth)     return {status: 'error', error: { details: 'Not signed in'} }
    if ( email == null ) { return {status: 'error', error: { details: 'Unable to identify user' }} }

    var pointsRef = db.collection('points');
    var userRef = db.collection('users').doc(email);

    geojson = {
        properties: {
            columns: ""
        },
        type: "FeatureCollection",
        features: [{}]
    } 

    var maxlon=-180
    var minlon=180
    var maxlat=-180
    var minlat=180
    var tile = 0.025
    var columns="lon,lat"
    var colmaxs = {} ;
    var colmins = {} ;
        
    return userRef.get().then( async function (doc){
        
        var user = doc.data()
        var countries = Object.values(user.tags.countries).toString()
        var cArray = countries.split(',')
        var cArrayLen = cArray.length;

        try {
            for (var i = 0; i < cArrayLen ; i++) {
                var country = cArray[i].toString()
                const qsnapshot = await pointsRef.where('country','==',country).where('ispublic','==',false).get();
                qsnapshot.forEach(function (doc_1) {
                    var feature = {
                        type: "Feature",
                        properties: {},
                        geometry: {
                            type: "Polygon",
                            coordinates: [[]]
                        }
                    };
                    Object.keys(doc_1.data()).forEach(function (key) {
                        switch (key) {
                            case 'country':
                                // Do nothing                                
                                break;
                            case 'coords':
                                //compute maxlat and maxlon
                                var lon = parseFloat(doc_1.data().coords.lon);
                                var lat = parseFloat(doc_1.data().coords.lat);
                                if ( lat > maxlat ) { maxlat = lat }
                                if ( lon > maxlon ) { maxlon = lon }
                                if ( lat < minlat ) { minlat = lat }
                                if ( lon < minlon ) { minlon = lon }                                 
                                feature['properties']['lon'] = lon
                                feature['properties']['lat'] = lat
                                feature['geometry']['coordinates'] = [[ [parseFloat(lon)+parseFloat(tile),parseFloat(lat)-parseFloat(tile)],[parseFloat(lon)-parseFloat(tile),parseFloat(lat)-parseFloat(tile)],[parseFloat(lon)-parseFloat(tile),parseFloat(lat)+parseFloat(tile)],[parseFloat(lon)+parseFloat(tile),parseFloat(lat)+parseFloat(tile)],[parseFloat(lon)+parseFloat(tile),parseFloat(lat)-parseFloat(tile)] ]]   
                                break;
                            case 'ispublic':
                                // Do nothing 
                                break;
                            case 'data':
                                // get the columns of data          
                                var data = doc_1.data().data                              
                                for (var skey in data ) {
                                    // check if the property/key is defined in the object itself, not in parent
                                    if ( data.hasOwnProperty(skey)) {           
                                        var value = parseFloat( data[skey] ) 
                                        var colarray = columns.split(',');
                                        if ( colarray.indexOf(skey.toString()) == "-1" ){
                                            //catch a column
                                            columns += "," + skey.toString() 
                                            colmaxs[skey.toString()+"_max"] = -200
                                            colmins[skey.toString()+"_min"] = 200
                                        }               
                                        // add the value at coords to the feature 
                                        feature['properties'][skey.toString()] = value
                                        if ( value < parseFloat(colmins[skey.toString()+"_min"])) { 
                                        colmins[skey.toString()+"_min"] = value  
                                        }       
                                        if ( value > parseFloat(colmaxs[skey.toString()+"_max"])) {
                                            colmaxs[skey.toString()+"_max"] = value  
                                        }                                                                
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    });
                    geojson['features'].push(feature);
                });
            } 
            //now get the public data
            const qsnapshotp = await pointsRef.where('ispublic','==',true).get();
            qsnapshotp.forEach(function (doc_1) {
                var feature = {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Polygon",
                        coordinates: [[]]
                    }
                };
                Object.keys(doc_1.data()).forEach(function (key) {
                    switch (key) {
                        case 'country':
                            // Do nothing                                
                            break;
                        case 'coords':
                            //compute maxlat and maxlon
                            var lon = parseFloat(doc_1.data().coords.lon);
                            var lat = parseFloat(doc_1.data().coords.lat);
                            if ( lat > maxlat ) { maxlat = lat }
                            if ( lon > maxlon ) { maxlon = lon }
                            if ( lat < minlat ) { minlat = lat }
                            if ( lon < minlon ) { minlon = lon }                                 
                            feature['properties']['lon'] = lon
                            feature['properties']['lat'] = lat
                            feature['geometry']['coordinates'] = [[ [parseFloat(lon)+parseFloat(tile),parseFloat(lat)-parseFloat(tile)],[parseFloat(lon)-parseFloat(tile),parseFloat(lat)-parseFloat(tile)],[parseFloat(lon)-parseFloat(tile),parseFloat(lat)+parseFloat(tile)],[parseFloat(lon)+parseFloat(tile),parseFloat(lat)+parseFloat(tile)],[parseFloat(lon)+parseFloat(tile),parseFloat(lat)-parseFloat(tile)] ]]   
                            break;
                        case 'ispublic':
                            // Do nothing 
                            break;
                        case 'data':
                            // get the columns of data          
                            var data = doc_1.data().data                              
                            for (var skey in data ) {
                                // check if the property/key is defined in the object itself, not in parent
                                if ( data.hasOwnProperty(skey)) {           
                                    var value = parseFloat( data[skey] ) 
                                    var colarray = columns.split(',');
                                    if ( colarray.indexOf(skey.toString()) == "-1" ){
                                        //catch a column
                                        columns += "," + skey.toString() 
                                        colmaxs[skey.toString()+"_max"] = -200
                                        colmins[skey.toString()+"_min"] = 200
                                    }               
                                    // add the value at coords to the feature 
                                    feature['properties'][skey.toString()] = value
                                    if ( value < parseFloat(colmins[skey.toString()+"_min"])) { 
                                    colmins[skey.toString()+"_min"] = value  
                                    }       
                                    if ( value > parseFloat(colmaxs[skey.toString()+"_max"])) {
                                        colmaxs[skey.toString()+"_max"] = value  
                                    }                                                                
                                }
                            }
                            break;
                        default:
                            break;
                    }
                });
                geojson['features'].push(feature); 
            })

            geojson['properties']['countries'] = countries;
            geojson['properties']['columns'] = columns;
            geojson['properties']['maxlat'] = maxlat;
            geojson['properties']['maxlon'] = maxlon;
            geojson['properties']['minlat'] = minlat;
            geojson['properties']['minlon'] = minlon;
            Object.keys(colmaxs).forEach(function (key) {
                geojson['properties'][key] = colmaxs[key];
            });
            Object.keys(colmins).forEach(function (key) {
                geojson['properties'][key] = colmins[key];
            });
            return { geojson: geojson };
        }
        catch (error) {
            return { status: 'error', error };
        }
    })
});


