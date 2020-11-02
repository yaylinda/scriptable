const CACHE_KEY_LAST_UPDATED = 'last_updated';

const WEATHER_API_KEY = "36881329dd0afa7e532f18d806ee316d";

const DEFAULT_LOCATION = {
  latitude: 0,
  longitude: 0
};

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
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

  const w = new ListWidget();
  const bgColor = new LinearGradient();
  bgColor.colors = [new Color("#29323c"), new Color("#1c1c1c")];
  bgColor.locations = [0.0, 1.0];
  w.backgroundGradient = bgColor;
  w.setPadding(10, 15, 15, 10);

  const stack = w.addStack();
  stack.layoutVertically();
  stack.spacing = 4;
  stack.size = new Size(320, 0);

  // Line 0 - Last Login
  const timeFormatter = new DateFormatter();
  timeFormatter.locale = "en";
  timeFormatter.useNoDateStyle();
  timeFormatter.useShortTimeStyle();

  const lastLoginLine = stack.addText(`Last login: ${timeFormatter.string(new Date())} on ttys001`);
  lastLoginLine.textColor = Color.white();
  lastLoginLine.textOpacity = 0.7;
  lastLoginLine.font = new Font("Menlo", 10);

  // Line 1 - Input
  const inputLine = stack.addText(`iPhone:~ linda$ info`);
  inputLine.textColor = Color.white();
  inputLine.font = new Font("Menlo", 10);

  // Line 2 - Next Personal Calendar Event
  const nextPersonalCalendarEventLine = stack.addText(`🗓 | ${getCalendarEventTitle(data.nextPersonalEvent, false)}`);
  nextPersonalCalendarEventLine.textColor = new Color("#9EC1CF");
  nextPersonalCalendarEventLine.font = new Font("Menlo", 10);

  // Line 3 - Next Work Calendar Event
  const nextWorkCalendarEventLine = stack.addText(`🗓 | ${getCalendarEventTitle(data.nextWorkEvent, true)}`);
  nextWorkCalendarEventLine.textColor = new Color("#9EE09E");
  nextWorkCalendarEventLine.font = new Font("Menlo", 10);

  // Line 4 - Weather
  const weatherLine = stack.addText(`${data.weather.icon} | ${data.weather.temperature}° (${data.weather.high}°-${data.weather.low}°)`);
  weatherLine.textColor = new Color("#FDFD97");
  weatherLine.font = new Font("Menlo", 10);
  
  // Line 5 - TODO (?)
  const line4 = stack.addText(`🗓 | TODO`);
  line4.textColor = new Color("#FEB144");
  line4.font = new Font("Menlo", 10);

  // Line 6 - TODO (period?)
  const line5 = stack.addText(`🩸 | ${data.period}`);
  line5.textColor = new Color("#FF6663");
  line5.font = new Font("Menlo", 10);

  // Line 7 - TODO (stats?)
  const line6 = stack.addText(`🗓 | TODO`);
  line6.textColor = new Color("#CC99C9");
  line6.font = new Font("Menlo", 10);

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

  // Get period data
  const period = await fetchPeriodData();

  // Get last data update time (and set)
  const lastUpdated = await getLastUpdated();
  cache.write(CACHE_KEY_LAST_UPDATED, new Date().getTime());

  return {
    weather,
    lastUpdated,
    nextWorkEvent,
    batteryLevel, 
    nextPersonalEvent,
    period,
  };
}

/**
 * 
 */
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
  }
}

/**
 * 
 * @param {*} calendarName 
 */
async function fetchNextCalendarEvent(calendarName) {
  const calendar = await Calendar.forEventsByTitle(calendarName);
  const events = await CalendarEvent.today([calendar]);

  console.log(`Events for ${calendarName}: ${JSON.stringify(events)}`);

  const upcomingEvents = events.filter(e => (new Date(e.endDate)).getTime() >= (new Date()).getTime());

  return upcomingEvents ? upcomingEvents[0] : null;
}

/**
 * 
 * @param {*} key 
 * @param {*} url 
 * @param {*} headers 
 */
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

/**
 * 
 * @param {*} code 
 * @param {*} isNight 
 */
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
 * @param {*} calendarEvent 
 * @param {*} isWorkEvent 
 */
function getCalendarEventTitle(calendarEvent, isWorkEvent) {
  if (!calendarEvent) {
    return `No more ${isWorkEvent ? 'work ' : ''}events today :)`;
  }

  const timeFormatter = new DateFormatter();
  timeFormatter.locale = 'en';
  timeFormatter.useNoDateStyle();
  timeFormatter.useShortTimeStyle();

  const eventTime = new Date(calendarEvent.startDate);

  return `[${timeFormatter.string(eventTime)}] ${calendarEvent.title}`;
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

/**
 * 
 */
async function fetchPeriodData() {
  const periodCalendar = await Calendar.forEventsByTitle("Period");
  const events = await CalendarEvent.between(new Date(), new Date().addDays(30), [periodCalendar]);

  console.log(`Period Events: ${JSON.stringify(events)}`);

  const periodEvent = events.filter(e => e.title === 'On Period :(')[0];
  console.log(`Period Event: ${JSON.stringify(periodEvent)}`);

  if (periodEvent) {
    const current = new Date().getTime();
    if (new Date(periodEvent.startDate).getTime() <= current && new Date(periodEvent.endDate).getTime() >= current) {
      const timeUntilPeriodEndMs = new Date(periodEvent.endDate).getTime() - current;
      return `${(timeUntilPeriodEndMs / 86400000).toFixed(0)} days until period ends`; ;
    } else {
      const timeUntilPeriodStartMs = new Date(periodEvent.startDate).getTime() - current;
      return `${(timeUntilPeriodStartMs / 86400000).toFixed(0)} days until period starts`; 
    }
  } else {
    return 'Unknown period data';
  }
}