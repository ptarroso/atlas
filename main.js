/* 
 | Species Atlas webpage 
 | 
 | Provides a simple map interface for showing species observation data in a 
 | user defined grid. It displays individual species gridded observations and
 | calculates richness maps per class on the fly. Allows several configurations
 | including additional information for each class, and aditional circle points
 | for each species observations. Read the README.md file for more information 
 | on formats and configurations.
 |
 | Author: Pedro Tarroso (11/2021)
 | Version: 1.0
 | Licence: GPL3
*/


//----> GENERAL CONFIGURATION VARIABLES

const title = "Species Atlas example"
const footer = "Some text for the bottom of the page that allows some <b> html notation </b>"

// definitions for single observation
const obsDefinitions = {"fill": "#3e8ed0aa", "stroke": "#ffffff75", "width": 3};

// Definitions for styles of extra points (circle symbols only). "name" is the
// value associated with species observations (no more than 3 levels)
// The order of the symbols is used for plotting.
extraDefinitions = {
    "Class1": [{
            "name": 2,
            "radius": 5,
            "fill": "#e09f3e",
            "text": "Some label here"
        },
        {
            "name": 3,
            "radius": 4,
            "fill": "#9e2a2b",
            "text": "Another label"
        }, 
        {
            "name": 4,
            "radius": 2,
            "fill": "#300505",
            "text": "Last label by radius order"
        }
    ]
};



//----> CLASSES AND FUNCTIONS


class QuadsData {
    // Stores and retrieves quadricule references and values for a single entity
    // (species or classes)
    constructor(species, quads, values) {
        this.name = species
        this.quads = quads;
        this.values = values;
    };
    value(quad) {
        if (this.quadExists(quad)) {
            var i = this.quads.indexOf(quad);
            return this.values[i];
        };
        return null;
    };
    quadExists(quad) {
        return this.quads.includes(quad);
    };
    uniqueValues() {
        // unique values among all quadricules
        let val = this.values.flat();
        return val.filter((v,i, s) => s.indexOf(v) === i).sort();
    };
    hasMultipleValues() {
        // returns true if more than 1 value is present among all quadricules
        return this.uniqueValues().length > 1
    };
}

var loadJSON = function(callback) {
    // Loads JSON data from file synchronously
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'species.json', false);
    xobj.onreadystatechange = function() {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

var clearDropDown = function(dd) {
    dd.length = 0;
};

var isEnabledDropDown = function(dd) {
    return (dd.hasAttribute("disabled"))
};

var disableDropdown = function(dd) {
    dd.selectedIndex = 0
    clearDropDown(dd);
    dd.setAttribute('disabled', '');
};

var enableDropDown = function(dd) {
    dd.removeAttribute("disabled");
};

var populateDropDown = function(dd, data) {
    // populates dropdown with array in data. Data must have a 'name' attribute
    dd.length = 0;

    let option;
    option = document.createElement('option');
    option.text = "Select Option";
    option.setAttribute('selected', true);
    option.setAttribute('disabled', '');
    dd.add(option);

    for (let i = 0; i < data.length; i++) {
        option = document.createElement('option');
        option.text = data[i].name;
        option.value = data[i].name;
        dd.add(option);
    }
};

var selectBut = function(b) {
    b.setAttribute("class", "button is-info")
};

var unselectBut = function(b) {
    b.setAttribute("class", "button is-info is-outlined")
};

var getCentroid = function(crd) {
    // get the centroid coordinate from an array of coordinates array.
    var x = crd.map(function(x) {
        return x[0]
    }).slice(0, -1)
    var y = crd.map(function(x) {
        return x[1]
    }).slice(0, -1)
    var centroid = [x.reduce((a, b) => a + b, 0) / x.length,
        y.reduce((a, b) => a + b, 0) / y.length
    ]
    return centroid
};

var extraDistribStyles = function(feature, resolution) {
    // Creates styles based on class quadricule values
    var cl = classDropDown.value;
    var styles = [];
    if (Object.keys(extraDefinitions).includes(cl)) {
        var coordinates = getCentroid(feature.getGeometry().getCoordinates()[0]);
        var id = feature.get('grdref');
        var values = spQuads.value(id);
        // Loop over extraDefinitions to ensure plotting order
        for (let i = 0; i < extraDefinitions[cl].length; i++) {
            var def = extraDefinitions[cl][i]
            if (values.includes(def.name)) {
                var radius = 5000 / resolution * def.radius
                var fill = def.fill
                styles.push(new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: radius,
                        fill: new ol.style.Fill({
                            color: fill
                        })
                    }),
                    geometry: new ol.geom.Point(coordinates)
                }));
            };
        };
        /// Styles must be sorted on radius
        if (styles.length > 0) {
            styles.sort((a, b) => b.getImage().getRadius() - a.getImage().getRadius());
        };
    };
    return styles;
};

var styleSpecies = function(feature, resolution) {
    // Provides a style (light blue fill )for the grid if species is present in
    // the current quad. Otherwise, grid square is transparent.
    var styles = []; //new ol.style.Style({});
    var id = feature.get('grdref');
    if (id && spQuads.quadExists(id)) {
        styles.push(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: obsDefinitions.stroke,
                width: obsDefinitions.width
            }),
            fill: new ol.style.Fill({
                color: obsDefinitions.fill
            })
        }));
        styles.push(...extraDistribStyles(feature, resolution));
    }
    return styles;
};

