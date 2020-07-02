# Weather Maps - CM2104 Group Project Repository
*Weather Maps is a platform that provides weather data ahead of time for specific cities along a specified journey.*

### Team Members:
* Hristo Pavlov (hristohpavlov,hrpavlov)
* Omar Kishk (OkishkOTI)
* Georgi Ognyanov (Dice2thesox)
* Lyuben Gyurov (reidterror)

# Running Weather Maps Locally

1. Clone the repo:
	```
	git clone https://github.com/CM2104-DynamicWebDevelopment/cm2104-group-web-app-qgodka.git
	```

2. Download the dependencies:
	```
	npm install
	```

3. Start a Local Mongodb Instance.
	```
	mongod --dbpath <your-db-path>
	```
	*Check the database with `mongo weather-maps-test` in the terminal*

4. Run the web server.
	```
	npm start
	```

4. Visit the site at http://localhost:8080
