let apiKey = "de4cd596a3675b54b7984438a796ad56";
let placeNamInput = document.getElementById("place-input");
let getWeatherBtn = document.getElementById("get-weather-btn");
let getYourWeatherBtn = document.getElementById("get-your-weather-btn");
let favouriteLocationsSection = document.getElementById("favourite-locations-section");
let lastLocationsSection = document.getElementById("last-locations-section");
let locationsSection = document.getElementById("locations-section");
let weatherSection = document.getElementById("weather-section");
let forecastsSection = document.getElementById("forecasts-section");
let forecastSection = document.getElementById("forecast-section");
let favouriteLocationsBtn = document.getElementById("favourite-locations-btn");
let darkModeBtn = document.getElementById("dark-mode-btn"); 

let lastLocations = JSON.parse(localStorage.getItem("lastLocations")) || [];
let favouriteLocations = JSON.parse(localStorage.getItem("favouriteLocations")) || [];
let lightMode = localStorage.getItem("lightMode") || "true";

let currentLat = 0;
let currentLon = 0;

let weatherData = {};
let forecastData = {};

const kelvinToCelciusConst = -273.15;

if(lastLocations.length !== 0) {
    lastLocationsSection.innerHTML = "<div>Last locations</div>";
}
lastLocations.forEach((element) => {
    let locationData = encodeURIComponent(JSON.stringify(element));
    lastLocationsSection.innerHTML += `
        <button class="last-location-btn" data-location="${locationData}">${element.name}, ${element.country}, ${element.state}</button>
    `;
});

if(favouriteLocations.length !== 0) {
    favouriteLocationsBtn.classList.remove("hide");
}

if(lightMode === "true") {
    darkModeBtn.innerText = "Dark Mode";
    setLightMode();
} else {
    darkModeBtn.innerText = "Light Mode";
    setDarkMode();
}

darkModeBtn.addEventListener('click', () => {
    if(darkModeBtn.innerText === "Dark Mode") {
        setDarkMode();
        localStorage.setItem("lightMode", "false");
    } else if(darkModeBtn.innerText === "Light Mode") {
        setLightMode();
        localStorage.setItem("lightMode", "true");
    }
});

favouriteLocationsBtn.addEventListener('click', () => {
    favouriteLocationsBtn.classList.add("hide");
    favouriteLocationsSection.innerHTML = "<div>Favourite Locations</div>";
    favouriteLocations.forEach((location) => {
        let locationData = encodeURIComponent(JSON.stringify(location));
        favouriteLocationsSection.innerHTML += `
        <button class="favourite-location-btn" data-location="${locationData}">${location.name}</button>
        `;
    });
});

favouriteLocationsSection.addEventListener('click', (event) => {
    if(event.target.classList.contains("favourite-location-btn")) {
        let locationData = JSON.parse(decodeURIComponent(event.target.getAttribute("data-location")));
        favouriteLocationsSection.innerHTML = "";
        lastLocationsSection.innerHTML = "";
        fetchWeatherData(locationData.name, locationData.lat, locationData.lon);
    }
});

lastLocationsSection.addEventListener('click', (event) => {
    if(event.target.classList.contains("last-location-btn")) {
        let locationData = JSON.parse(decodeURIComponent(event.target.getAttribute("data-location"))); 
        lastLocationsSection.innerHTML = "";
        currentLat = locationData.lat;
        currentLon = locationData.lon
        fetchWeatherData(event.target.innerText, currentLat, currentLon);
    }
});

getWeatherBtn.addEventListener('click', () => {
    lastLocationsSection.innerHTML = "";
    weatherSection.innerHTML = ""; 
   fetchWeatherLocations(); 
});

getYourWeatherBtn.addEventListener('click', () => {
    if(weatherSection.classList.contains("error-style")) {
        weatherSection.classList.remove("error-style");
    }
    weatherSection.innerHTML = ""; 
    if(navigator.geolcation) { 
        navigator.geolocation.getCurrentPosition(
         (position) => {
            currentLat = position.coords.latitude;
            currentLon = position.coords.longitude;
            fetchWeatherData("your location", currentLat, currentLon);
        },
         () => {
            weatherSection.innerHTML = "Unable to retrieve your location. Please make sure location services are enabled.";
            weatherSection.classList.add("error-style");
        })
    } else {
        weatherSection.innerHTML = "Geolocation is not supported by this browser.";
        weatherSection.classList.add("error-style");
    }
});

