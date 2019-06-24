'use strict';

var map;
var popup;
var layer;
var data;
var selectedCol = 0;
// get a database reference
var  db = firebase.firestore();
// Initialize Cloud Functions through Firebase
var  functions = firebase.functions();  
var userPic = document.getElementById('userpic');
var userPicElement = document.getElementById('user-pic');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signOutButtonText = document.getElementById('sign-out-button');
var contactInMap;

$(window).load(function(){
  
  // Init Map
  initMap();

  // Connect events
  // Listen to auth state changes.
 firebase.auth().onAuthStateChanged(authStateObserver);

 signInButtonElement.addEventListener('click', signIn);
 signOutButtonElement.addEventListener('click', signOut);

 $("#options").click(function(){
    if ( $('#advancedPanel').is(":visible") ){ 
        $('#advancedPanel').hide();
    } else {
        $('#advancedPanel').show();
    }
 });

 $("#selectedMenu").change( function(){
  //delete(map);
  var selected = $(this).val();	
  if (selected == "Choose" ) {return;}
  console.log("selected "  + $("#selectedMenu").selectedIndex )
 });

 $("#update").click(function() {
  updateItems();	 	
 });

});

/***************************/
/* Openstreetmap Functions */        
/***************************/

function initMap() {

  var element = $('#mapPage');
  element.height(element.height() - 42);

  // Create the map 
   // Create the map : Preferred Canvas for speed up high number of tiles       
  map = L.map('map',{preferCanvas:true,updateWhenZooming:false,updateWhenIdle:true}).setView([0, 0], 3);
  popup = L.popup();
  layer = L.geoJSON().addTo(map);

  // add an OpenStreetMap tile layer
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(map);

  // creaate legend
  L.Control.scale = L.Control.extend({
    onAdd: function(map) {
        var div = L.DomUtil.create('div');
        div.style.width="250px"
        div.style.background="black" 
        div.style.color="gray"
        div.style.padding="5px"
        div.innerHTML = '<div><input type="checkbox" id="keep" checked="true" value="keep">Delete layer on new load</div>'
        div.innerHTML += '<div style="height:20px; text-align: center; border: none; outline: none;cursor: pointer;background: linear-gradient(to right, #00ff00 0%, #ff0000 100%)"></div>'
        div.innerHTML += '<div  id="log-min" style="text-align: left;float:left">0</div>'
        div.innerHTML += '<div  id="log-max" style="text-align: right; ">1</div>'
        div.innerHTML += '<div  id="log-color" style="text-align: center"></div>'
        return div;
    },
    onRemove: function(map) {
        // Nothing to do here
    }
  });
  L.control.scale = function(opts) {
      return new L.Control.scale(opts);
  }
  // add legend
  L.control.scale({ position: 'bottomright' }).addTo(map);

  // creaate non-registered user dialog
  L.Control.contact = L.Control.extend({
    onAdd: function(map) {
        var div = L.DomUtil.create('div');
        div.innerHTML = '<a href="mailto:jonarbo@gmail.com" class="ui-btn ui-corner-all ui-btn-inline ui-mini footer-left ui-btn-icon-right ui-icon-mail">*** NOT REGISTERED USER *** You will only have ccess to limited data.<br>To subscribe to this servive or any other query, please contact us</a>'

        return div;
    },
    onRemove: function(map) {
        // Nothing to do here
    }
  });
  L.control.contact = function(opts) {
    return new L.Control.contact(opts);
  }
};

function onEachFeature(feature,layer) {
  layer.bindPopup("Lat: " + feature.properties.lat  + "<br/>Lng: " + feature.properties.lon + "<br>Value: " + feature.properties[ data.properties.columns.split(',')[selectedCol+2] ] );
  layer.on('mouseover', function(){
       console.log(feature)
      var RR  = feature.properties[ data.properties.columns.split(',')[selectedCol+2] ];
      var lat = feature.properties.lat;
      var lon = feature.properties.lon;
      var text = data.properties.columns.split(',')[selectedCol+2] + " ( "+ lat + " ; " + lon + " ) = " + RR ;
      document.getElementById("log-color").innerHTML=text;
  });
  layer.on('mouseout', function (){
      var text =  "" ;
      document.getElementById("log-color").innerHTML=text;
  });
}

function getColor(magnitude,delta) {
  //var high = [5, 69, 54];  // color of smallest datum
  var high = [0, 100, 50];  // color of smallest datum
  //var low = [151, 83, 34];   // color of largest datum
  var low = [120, 100, 50];   // color of largest datum

  // delta represents where the value sits between the min and max
  var delta = magnitude / delta;
  
  var color = [];
  for (var i = 0; i < 3; i++) {
      // calculate an integer color based on the delta
      color[i] = (high[i] - low[i]) * delta + low[i];
  }
  return color;	
}

