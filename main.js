
// Add footer date
setDate()

// set global variables for header, map container, and footer
const header = document.querySelector("header");
const mapContainer = document.querySelector("#map");
const footer = document.querySelector("footer");

// set map height to fill window
mapContainer.style.height =
    window.innerHeight - header.offsetHeight - footer.offsetHeight + "px";

// initial Leaflet map options
const options = {
    zoomSnap: 0.1,
    center: [40, -90],
    zoom: 4,
    zoomControl: false,
};
// create Leaflet map and apply options
const map = L.map("map", options);
new L.control.zoom({ position: "bottomright" }).addTo(map);

// request a basemap tile layer and add to the map

var CartoDB_PositronNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
});
CartoDB_PositronNoLabels.addTo(map);

// set global variables for map layer,
// mapped attribute, and normalizing attribute
let attributeValue = ">=25_HS_GRAD_EQUIV";
const normValue = ">=25";

async function getData() {

    // Make the call to get all county data
    const counties = await fetch("data/us_counties.geojson");
    // Code will pause here until response is received

    if (!counties.ok) {
        throw new Error(`HTTP error! status: ${counties.status}`);
    }
    // Make the call to get the response as JSON
    data = await counties.json();
    // Code will pause here until 'data' is available


    drawLayer(data);


    // Make the call to get all ARC county data
    const arcCounties = fetch("data/arc_counties.geojson")
        // after it is returned...
        .then(function (response) {
            // Parse the JSON into a useable format, then return it
            return response.json();
        })
        // The returned response is now data in a new then method
        .then(function (data) {
            // This is the JSON from our response
            // call draw map and send data as parameter
            drawMap(data);
        })
        // If there is an error, log it to the console
        .catch(function (error) {
            console.log(error);
        });
}

getData();

// Example of keeping your page fresh
function setDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    const footerText = document.querySelector("footer p");
    footerText.innerHTML = `${month}, ${year}`;
    const offCanvasDate = document.getElementById('offCanvasDate');
    offCanvasDate.innerHTML = `${month}, ${year}`;
}

function drawMap(data) {
    // create Leaflet data layer and add to map
    const arcCounties = L.geoJson(data, {
        // style Counties with initial default path options
        style: function (feature) {
            return {
                color: "black",
                weight: 0.25,
                fillOpacity: 1,
                fillColor: "#1f78b4"
            };
        },
        // add hover/touch functionality to each feature layer
        onEachFeature: function (feature, layer) {
            // when mousing over a layer
            layer.on("mouseover", function () {
                // change the stroke color and bring that element to the front
                layer
                    .setStyle({
                        color: "orange",
                        weight: 0.5,
                    })
                    .bringToFront();
            });

            // on mousing off layer
            layer.on("mouseout", function () {
                // reset the layer style to its original stroke color
                layer.setStyle({
                    color: "black",
                    weight: 0.25,
                });
            });
        },
    }).addTo(map);

    // fit the map's bounds and zoom level to the lower 48
    map.fitBounds(arcCounties.getBounds(), {
        padding: [18, 18], // add padding around counties
        animation: false, // disable animating the zoom
    });

    updateMap(arcCounties); // draw the map

    addUi(arcCounties); // add the UI controls


}

function drawLayer(data) {

    const counties = L.geoJson(data, {
        style: function (feature) {
            return {
                color: "black",
                // Make line weight larger than the county outline
                weight: 0.1,
                fillOpacity: 0,
                // This property allows us control interactivity of layer
                interactive: false,
            };
        }
    }).addTo(map);
}

// Get class breaks in data
function getClassBreaks(arcCounties) {
    // create empty Array for storing values
    const values = [];

    // loop through all the arcCounties
    arcCounties.eachLayer(function (layer) {
        let value =
            layer.feature.properties[attributeValue] /
            layer.feature.properties[normValue];

        if (value && value > 0) {
            values.push(value); // push the validated normalized value for each layer into the Array
        }

    });

    // determine similar clusters
    const clusters = ss.ckmeans(values, 5);

    // create an array of the lowest value within each cluster
    const breaks = clusters.map(function (cluster) {
        return [cluster[0], cluster.pop()];
    });

    //return array of arrays, e.g., [[0.24,0.25], [0.26, 0.37], etc]
    return breaks;
}