var colorGrad = function(val, min, max) {
    // The simple color gradient with 5 levels for continuous values. It adds 
    // color breaks at [0, 20[, [20, 40[, [40, 60[, [60, 80[, [80, 100] percent
    // intervals of data range.
    let color = "#DAA17Eaa";
    let v = (val - min) / (max - min);
    if (v >= 0.8) {
        color = "#540804aa";
    } else if (v >= 0.6) {
        color = "#AD1F23aa";
    } else if (v >= 0.4) {
        color = "#D94F45aa";
    } else if (v >= 0.2) {
        color = "#E98449aa";
    }
    return (color)
};

var calcRich = function(cl) {
    // Calculates richness value for a class 'cl' in spData
    var r = {};
    let spList = spData.find(e => e.name === cl).species;
    let quadList;
    for (let i = 0; i < spList.length; i++) {
        quadList = spList[i].quad;
        for (let j = 0; j < quadList.length; j++) {
            if (!Object.keys(r).includes(quadList[j])) {
                r[quadList[j]] = 0;
            }
            r[quadList[j]]++;
        }
    }
    return (r)
}

var richStyle = function(feature, rich) {
    // Styles richness values based on color gradient between max and min found.
    var style = new ol.style.Style({});
    let id = feature.get('grdref');
    let mx = Math.max(...Object.values(rich));
    let mn = Math.min(...Object.values(rich));
    if (id && Object.keys(rich).includes(id)) {
        style = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: "#ffffff75",
                width: 3
            }),
            fill: new ol.style.Fill({
                color: colorGrad(rich[id], mn, mx)
            })
        });
    };
    return (style)
};

var clearLegend = function() {
    // Clears the legend box
    var cv = document.getElementById("legendcanvas");
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
};

var richLegend = function(rich) {
    // adds a simple canvas based legend
    var cv = document.getElementById("legendcanvas");
    var ctx = cv.getContext('2d');
    const mx = Math.max(...Object.values(curRich));
    const mn = Math.min(...Object.values(curRich));
    const range = mx - mn;
    var start = mn;
    for (i = 0.2; i <= 1; i += 0.2) {
        end = Math.round(mn + i * range, 0);
        let col = colorGrad(start, mn, mx);
        ctx.fillStyle = col;
        let x = 10 + 500 * (i - 0.2) * 0.95;
        ctx.fillRect(x, 5, 25, 25);
        ctx.fillStyle = "black";
        ctx.fillText(start + " - " + end, x + 30, 23);
        start = end + 1;
    }
};

var observationLegend = function() {
    // adds legend to simple observation square
    var cv = document.getElementById("legendcanvas");
    var ctx = cv.getContext('2d');
    ctx.beginPath();
    ctx.rect(5, 5, 35, 35);
    ctx.fillStyle = obsDefinitions.fill;
    ctx.fill();
    ctx.lineWidth = obsDefinitions.width;
    ctx.strokeStyle = obsDefinitions.stroke;
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.fillText("Observation", 45, 26);
};

var extraLegend = function(values) {
    // adds a simple legend for extra points based on the 'values'
    var cl = classDropDown.value;
    if (Object.keys(extraDefinitions).includes(cl) && spQuads.hasMultipleValues()) {
        var cv = document.getElementById("legendcanvas");
        var ctx = cv.getContext('2d');
        // Loop over extraDefinitions to ensure plotting order 
        for (let i = 0; i < extraDefinitions[cl].length; i++) {
            var def = extraDefinitions[cl][i]
            if (values.includes(def.name)) {
                let r = def.radius * 2
                ctx.beginPath();
                ctx.arc(150, 23, r, 0, 2 * Math.PI, false);
                ctx.fillStyle = def.fill;
                ctx.fill();
                ctx.lineWidth = 0;
                ctx.strokeStyle = def.fill;
                ctx.stroke();
                ctx.fillStyle = "black";
                ctx.fillText(def.text, 185, i * 15 + 14);
                ctx.beginPath();
                ctx.lineWidth = 1;
                let a = (i / (values.length - 1) - 0.5) / 2 * Math.PI;
                ctx.moveTo(150 + Math.cos(a) * r * 0.8, 23 + Math.sin(a) * r);
                ctx.lineTo(175, i * 15 + 10);
                ctx.lineTo(184, i * 15 + 10);
                ctx.strokeStyle = "black";
                ctx.stroke();
            }
        };
    };
};

var showOverlayNote = function(title, body) {
    // uses the overlayNote id (a modal container) to display information
    var ovlNote = document.getElementById("overlayNote");
    var ovlTitle = ovlNote.getElementsByClassName("modal-card-title")[0];
    var ovlBody = ovlNote.getElementsByClassName("modal-card-body")[0];
    var closeBut = ovlNote.getElementsByClassName("button")[0];
    ovlTitle.textContent = title;
    ovlBody.innerHTML = body;
    ovlBody.scrollTop = 0;
    closeBut.addEventListener('click', function() {
        ovlNote.setAttribute("class", "modal");
    })
    ovlNote.setAttribute("class", "modal is-active");    
};