function loadGeoJSON(datadict){
  
  data = datadict.geojson

  if ( $("#keep:checked").val() == "keep" ) {
    layer.clearLayers();
  }
  $("#overlay").show();

  var opacity = $("#slider-opacity").val();
  selectedCol = 0;

  var maxlat=data.properties.maxlat;
  var minlat=data.properties.minlat;
  var maxlon=data.properties.maxlon;
  var minlon=data.properties.minlon;
  var columns=data.properties.columns.split(',');
 
  var max = data.properties[columns[selectedCol+2]+"_max"];
  var min = data.properties[columns[selectedCol+2]+"_min"];                    
  
  L.geoJSON(data, {
      style: function(feature){
          var color = getColor( feature.properties[ columns[selectedCol+2] ],max-min );
          return {
              color: 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)' ,
              ppacity: opacity/100
          };
      },
      onEachFeature: onEachFeature
  }).addTo(layer);

  var GLOBE_WIDTH = 256; // a constant in Google's map projection
  var west = minlon;
  var east = maxlon;
  var angle = east - west;
  if (angle < 0) {
      angle += 360;
  }
  
    // Display the columns name
  var options_str='<select class="ui-block-b" style="width:100%" name="columns" id="columns">'	
  options_str += '<option selected="selected" value="' + 1 + '">' + columns[selectedCol+2] + '</option>';
  for (var valind=3 ; valind < columns.length ; valind++ ) {
    options_str += '<option value="' + (valind-1) + '">' + columns[valind] + '</option>';
  }
  options_str += "</select>"
  document.getElementById("columnsDiv").innerHTML = options_str;

  // update scale controls
  document.getElementById("log-min").innerHTML=min;
  document.getElementById("log-max").innerHTML=max;
  $("#overlay").hide($("#log").innedHTML);

  map.fitBounds( L.latLngBounds( L.latLng(minlat,minlon),L.latLng(maxlat,maxlon)));
}

function updateItems(){
  var opacity = $("#slider-opacity").val();
  var delta
  if ( selectedCol != $("#columns").val() - 1 ){
      // chage data
      selectedCol = $("#columns").val() - 1;
      var columns = data.properties.columns.split(',');
      var max = data.properties[columns[selectedCol+2]+"_max"];
      var min = data.properties[columns[selectedCol+2]+"_min"];                            
      var delta = max - min 
      // update scale controls
      document.getElementById("log-min").innerHTML=min;
      document.getElementById("log-max").innerHTML=max;   
  } else {
      delta =  document.getElementById("log-max").innerHTML - document.getElementById("log-min").innerHTML ;
  }
  layer.clearLayers();
  L.geoJSON(mydata, {
          style: function(feature){
              var color = getColor( feature.properties[ columns[selectedCol+2] ],delta );
              return {
                  color: 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)' ,
                  opacity: opacity/100
              };
          },
          onEachFeature: onEachFeature
  }).addTo(layer);
}

/**********************/
/* FIREBASE Functions */        
/**********************/

// Signs-in 
function signIn() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}

// Signs-out 
function signOut() {

  if (contactInMap) { contactInMap.remove();}
  // Sign out of Firebase.
  firebase.auth().signOut();

  // Hide controls 
  var lu = document.getElementById('loggedUser');
  lu.setAttribute('hidden','true')
  document.getElementById('selectedMenu').innerHTML = ""
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!

    isUserRegistered(user)

    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPic.setAttribute('src',profilePicUrl);
    signOutButtonText.innerHTML="Sign-out: '"+userName+"'";;

    // Show user's profile and sign-out button.
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');

  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userPicElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
    signOutButtonElement.setAttribute('hidden','true');
  }
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

function isUserRegistered(user) {
  db.collection('users').doc(user.email).get().then( (docRef ) => {    
    // User is not registered ... 
    if ( ! docRef.data() ) {
      processUnregisteredUser(user);
    }else{
      processRegisteredUser(user); 
    }
  });
}

function populateControls( data ){
  console.log( data.geojson );
  // Populate controls based on Data received
  var countries = data.geojson['properties']['countries']
  var countriesArray = countries.split(',')
  for ( var c in countriesArray){
    document.getElementById('selectedMenu').innerHTML += "<option value=" + countriesArray[c] + ">" + countriesArray[c] +"</option>";
  }
  document.getElementById("selectedMenu").selectedIndex = "1";
  document.getElementById("selectedMenu").setAttribute('selected','true')
}

function getPublicData(){
  var countries = functions.httpsCallable('getCountriesPublic');
  countries().then(function(result) {
   if ( result.data.status ){
      console.log("there was an error: " + result.data.error.details   )
   } else {
    
    // populate controls 
    populateControls(result.data)
   
    //load geojson data into map
    loadGeoJSON(result.data)

    // set Items Visible  
    var lu = document.getElementById('loggedUser'); 
    lu.removeAttribute('hidden')  
   }
    var overlay = document.getElementById('overlay'); 
    overlay.setAttribute('hidden','true')
  });
}

function processRegisteredUser(user){  
  // visual effects
  var overlay = document.getElementById('overlay'); 
  overlay.removeAttribute('hidden'); 
  // Load only the public countries 
  getPublicData()
}

function processUnregisteredUser(user) {
  console.log("unregistered user:" + user.email)
  // add the contact message
  contactInMap = L.control.contact({ position: 'topright' }).addTo(map);
  // visual effects
  var overlay = document.getElementById('overlay'); 
  overlay.removeAttribute('hidden'); 
  // Load only the public countries 
  getPublicData()
}