locationsSection.addEventListener('click', (event) => {
    if(event.target.classList.contains('location-btn')) {
        let locationData = JSON.parse(decodeURIComponent(event.target.getAttribute("data-location")));
        if(!lastLocations.some(element => (
            element.name === locationData.name 
            && element.country === locationData.country 
            && element.state === locationData.state))) {
            lastLocations.push(locationData);
            if(lastLocations.length > 5) {
                lastLocations.shift();
            }
            localStorage.setItem("lastLocations", JSON.stringify(lastLocations));
        }
        locationsSection.innerHTML = "";
        currentLat = locationData.lat;
        currentLon = locationData.lon
        fetchWeatherData(event.target.innerText, currentLat, currentLon);
    }
});

weatherSection.addEventListener('click', (event) => {
    let weatherTitle = weatherSection.querySelector('.weather-title');
    let windSection = weatherSection.querySelector('.wind-section');
    let sunSection = weatherSection.querySelector('.sun-section');
    let celciusBtn = weatherSection.querySelector('.celcius-btn'); 
    let fahrenheitBtn = weatherSection.querySelector('.fahrenheit-btn'); 
    let kelvinBtn = weatherSection.querySelector('.kelvin-btn'); 
    let tempContainer = weatherSection.querySelector('.temp-container');
    let subTempContainer = weatherSection.querySelector('.sub-temp-container');
    let minTempContainer = weatherSection.querySelector('.min-temp-container');
    let maxTempContainer = weatherSection.querySelector('.max-temp-container');
    let favouritesBtn = weatherSection.querySelector('.favourites-btn')
    let favouritesLabel = weatherSection.querySelector('.favourites-label');
    let removeFromFavouritesBtn = weatherSection.querySelector('.remove-from-favourites-btn');
    
    let mainData = JSON.parse(decodeURIComponent(tempContainer.getAttribute("data-main")));
    let locationData = JSON.parse(decodeURIComponent(weatherTitle.getAttribute("data-location")));
    
    if(event.target.classList.contains("wind-btn") && event.target.innerText === "Show wind information") {
        windSection.innerHTML =  `
         <div>Speed:${weatherData.wind.speed}</div>
         <div>Deg: ${weatherData.wind.deg}</div>
         <div>Gust: ${weatherData.wind.gust}</div>
        `
        event.target.innerText = "Hide wind information";
    } else if(event.target.classList.contains("wind-btn") && event.target.innerText === "Hide wind information") {
        windSection.innerHTML = "";
        event.target.innerText = "Show wind information";
    } else if(event.target.classList.contains("sun-btn") && event.target.innerText === "Show sun information") {
        sunSection.innerHTML = `
            <div>Sunrise: ${getDateFromTimestamp(weatherData.sys.sunrise)}</div>
            <div>Sunset: ${getDateFromTimestamp(weatherData.sys.sunset)}</div>
        `;
        event.target.innerText = "Hide sun information";
    } else if(event.target.classList.contains("sun-btn") && event.target.innerText === "Hide sun information") {
        sunSection.innerHTML = "";
        event.target.innerText = "Show sun information";
    } else if(event.target.classList.contains("get-forecast-btn")) {
        forecastsSection.innerHTML = "";
        forecastSection.innerHTML = "";
        fetchForecasts(currentLat, currentLon);
    } else if(event.target.classList.contains("celcius-btn")) {
        subTempContainer.innerHTML = `Temperature: ${getCelciusTemp(mainData.temp)}`;
        minTempContainer.innerHTML = `Minimal temperature: ${getCelciusTemp(mainData.temp_min)}`;
        maxTempContainer.innerHTML = `Maximal temperature: ${getCelciusTemp(mainData.temp_max)}`;
        event.target.classList.add("selected-unit-option");
        if(fahrenheitBtn.classList.contains("selected-unit-option")) {
            fahrenheitBtn.classList.remove("selected-unit-option");
        }
        if(kelvinBtn.classList.contains("selected-unit-option")) {
            kelvinBtn.classList.remove("selected-unit-option");
        }
    } else if(event.target.classList.contains("fahrenheit-btn")) {
        subTempContainer.innerHTML = `Temperature: ${getFahrenheitTemp(mainData.temp)}`;
        minTempContainer.innerHTML = `Minimal temperature: ${getFahrenheitTemp(mainData.temp_min)}`;
        maxTempContainer.innerHTML = `Maximal temperature: ${getFahrenheitTemp(mainData.temp_max)}`;
        event.target.classList.add("selected-unit-option");
        if(celciusBtn.classList.contains("selected-unit-option")) {
            celciusBtn.classList.remove("selected-unit-option");
        }
        if(kelvinBtn.classList.contains("selected-unit-option")) {
            kelvinBtn.classList.remove("selected-unit-option");
        }
    } else if(event.target.classList.contains("kelvin-btn")) {
        subTempContainer.innerHTML = `Temperature: ${mainData.temp}`;
        minTempContainer.innerHTML = `Minimal temperature: ${mainData.temp_min}`;
        maxTempContainer.innerHTML = `Maximal temperature: ${mainData.temp_max}`;
        event.target.classList.add("selected-unit-option");
        if(celciusBtn.classList.contains("selected-unit-option")) {
            celciusBtn.classList.remove("selected-unit-option");
        }
        if(fahrenheitBtn.classList.contains("selected-unit-option")) {
            fahrenheitBtn.classList.remove("selected-unit-option");
        }
    } else if(event.target.classList.contains("favourites-btn")) {
        favouriteLocations.push(locationData);
        localStorage.setItem("favouriteLocations", JSON.stringify(favouriteLocations));
        event.target.classList.add("hide");
        favouritesLabel.classList.remove("hide"); 
        removeFromFavouritesBtn.classList.remove("hide");
    } else if(event.target.classList.contains("remove-from-favourites-btn")) {
        let index = favouriteLocations.findIndex(location =>
             location.name === locationData.name 
             && location.lat === locationData.lat 
             && location.lon === locationData.lon);
        if(index > -1) {
            favouriteLocations.splice(index, 1);
        }
        localStorage.setItem("favouriteLocations", JSON.stringify(favouriteLocations));
        event.target.classList.add("hide");
        favouritesLabel.classList.add("hide");
        favouritesBtn.classList.remove("hide");
    }
});

