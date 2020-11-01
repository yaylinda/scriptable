const CACHE_KEY_LAST_UPDATED = 'last_updated';

const WEATHER_API_KEY = "36881329dd0afa7e532f18d806ee316d";

const DEFAULT_LOCATION = {
  latitude: 0,
  longitude: 0
};

const Cache = importModule('Cache');
const cache = new Cache("terminalWidget");

const data = await fetchData();
const widget = createWidget(data);
Script.setWidget(widget);
Script.complete();

/**
 * Main render widget function.
 * 
 * @param {} data The data for the widget to display
 */
function createWidget(data) {
  console.log(`Creating widget with data: ${JSON.stringify(data)}`);

  const w = new ListWidget()
  const bgColor = new LinearGradient()
  bgColor.colors = [new Color("#29323c"), new Color("#1c1c1c")]
  bgColor.locations = [0.0, 1.0]
  w.backgroundGradient = bgColor
  w.setPadding(12, 15, 15, 12)

  const stack = w.addStack();
  stack.layoutHorizontally();

  // ----------------------------------
  // Left Stack (Main Info)
  // ----------------------------------
  const leftStack = stack.addStack();
  leftStack.layoutVertically();
  leftStack.spacing = 6;
  leftStack.size = new Size(200, 0);

  // Line 0 - Last Login
  const timeDiffMs = ((new Date().getTime() - data.lastUpdated) / 1000).toFixed(0);
  const lastLoginLine = leftStack.addText(`Last login: ${timeDiffMs} sec ago`);
  lastLoginLine.textColor = Color.white();
  lastLoginLine.textOpacity = 0.7;
  lastLoginLine.font = new Font("Menlo", 11);

  // Line 1 - Input
  const inputLine = leftStack.addText(`iPhone:~ linda$ info`);
  inputLine.textColor = Color.white();
  inputLine.textOpacity = 0.7;
  inputLine.font = new Font("Menlo", 11);

  // Line 2 - Next Work Calendar Event
  const nextWorkEventTitle = data.nextWorkEvent ? data.nextWorkEvent.title : 'No upcoming work events';
  const nextWorkCalendarEventLine = leftStack.addText(`[🗓] ${nextWorkEventTitle}`);
  nextWorkCalendarEventLine.textColor = new Color("#FF6663");
  nextWorkCalendarEventLine.font = new Font("Menlo", 11);
  
  // Line 3 - Next Personal Calendar Event
  const nextPersonalEventTitle = data.nextPersonalEvent ? data.nextPersonalEvent.title : 'No upcoming events';
  const nextPersonalCalendarEventLine = leftStack.addText(`[🗓] ${nextPersonalEventTitle}`);
  nextPersonalCalendarEventLine.textColor = new Color("#FDFD97");
  nextPersonalCalendarEventLine.font = new Font("Menlo", 11);

  // Line 4 - TODO
  const line4 = leftStack.addText(`[🗓] TODO`);
  line4.textColor = new Color("#9EE09E");
  line4.font = new Font("Menlo", 11);

  // Line 5 - TODO
  const line5 = leftStack.addText(`[🗓] TODO`);
  line5.textColor = new Color("#9EC1CF");
  line5.font = new Font("Menlo", 11);

  // Line 6 - TODO
  const line6 = leftStack.addText(`[🗓] TODO`);
  line6.textColor = new Color("#CC99C9");
  line6.font = new Font("Menlo", 11);

  // ----------------------------------
  // Right Stack (Weather)
  // ----------------------------------
  stack.addSpacer();
  const rightStack = stack.addStack();
  rightStack.spacing = 2;
  rightStack.layoutVertically();
  rightStack.bottomAlignContent();

  addWeatherLine(rightStack, data.weather.icon, 32);
  addWeatherLine(rightStack, `${data.weather.description}, ${data.weather.temperature}°`, 12, true);
  addWeatherLine(rightStack, `High: ${data.weather.high}°`);
  addWeatherLine(rightStack, `Low: ${data.weather.low}°`);
  addWeatherLine(rightStack, `UVI: ${data.weather.uvi}`);
  addWeatherLine(rightStack, `Wind: ${data.weather.wind} mph`);

  return w;
}

/**
 * Fetch pieces of data for the widget.
 */
