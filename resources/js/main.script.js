var map;

// Opens A Modal With Location Details When a Map Marker is Clicked
function openDetailsModal(data) {
    $.ajax({
        url: '/details/modal',
        type: 'POST',
        data: {
            modal_data: JSON.stringify(data),
        },
        success: (result) => {
            $(".modal-content").html(result);
        },
    });
    $("#aModal").modal('toggle');
};

// Fetches Route+Weather Results
function getResults() {
    $.ajax({
        url: '/details/weather',
        type: 'POST',
        data: {
            start: $('#start').val(),
            waypoints: $('#waypoints').val(),
            destination: $('#destination').val(),
            travelDate: $('#datetimepicker1').val()
        },
        success: (result) => {
            $("#errors").html('');
            initMap(result);
        },
        error: (e) => {
            $("#errors").html(e.responseJSON.join('\n'));
            $("#myForm").show();
        }
    });
};

// Initializes a Mapquest Map with Markers and Routes
function initMap(Weather) {
    L.mapquest.key = 'AGnIlvdB11GtXAqdMt6VFmHEkIVe76dR'; // LG: Is there a way to hide this key from the users?
    let directions = L.mapquest.directions();

    // Create a Route
    directions.route({
        start: Weather[0].city,
        waypoints: Weather.slice(1, Weather.length - 1).map((item) => item.city),
        end: Weather[Weather.length - 1].city
    }, (err, response) => {
        // Remove  the previous map
        if (map != undefined) {
            map.remove();
        }
        // Initialize a new map
        map = L.mapquest.map('map', {
            center: [0, 0],
            layers: L.mapquest.tileLayer('light'),
            zoom: 8
        });

        // Creating Layer With Markers
        let DirectionsLayerWithCustomMarkers = L.mapquest.DirectionsLayer.extend({

            // Starting Marker with onClick method to open modal
            createStartMarker: (location, stopNumber) => {
                return L.marker(location.latLng, {
                        icon: L.mapquest.icons.marker({
                            primaryColor: '#22407F',
                            secondaryColor: '#3B5998',
                            shadow: true,
                            size: 'md',
                            symbol: stopNumber.toString()
                        })
                    })
                    .bindTooltip(Math.round(Weather[0].temp)
                        .toString() + '&#176; C at arrival. Click for details.')
                    .on('click', (e) => openDetailsModal(Weather[0]));
            },

            // All Waypoint Markers with onClick method to open modal
            createWaypointMarker: (location, stopNumber) => {
                return L.marker(location.latLng, {
                        icon: L.mapquest.icons.marker({
                            primaryColor: '#22407F',
                            secondaryColor: '#3B5998',
                            shadow: true,
                            size: 'md',
                            symbol: stopNumber.toString()
                        })
                    })
                    .bindTooltip(Math.round(Weather[stopNumber - 1].temp)
                        .toString() + '&#176; C at arrival. Click for details.')
                    .on('click', (e) => openDetailsModal(Weather[
                        stopNumber - 1]));
            },

            // End Marker with onClick method to open modal
            createEndMarker: (location, stopNumber) => {
                return L.marker(location.latLng, {
                        icon: L.mapquest.icons.marker({
                            primaryColor: '#22407F',
                            secondaryColor: '#3B5998',
                            shadow: true,
                            size: 'md',
                            symbol: stopNumber.toString()
                        })
                    })
                    .bindTooltip(Math.round(Weather[Weather
                            .length - 1].temp)
                        .toString() + '&#176; C at arrival. Click for details.')
                    .on('click', (e) => openDetailsModal(Weather[Weather
                        .length - 1]));
            }
        });

        // Add the Route Layer to the map
        let directionsLayer = new DirectionsLayerWithCustomMarkers({
            directionsResponse: response
        }).addTo(map);
    });
}