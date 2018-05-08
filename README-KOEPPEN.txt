
This Directory contains the files and data used in the project MODIFIED KOEPPEN FOR ENOS
----------------------------------------------------------------------------------------

FILES:
------

- Html/koeppen.htm : 

This is the engine of the web page that shows the map. It is actually the html code that is embedded into the Google Site Page that is been used as PoC

- Tools/createGeoJSONFromCSV.sh	: 

This is a script that translates the CSV file of data into GeoJSON needed for visualization

- Data/Original-CSV : 

This directory contains all the data files in CSV format. This files are provided by Lino Naranjo and need to be processed throught the script 'createGeoJSONFromCSV.sh' to be read in the web page

- Data/Ready-JS : 
 
This directory contains all the data files that has been processed and are ready to be used in the visualization web. These files are generated from the ones in 'Original-CSV' using the tool 'createGeoJSONFromCSV.sh'


The PoC:
--------

The PoC can be viewed in the following URL:  

	https://sites.google.com/site/modkoeppen

The PoC is made using google sites and is ready to be rendered in all kind of devices. The code that runs this web is the one in 'Html/koeppen.htm'. The google sites interface is used only to control the very basic look and feel. All the logic is contained in the mentioned htm file.

The current solution is the more basic one: each point in the csv file (lat,lon) is shown in the map with a circle of a color which matches the linear scale 0 to 3 (green to red). Future solutions may include the addition of overlay layers containing a grid where each point in the map (lat,lon) will be represented as a square tile. 

We have made the system flexible and opened to future upgrades. The original data CSV files may contain any number of columns, so we can add any additional information to a specific point that could be used in the map in the future.
There are only 2 columns that MUST exist in the file: "lon" and "lat". This columns obviously defines a point in the map and without this columns the data makes no sense. The rest of columns are optional and may contain as many columns as data we want to add to a point. So far only the column named "RR" is displayed in the map

How to view specific data:
--------------------------

Once the orginal data is processed by the script 'createGeoJSONFromCSV.sh' and moved into the directory 'Data/Ready-JS', get the link to share that file ( remember it is all stored in google drive ),  usually something like this:

https://drive.google.com/open?id=10VUCs3Dt4k1tsLLjH0MZACz4ZO5P62fT

copy the file id, in this case is 10VUCs3Dt4k1tsLLjH0MZACz4ZO5P62fT

and in the file 'koeppen.htm' manually change the line:

script.src = 'https://drive.google.com/uc?export=download&id=10VUCs3Dt4k1tsLLjH0MZACz4ZO5P62fT';

replacing the id= by the id of the file we want to visualize


IMPORTANT NOTE:
---------------

I have encountered the following problems:

1.- 

the CVS files must be in the following format: field separator has to be ';' instead of ',' 
Do not use ',' in decimals, use '.' instead

example of file:
	
lon;lat;R;RR
-92.306;14.5544;0.333333333;1
-92.306;14.5592;0.333333333;1
-92.3012;14.5544;0.333333333;1
-92.3012;14.5592;0.333333333;1
-92.2964;14.5448;0.333333333;1
-92.2964;14.5496;0.333333333;1



2.- 

The CSV files were generated in a Windows machine apparently which adds some hidden characters. To be able to process the original files we must run the 'dos2unix' utility first


3.- 

Clean up the original files first. That means to remove all the rows that contains no data (usually because those points are outside the limits where there is data) 
Empty rows would look like this:

-92.3108;13.7;;
-92.3108;13.7048;;
-92.3108;13.7096;;
-92.3108;13.7144;;
-92.3108;13.7192;;


wher only 'lon' and 'lat' exist.

The comand to clean up the files would be:

cat file.csv | grep -v ";;" > cleanedupFile.csv 

the cleanedupFile is the one to be used to create the Ready-JS file.