async function fetchData() {
  // Get the weather data
  const weather = await fetchWeather();

  // Get next work/personal calendar events
  const nextWorkEvent = await fetchNextCalendarEvent('linda.zheng@redfin.com');
  const nextPersonalEvent = await fetchNextCalendarEvent('lindazheng1993@gmail.com');

  // Get battery data
  const batteryLevel = Device.batteryLevel();

  // Get last data update time (and set)
  const lastUpdated = await getLastUpdated();
  cache.write(CACHE_KEY_LAST_UPDATED, new Date().getTime());

  return {
    weather,
    lastUpdated,
    nextWorkEvent,
    batteryLevel, 
    nextPersonalEvent,
  };
}

function addWeatherLine(w, text, size, bold) {
  const stack = w.addStack();
  stack.setPadding(0, 0, 0, 0);
  stack.layoutHorizontally();
  stack.addSpacer();
  const line = stack.addText(text);
  line.textColor = new Color("#FEB144");
  line.font = new Font("Menlo" + (bold ? "-Bold" : ""), size || 11);
}

async function fetchWeather() {
  let location = await cache.read('location');
  if (!location) {
    try {
      Location.setAccuracyToThreeKilometers();
      location = await Location.current();
    } catch(error) {
      location = await cache.read('location');
    }
  }
  if (!location) {
    location = DEFAULT_LOCATION;
  }
  const address = await Location.reverseGeocode(location.latitude, location.longitude);
  const url = "https://api.openweathermap.org/data/2.5/onecall?lat=" + location.latitude + "&lon=" + location.longitude + "&exclude=minutely,hourly,alerts&units=imperial&lang=en&appid=" + WEATHER_API_KEY;
  const data = await fetchJson(`weather_${address[0].locality}`, url);

  const currentTime = new Date().getTime() / 1000;
  const isNight = currentTime >= data.current.sunset || currentTime <= data.current.sunrise

  return {
    icon: getWeatherEmoji(data.current.weather[0].id, isNight),
    description: data.current.weather[0].main,
    temperature: Math.round(data.current.temp),
    wind: Math.round(data.current.wind_speed),
    high: Math.round(data.daily[0].temp.max),
    low: Math.round(data.daily[0].temp.min),
    uvi: data.current.uvi.toFixed(1),
  }
}

async function fetchNextCalendarEvent(calendarName) {
  const calendar = await Calendar.forEventsByTitle(calendarName);
  const events = await CalendarEvent.today([calendar]);
  console.log(`Got ${events.length} events for ${calendarName} for today`);
  return events[0] || null;
}

async function fetchJson(key, url, headers) {
  const cached = await cache.read(key, 5);
  if (cached) {
    return cached;
  }

  try {
    console.log(`Fetching url: ${url}`);
    const req = new Request(url);
    req.headers = headers;
    const resp = await req.loadJSON();
    cache.write(key, resp);
    return resp;
  } catch (error) {
    try {
      return cache.read(key, 5);
    } catch (error) {
      console.log(`Couldn't fetch ${url}`);
    }
  }
}

function getWeatherEmoji(code, isNight) {
  if (code >= 200 && code < 300 || code == 960 || code == 961) {
    return "⛈"
  } else if ((code >= 300 && code < 600) || code == 701) {
    return "🌧"
  } else if (code >= 600 && code < 700) {
    return "❄️"
  } else if (code == 711) {
    return "🔥" 
  } else if (code == 800) {
    return isNight ? "🌕" : "☀️" 
  } else if (code == 801) {
    return isNight ? "☁️" : "🌤"  
  } else if (code == 802) {
    return isNight ? "☁️" : "⛅️"  
  } else if (code == 803) {
    return isNight ? "☁️" : "🌥" 
  } else if (code == 804) {
    return "☁️"  
  } else if (code == 900 || code == 962 || code == 781) {
    return "🌪" 
  } else if (code >= 700 && code < 800) {
    return "🌫" 
  } else if (code == 903) {
    return "🥶"  
  } else if (code == 904) {
    return "🥵" 
  } else if (code == 905 || code == 957) {
    return "💨" 
  } else if (code == 906 || code == 958 || code == 959) {
    return "🧊" 
  } else {
    return "❓" 
  }
}

/**
 * 
 */
async function getLastUpdated() {
  let cachedLastUpdated = await cache.read(CACHE_KEY_LAST_UPDATED);

  if (!cachedLastUpdated) {
    cachedLastUpdated = new Date().getTime();
    cache.write(CACHE_KEY_LAST_UPDATED, cachedLastUpdated);
  }

  return cachedLastUpdated;
}