var getHtmlContent = function(href) {
    // gets local html content
    var html = new XMLHttpRequest();
    html.open("get", href, false);
    html.send();
    return html.responseText
};

var addInfo = function(infohtml) {
    // adds info to "aditional info" container
    var info = document.getElementById("infomessage");
    info.innerHTML = infohtml
    // if 'infohtml' has 'overlaynote' class elements, treats element with a
    // special overlay display in the same webpage rather than a typical link.
    var popElements = document.getElementsByClassName("overlaynote");
    for (let i=0; i < popElements.length; i++) {
        let href = popElements[i].getAttribute("href");
        let title = popElements[i].text.toUpperCase();
        let txt = getHtmlContent(href);
        popElements[i].removeAttribute("href");
        popElements[i].addEventListener('click', function() {
            showOverlayNote(title, txt);
        })
    };
};

//----> DISPLAY ELEMENTS AND EVENT LISTNERS

// Get Elements
const distCheck = document.getElementById("distributions");
const richCheck = document.getElementById("richness");
const classDropDown = document.getElementById("class");
const speciesDropDown = document.getElementById("species");
const containerPopup = document.getElementById('popup');
const contentPopup = document.getElementById('popup-content');
const closePopup = document.getElementById('popup-closer');


// Set title and footer
document.getElementsByTagName("title")[0].text = title;
document.getElementById("title").innerHTML = title;
document.getElementById("footer").innerHTML = footer;

// Event Listeners
distCheck.addEventListener("click", function() {
    // set buttons style
    selectBut(distCheck);
    unselectBut(richCheck);
    // populate class DD
    enableDropDown(classDropDown);
    populateDropDown(classDropDown, spData);
    // clear species DD
    clearDropDown(speciesDropDown);
    //empty grid
    grid.setStyle(f => null);
    enableDropDown(speciesDropDown);
    // Clear any legend or info
    clearLegend();
    addInfo("");
    // select maptype
    mapType = 1;

});

richCheck.addEventListener("click", function() {
    // set buttons style
    selectBut(richCheck);
    unselectBut(distCheck);
    // populate class DD
    enableDropDown(classDropDown);
    populateDropDown(classDropDown, spData);
    //empty grid
    grid.setStyle(f => null);
    // disable species button
    disableDropdown(speciesDropDown);
    // Clear any legend or info
    clearLegend();
    addInfo("");
    // select maptype
    mapType = 2;
});

classDropDown.addEventListener("change", function() {
    let dt = spData.filter(e => e.name == classDropDown.value)[0];
    grid.setStyle(f => null)
    clearLegend();
    if (mapType == 1) {
        // Species distribution map: speciesDropdown takes care of adding map
        populateDropDown(speciesDropDown, dt["species"]);
    } else if (mapType == 2) {
        // Calculate richeness
        curRich = calcRich(classDropDown.value);
        // Prepare legend
        richLegend(curRich);
        // Style grid with richness
        grid.setStyle(f => richStyle(f, curRich));
    } else {
        // Nothing: empty grid layer
        grid.setStyle(f => null);
    }
    addInfo(dt["info"]);
});

speciesDropDown.addEventListener("change", function() {
    var dt = spData.filter(e => e.name == classDropDown.value)[0]["species"];
    var q = dt.filter(e => e.name == speciesDropDown.value)[0]["quad"];
    var v = dt.filter(e => e.name == speciesDropDown.value)[0]["value"];
    spQuads = new QuadsData(speciesDropDown.value, q, v);
    grid.setStyle(styleSpecies);
    clearLegend();
    observationLegend();
    extraLegend([2, 4, 3]);
});

//----> PREPARE BASE MAP DISPLAY

// Open grid layer
const grid = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: './grid.geojson',
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:4326',
    }),
    style: null
});

// Create overlay for popup
const overlay = new ol.Overlay({
    element: containerPopup,
    autoPan: false
});

// activate close button of popup
closePopup.onclick = function() {
    overlay.setPosition(undefined);
    closePopup.blur();
    return false;
};

// Needed variables
var spData = {};
var mapType = null; // 1 (distributions) or 2 (richness)
var curRich = null // store current richness to avoid recalculation
loadJSON(function(response) {
    spData = JSON.parse(response);
});
var spQuads = null;

// Create base map
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    overlays: [overlay],
    view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]),
        zoom: 5
    })
});

// Add 'invisible' grid
map.addLayer(grid);

// Recenter map to grid
grid.getSource().once("change", function(e) {
    map.getView().fit(grid.getSource().getExtent());
    });

// add quadricule information on click when mapping richness
map.on('singleclick', function(evt) {
    if (mapType == 2) {
        const coordinate = evt.coordinate;
        let f = map.getFeaturesAtPixel(evt.pixel)[0]; // only grid layer is present
        let r = curRich[f.get("grdref")];
        contentPopup.innerHTML = r + " species";
        overlay.setPosition(coordinate);
    };
});
