import './style.less';
import './index.html';
import * as Ractive from 'ractive';
import * as $ from 'jquery';

// This is needed for hot-module-replacement
if (module.hot) {
  module.hot.accept();
}

const iconCodesMap = new Map([
  ['01d', 'day-sunny'],
  ['01n', 'night-clear'],
  ['02d', 'day-cloudy'],
  ['03d', 'cloudy'],
  ['02n', 'night-alt-cloudy'],
  ['03n', 'cloudy'],
  ['04n', 'cloudy'],
  ['09d', 'rain'],
  ['10d', 'rain'],
  ['09n', 'night-alt-rain'],
  ['10n', 'night-alt-rain'],
  ['11d', 'thunderstorm'],
  ['11n', 'night-alt-thunderstorm'],
  ['13d', 'day-snow'],
  ['13n', 'night-alt-snow'],
  ['50d', 'day-fog'],
  ['50n', 'night-fog'],
]);

const model = {
  name: 'Limerick',
  weatherClass: 'winter',
  hasGeo: false,
  loading: false,
  temp: 34,
  isCelcius: true,
  formatTemp: function(val) {
    if (!this.get('isCelcius')) {
      // convert celsius to fahrenheit
      val = (val * 1.8) + 32;
    }
    return val.toFixed(1) + '°';
  },
  formatIcon: function(icon) {
    return iconCodesMap.get(icon);
  }
};

let ractive = new Ractive({
  // The `el` option can be a node, an ID, or a CSS selector.
  el: '#root',
  magic: true,

  // We could pass in a string, but for the sake of convenience
  // we're passing the ID of the <script> tag above.
  template: '#template',

  // Here, we're passing in some initial data
  data: model
});


if (navigator.geolocation) {
  ractive.set('loading', true);
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
}
//Get the latitude and the longitude;
function onSuccess(position) {
  console.log(position)
  ractive.set('hasGeo', true)
  ractive.set('loading', false)
  let lat = position.coords.latitude;
  let lng = position.coords.longitude;

  $.when(getGeoDataPromise(lat, lng), getCurrent(lat, lng)).then((cityRes, weatherRes) => {
    updateCity(cityRes[0]);
    updateWeather(weatherRes[0]);
  })
}

function getCurrent(lat, lng) {
  let url = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lng + "&APPID=061f24cf3cde2f60644a8240302983f2";

  return $.getJSON(url);
}

function getGeoDataPromise(lat, lng) {
  return $.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}`);
}

function updateCity(response) {
  let city = '';
  console.log(response);
  if (response["results"]) {
    let arrAddress = response["results"];
    arrAddress.forEach((address, i) => {
      address.address_components.forEach((addrLine, j) => {
        if (addrLine.types[0] === 'locality') {
          console.log("City: " + addrLine.long_name);
          ractive.set('city', addrLine.long_name);
          return;
        }
      })
    });
  }
}

function updateWeather(response) {
  console.log(response);
  let temp = Math.round(response.main.temp - 273.15);
  let weatherDesc = response.weather["0"].description[0].toUpperCase() + response.weather["0"].description.slice(1);
  let icon = response.weather["0"].icon;

  ractive.set('temp', temp);
  ractive.set('desc', weatherDesc);
  ractive.set('icon', icon);
}

function onError(err) {
  ractive.set('hasGeo', false);
  ractive.set('loading', false);
}