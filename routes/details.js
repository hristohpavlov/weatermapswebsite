const express = require('express');
const unirest = require("unirest");
const path = require("path");
const moment = require("moment-timezone");
const {
    check,
    validationResult
} = require('express-validator');
const router = express.Router();
const apiKey = '878951e1edmsh1667d4656ee2f6ap169e27jsn8fa8dfce828b';
var db = require('../bin/database');

/*
 * Routes for the DETAILS page
 */

router.get('/', (req, res) => {
    console.log('[GET] Request for DETAILS recieved');
    res.locals.query = JSON.stringify(req.query);
    res.render('main', {
        pageUrl: 'details',
        User: req.session.User
    });
});

router.post('/weather', [
    check('start', 'Starting City is required!').not().isEmpty(),
    check('start', 'Starting City is required!').not().isEmpty(),
    check('travelDate').not().isEmpty().withMessage('Travel Date is required!')
    .custom((val) => {
        return moment(val, "MM/DD/YYYY h:mm A", true).isValid() ? true : Promise.reject('Travel Date is not an accepted/valid date!');
    })
], async (req, res) => {
    console.log('[POST] Request for WEATHER recieved');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(500).send(errors.errors.map(error => error.msg));
    } else {
        let route = [{
            "t": req.body.start
        }];
        if (req.body.waypoints) {
          req.body.waypoints.split(',').forEach(value => {
            if (value.length > 0) {
              route.push({
                "t": value.trim()
              });
            }
          });
        }
        route.push({
            "t": req.body.destination
        });

        const distapi = unirest("GET", "https://distanceto.p.rapidapi.com/get").headers({
            "x-rapidapi-host": "distanceto.p.rapidapi.com",
            "x-rapidapi-key": apiKey
        });
        const weatherQuery = (lat, lon, time, success, failure) => unirest("GET", "https://dark-sky.p.rapidapi.com/" + lat + "," + lon + "," + time).headers({
            "x-rapidapi-host": "dark-sky.p.rapidapi.com",
            "x-rapidapi-key": apiKey
        }).query({
            "lang": "en",
            "units": "si",
            "exclude": "hourly,minutely,daily,alerts,flags"
        }).then((res) => success(res)).catch((e) => failure(e));

        var journeySteps = await distapi.query({
            "car": "true",
            "foot": "false",
            "route": JSON.stringify(route) // TODO: Text/Dropdown Field Values
        }).then(async (res) => {
            let journeySteps = [];
            let time = new Date(req.body.travelDate).getTime(); // Convert Date To Unix Milliseconds Timestamp  

            for (let index = 0; index < res.body.points.length; index++) {
                if (index > 0) time += res.body.steps[index - 1].distance.car.duration * 1000;

                let weatherInfo = await weatherQuery(res.body.points[index].properties.geocode.lat,
                    res.body.points[index].properties.geocode.lng,
                    moment(time).format("YYYY-MM-DDTHH:mm:ssZ"),
                    (res) => [res.body.currently.temperature, res.body.currently.humidity, res.body.currently.icon],
                    (e) => console.log('[ERROR] Weather Query Failed: ' + e));

                journeySteps.push({
                    city: res.body.points[index].properties.geocode.name,
                    location: {
                        lat: res.body.points[index].properties.geocode.lat,
                        lon: res.body.points[index].properties.geocode.lng
                    },
                    timeOfArrival: time,
                    temp: weatherInfo[0],
                    humidity: weatherInfo[1],
                    icon: weatherInfo[2],
                });
            };
            
            if (req.session.User) {
              req.session.User.searchHistory.push({
                'route': route,
                'startTime': req.body.travelDate
              });
              db.get().collection('users').updateOne({
                  'email': req.session.User.email
              }, {
                  $set: {
                      'searchHistory': req.session.User.searchHistory
                  }
              }, (e, result) => {
                  if (e) throw e;
              });
            }

            return journeySteps;
        }).catch((e) => {
            console.log('[ERROR] Distance Query Failed: ' + e);
        });

        res.status(200).send(journeySteps);
    }
});

router.post('/modal', (req, res) => {
    console.log('[POST] Request for DETAILS MODAL recieved');
    let data = JSON.parse(req.body.modal_data);
    data.timeOfArrival = moment(data.timeOfArrival).format("h:mm A DD/MM/YYYY");
    res.status(200).render(path.join(__dirname, '../', 'html', 'includes', 'modals', 'modal-details.ejs'), {
        Weather: data
    });
});

module.exports = router;