// Function receives target value and array of breaks, uses conditional structure to determine value's color based on breaks ranges, and returns corresponding color.
function getColor(d, breaks) {
    return d >= breaks[4][0] ? '#006d2c' :
        d >= breaks[3][0] ? '#31a354' :
            d >= breaks[2][0] ? '#74c476' :
                d >= breaks[1][0] ? '#bae4b3' :
                    d >= breaks[0][0] ? '#edf8e9' :
                        '#D3D3D3'; // 'No data' color
} // end getColor

function updateMap(arcCounties) {

    // get the class breaks for the current data attribute
    const breaks = getClassBreaks(arcCounties);

    // loop through each county layer to update the color and tooltip info
    arcCounties.eachLayer(function (layer) {
        const props = layer.feature.properties;

        // set the fill color of layer based on its normalized data value
        layer.setStyle({
            fillColor: getColor(props[attributeValue] / props[normValue], breaks),
        });

        // assemble string sequence of info for tooltip (end line break with + operator)
        let tooltipInfo = `<b>${props["NAME"]} County</b></br>
    ${((props[attributeValue] / props[normValue]) * 100).toFixed(0)}%`;

        // bind a tooltip to layer with county-specific information
        layer.bindTooltip(tooltipInfo, {
            // sticky property so tooltip follows the mouse
            sticky: true,
        });
    });

    // update the legend with the current data attribute information
    addLegend(breaks, arcCounties);
}

// Add legend to map
function addLegend(breaks, arcCounties) {

    // create a new Leaflet control object, and position it top left
    const legendControl = L.control({ position: "topleft" });

    // when the legend is added to the map
    legendControl.onAdd = function () {
        // select a div element with an id attribute of legend
        const legend = L.DomUtil.get("legend");

        // disable scroll and click/touch on map when on legend
        L.DomEvent.disableScrollPropagation(legend);
        L.DomEvent.disableClickPropagation(legend);

        // return the selection to the method
        return legend;
    };

    // add the empty legend div to the map
    legendControl.addTo(map);

    // Adds initial legend's inner HTML
    updateLegend(arcCounties);
}

function addUi(arcCounties) {
    // create the slider control
    var selectControl = L.control({ position: "topright" });

    // when control is added
    selectControl.onAdd = function () {
        // get the element with id attribute of ui-controls
        return L.DomUtil.get("dropdown-ui");
    };
    // add the control to the map
    selectControl.addTo(map);

    const dropdown = document.querySelector('#dropdown-ui select')
    dropdown.addEventListener('change', function (e) {

        // see what this event captures
        var optionHtml = e.target.selectedOptions[0].text;

        // get the value of the selected option
        attributeValue = e.target.value;

        // update the map
        updateMap(arcCounties);

        // update the legend
        updateLegend(arcCounties, optionHtml);

    });
}

function updateLegend(arcCounties, optionHtml) {
    // get the class breaks for the current data attribute
    const breaks = getClassBreaks(arcCounties);

    // select the legend, add a title, begin an unordered list and assign to a variable
    const legend = document.querySelector("#legend")

    if (optionHtml) {
        legend.innerHTML = `<h2>Highest Level of Education</h2><h5>${optionHtml}</h5>`;
    } else {
        legend.innerHTML = `<h2>Highest Level of Education</h2><h5>HS Grad or Equivalent</h5>`;
    }


    // loop through the Array of classification break values
    for (let i = 0; i <= breaks.length - 1; i++) {
        let color = getColor(breaks[i][0], breaks);

        legend.innerHTML +=
            `<div class="d-flex flex-row justify-content-start">
          <span style="background:${color}"></span>
          <label>${(breaks[i][0] * 100).toFixed(0)} &mdash; 
          ${(breaks[i][1] * 100).toFixed(0)}%</label>
      </div>`
    }

}