forecastsSection.addEventListener('click', (event) => {
    if(event.target.classList.contains("forecast-btn")) {
        forecastsSection.innerHTML = "";
        let forecastData = JSON.parse(decodeURIComponent(event.target.getAttribute("data-forecast")));
        let windData = encodeURIComponent(JSON.stringify(forecastData.wind));
        let mainData = encodeURIComponent(JSON.stringify(forecastData.main));

        forecastSection.innerHTML = `
            <h4>Weather forecast for ${getDateFromTimestamp(forecastData.dt)}</h4>
            <h5>${forecastData.weather[0].description}</h5>
            <button class="forecast-celcius-btn forecast-selected-unit-option">Celcius</button>
            <button class="forecast-fahrenheit-btn">Fahrenheit</button>
            <button class="forecast-kelvin-btn">Kelvin</button>
            <div class="temp-container" data-main="${mainData}">
            <div class="forecast-temp-container">Temperature: ${getCelciusTemp(forecastData.main.temp)}</div>
            <div class="forecast-min-temp-container">Minimal temperature: ${getCelciusTemp(forecastData.main.temp_min)}</div>
            <div class="forecast-max-temp-container">Maximal temperature: ${getCelciusTemp(forecastData.main.temp_max)}</div>
            </div>
             <div>Pressure: ${forecastData.main.pressure}</div>
            <div>Humidity: ${forecastData.main.humidity}</div>
            <button class="forecast-wind-btn" data-wind="${windData}">Show wind information</button>
            <div class="forecast-wind-section"></div>
        `;
    }
}); 

