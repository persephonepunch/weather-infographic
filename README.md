#Weather Infographic
Data driven Infographic for displaying weather information for select cities around the world.

##Introduction
This project is an attempt to build a bare bones, data driven infographic to portray the weather conditions of a few cities across the world. It is a basic infographic dashboard which is data driven and supports user interactivity. It captures weather data from openweathermap.org and visualizes that with a simple interface on top of world map.

##Steps for hosting

###Prerequisites
a) You should have a google developer API access. Update [server.js](server.js) file with API key in line 11.

b)You should have a PubNub account .Update the PubNub publish and subscribe key in [server.js](server.js) line 20,21 & in [config.js](public/config.js), Line 1 & 2

c) You should have a API key for http://openweathermap.org/ and update that in [server.js](server.js) in line 13 

d) You should have a Mapbox api account and place the api key in [config.js](public/config.js) , Line 3. 

e) You must have Node.js installed on the server where the application will be installed.

###Steps for installing application server
1) Clone the repository by performing the following git command : 'git clone https://github.com/shyampurk/weather-infographic.git'

2) Change directory to weather-infographic : 'cd weather-infographic'

3) Configure the server.js and config.js with the api keys as per the prerequisite section above 

4) Run the npm package install command to install all dependencies : 'npm install'

5) Start the server : 'node server.js'. Optionally, you can run the server under [forever](https://www.npmjs.com/package/forever) to ensure continuous operation.

##Working
1) Open the browser and type http://IP-ADDRESS:3000 , where IP-ADDRES can be localhost ( if testing locally) or the actual IP address of the server (if testing remotely).

2) The webpage will open and display a world map.

3) The map will be overlayed with icons that will display the current weather condition for 10  cities across the world.

4) Click on any icon for any city to get the current measured value of weather parameters for that city.

5) Keep the webpage open to see the changes in weather condition, temperature, humidity or day/night, over a period of time.  