forecastSection.addEventListener('click', (event) => {
    let forecastWindSection = forecastSection.querySelector('.forecast-wind-section');
    let forecastCelciusButton = forecastSection.querySelector('.forecast-celcius-btn');
    let forecastFahrenheitButton = forecastSection.querySelector('.forecast-fahrenheit-btn');
    let forecastKelvinButton = forecastSection.querySelector('.forecast-kelvin-btn');
    let tempContainer = forecastSection.querySelector('.temp-container');
    let forecastTempContainer = forecastSection.querySelector('.forecast-temp-container');
    let forecastMinTempContainer = forecastSection.querySelector('.forecast-min-temp-container');
    let forecastMaxTempContainer = forecastSection.querySelector('.forecast-max-temp-container');
    
    let mainData = JSON.parse(decodeURIComponent(tempContainer.getAttribute("data-main")));
    
    if(event.target.classList.contains("forecast-wind-btn") && event.target.innerText === "Show wind information") {
        let windData = JSON.parse(decodeURIComponent(event.target.getAttribute("data-wind")));
        forecastWindSection.innerHTML = `
            <div>Speed: ${windData.speed}</div>
            <div>Deg: ${windData.deg}</div>
            <div>Gust: ${windData.gust}</div>
        `;
        event.target.innerText = "Hide wind information";
    } else if(event.target.classList.contains("forecast-wind-btn") && event.target.innerText === "Hide wind information") {
        forecastWindSection.innerHTML = "";
        event.target.innerText = "Show wind information";
    } else if(event.target.classList.contains("forecast-celcius-btn")) {
        forecastTempContainer.innerHTML = `Temperature: ${getCelciusTemp(mainData.temp)}`;
        forecastMinTempContainer.innerHTML = `Minimal temperature: ${getCelciusTemp(mainData.temp_min)}`;
        forecastMaxTempContainer.innerHTML = `Maximal temperature: ${getCelciusTemp(mainData.temp_max)}`;
        event.target.classList.add("forecast-selected-unit-option");
        if(forecastFahrenheitButton.classList.contains("forecast-selected-unit-option")) {
            forecastFahrenheitButton.classList.remove("forecast-selected-unit-option");
        }
        if(forecastKelvinButton.classList.contains("forecast-selected-unit-option")) {
            forecastKelvinButton.classList.remove("forecast-selected-unit-option");
        }
    } else if(event.target.classList.contains("forecast-fahrenheit-btn")) {
        forecastTempContainer.innerHTML = `Temperature: ${getFahrenheitTemp(mainData.temp)}`;
        forecastMinTempContainer.innerHTML = `Minimal temperature: ${getFahrenheitTemp(mainData.temp_min)}`;
        forecastMaxTempContainer.innerHTML = `Maximal temperature: ${getFahrenheitTemp(mainData.temp_max)}`;
        event.target.classList.add("forecast-selected-unit-option");
        if(forecastCelciusButton.classList.contains("forecast-selected-unit-option")) {
            forecastCelciusButton.classList.remove("forecast-selected-unit-option");
        }
        if(forecastKelvinButton.classList.contains("forecast-selected-unit-option")) {
            forecastKelvinButton.classList.remove("forecast-selected-unit-option");
        }
    } else if(event.target.classList.contains("forecast-kelvin-btn")) {
        forecastTempContainer.innerHTML = `Temperature: ${mainData.temp}`;
        forecastMinTempContainer.innerHTML = `Minimal temperature: ${mainData.temp_min}`;
        forecastMaxTempContainer.innerHTML = `Maximal temperature: ${mainData.temp_max}`;
        event.target.classList.add("forecast-selected-unit-option");
        if(forecastCelciusButton.classList.contains("forecast-selected-unit-option")) {
            forecastCelciusButton.classList.remove("forecast-selected-unit-option");
        }
        if(forecastFahrenheitButton.classList.contains("forecast-selected-unit-option")) {
            forecastFahrenheitButton.classList.remove("forecast-selected-unit-option");
        }
    }
});

function setDarkMode() {
    document.body.classList.add("body-dark-mode");
        document.querySelectorAll('input').forEach((input) => {
            input.classList.add("input-dark-mode");
        }); 
        darkModeBtn.innerText = "Light Mode";
}

function setLightMode() {
    document.body.classList.remove("body-dark-mode");
        document.querySelectorAll('input').forEach((input) => {
            input.classList.remove("input-dark-mode");
        });
        darkModeBtn.innerText = "Dark Mode";
}

async function fetchForecasts(lat, lon) {
    try {
        let response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        if(response.ok) {
            if(forecastsSection.classList.contains("error-style")) {
                forecastsSection.classList.remove("error-style");
            }
            forecastData = await response.json();
            forecastData.list.forEach((element) => {
                let forecastData = encodeURIComponent(JSON.stringify(element))
                forecastsSection.innerHTML += `
                    <button class="forecast-btn" data-forecast="${forecastData}">${getDateFromTimestamp(element.dt)}</button>
                `
            });
        }  else {
            forecastsSection.innerHTML = "Unable to fetch forecast data. Please try again later";
            forecastsSection.classList.add("error-style");
            throw new Error("Error occured while fetching forecast data");
        }
    } catch(error) {
        console.log(error);
    }
}

function getDateFromTimestamp(timestamp) {
     let date = new Date(timestamp * 1000)
    return date.toLocaleString();
}

function getCelciusTemp(kelvinTemp) {
   return (kelvinTemp + kelvinToCelciusConst).toFixed(2)
}

function getFahrenheitTemp(kelvinTemp) {
    return ((((kelvinTemp + kelvinToCelciusConst) * 9) / 5) + 32).toFixed(2);
}

async function fetchWeatherData(placeName, lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`)
        if(response.ok) {
            if(weatherSection.classList.contains("error-style")) {
                weatherSection.classList.remove("error-style");
            }
            weatherData = await response.json();
            let mainData = encodeURIComponent(JSON.stringify(weatherData.main));
             let data = {
                name: placeName,
                lat: lat,
                lon: lon
             }

            let locationData = encodeURIComponent(JSON.stringify(data));
            let existsInFavourites = favouriteLocations.some(location =>
                 location.name === placeName 
                 && location.lat === lat 
                 && location.lon === lon); 
                
            weatherSection.innerHTML = `
            <h3 class="weather-title" data-location="${locationData}">Weather for ${placeName}</h3>
            <button class="favourites-btn ${existsInFavourites ? "hide" : ""}">Add this location to favourites</button>
            <div class="favourites-label ${existsInFavourites ? "" : "hide"}">This is one of your favourite locations</div>
            <button class="remove-from-favourites-btn ${existsInFavourites ? "" : "hide"}">Remove from favourites</button>
            <h4>${weatherData.weather[0].description}</h4>
            <button class="celcius-btn selected-unit-option">Celcius</button>
            <button class="fahrenheit-btn">Fahrenheit</button>
            <button class="kelvin-btn">Kelvin</button>
            <div class="temp-container" data-main="${mainData}">
            <div class="sub-temp-container">Temperature: ${getCelciusTemp(weatherData.main.temp)}</div>
            <div class="min-temp-container">Minimal temperature: ${getCelciusTemp(weatherData.main.temp_min)}</div>
            <div class="max-temp-container">Maximal temperature: ${getCelciusTemp(weatherData.main.temp_max)}</div>
            </div>
            <div>Pressure: ${weatherData.main.pressure}</div>
            <div>Humidity: ${weatherData.main.humidity}</div>
            <button class="sun-btn">Show sun information</button>
            <div class="sun-section"></div>
            <button class="wind-btn">Show wind information</button>
            <div class="wind-section"></div>
            <button class="get-forecast-btn">Get forecast</button>
            `;
        } else {
            weatherSection.innerHTML = "Unable to fetch weather data. Please try again later";
            weatherSection.classlist.add("error-style");
            throw new Error("Error while fetching the weather data");
        }
    } catch(error) {
        console.log(error);
    }
}

async function fetchWeatherLocations() {
    let placeName = placeNamInput.value;

    try {
        const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${placeName}&limit=5&appid=${apiKey}`);
        if(response.ok) {
            if(locationsSection.classList.contains("error-style")) {
                locationsSection.classList.remove("error-style");
            }
            const data = await response.json();
            if(data.length === 0) {
                locationsSection.classList.add("error-style");
                locationsSection.innerHTML = "No place found";
            } else {
                if(locationsSection.classList.contains("error-style")) { 
                    locationsSection.classList.remove("error-style");
                }
                locationsSection.innerHTML = "Choose location";  
            }
            data.forEach(element => {

                let locationData = encodeURIComponent(JSON.stringify(element));
        
                locationsSection.innerHTML += `
                <div>
                <button class="location-btn" data-location="${locationData}">${element.name}, ${element.country}, ${element.state}</button>
                </div>
                `
            });
        } else {
            locationsSection.innerHTML = "Unable to fetch places. Please try again later.";
            locationsSection.classList.add("error-style");
            throw new Error("Error while fetching the locations data data");
        }
    } catch(error) {
        console.log(error);
    }
}