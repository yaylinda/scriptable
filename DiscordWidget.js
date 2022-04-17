// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;

/*=========================================================
 * WIDGET CONFIGURATIONS
 * ---------------------
 *
 * ***** READ ME *****
 *
 * Change things here to customize sizes and colors of
 * various things. These are all optional, EXCEPT:
 *   - weatherApiKey
 *   - calendarName (From the iOS Calendar app)
 *=======================================================*/

const WIDGET_CONFIGURATIONS = {
    // Width and height of widget
    width: 1000,
    height: 1000,
  
    // Height of top banner
    bannerHeight: 200,
  
    // Diameter of logo circle
    logoCircleDiameter: 250,
  
    // How much roundness of outer rectangles
    roundness: 50,
  
    // Font size
    fontSize: 50,
  
    // How far from left side the content is aligned
    xOffset: 30,
  
    // Color of the banner (this is the "real" Discord color)
    bannerColor: new Color("#5865f2"),
  
    // Color of the bottom part of the banner (this is the "real" Discord color)
    bannerBottomColor: new Color("#18191c"),
  
    // Background color of the information section (this is the "real" Discord color)
    infoBackgroundColor: new Color("#36393f"),
  
    /**
     * CHANGE ME!
     *
     * Follow instructions here: https://home.openweathermap.org/api_keys
     */
    weatherApiKey: "<TODO>",
  
    /**
     * CHANGE ME!
     *
     * Get the name of any calendar you want from the iOS
     * Calendar App.
     */
    calendarName: "<TODO>",
  };
  
  /*=========================================================
   * CACHE-RELATED THINGS
   *
   * No need to make any changes in this section, unless you
   * really want to.
   *=======================================================*/
  
  // Cache keys and default location
  const CACHE_KEY_LAST_UPDATED = "last_updated";
  const CACHE_KEY_LOCATION = "location";
  const DEFAULT_LOCATION = { latitude: 0, longitude: 0 };
  
  // Timeformatter
  const TIME_FORMATTER = new DateFormatter();
  TIME_FORMATTER.locale = "en";
  TIME_FORMATTER.useNoDateStyle();
  TIME_FORMATTER.useShortTimeStyle();
  
  /**
   * A wrapper for storing / getting data from iCloud.
   */
  class Cache {
    constructor(name) {
      this.fm = FileManager.iCloud();
      this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), name);
  
      if (!this.fm.fileExists(this.cachePath)) {
        this.fm.createDirectory(this.cachePath);
      }
    }
  
    async read(key, expirationMinutes) {
      try {
        const path = this.fm.joinPath(this.cachePath, key);
        await this.fm.downloadFileFromiCloud(path);
        const createdAt = this.fm.creationDate(path);
  
        if (expirationMinutes) {
          if (new Date() - createdAt > expirationMinutes * 60000) {
            this.fm.remove(path);
            return null;
          }
        }
  
        const value = this.fm.readString(path);
  
        try {
          return JSON.parse(value);
        } catch (error) {
          return value;
        }
      } catch (error) {
        return null;
      }
    }
  
    write(key, value) {
      const path = this.fm.joinPath(this.cachePath, key.replace("/", "-"));
      console.log(`Caching to ${path}...`);
  
      if (typeof value === "string" || value instanceof String) {
        this.fm.writeString(path, value);
      } else {
        this.fm.writeString(path, JSON.stringify(value));
      }
    }
  }
  
  /*=========================================================
   * WIDGET SET UP / PRESENTATION
   *=======================================================*/
  
  const widget = new ListWidget();
  
  const cache = new Cache("discord-widget");
  const data = await fetchData();
  const logo = await getLogo();
  
  drawWidget(widget, WIDGET_CONFIGURATIONS);
  
  if (config.runsInWidget) {
    Script.setWidget(widget);
    Script.complete();
  } else {
    Script.setWidget(widget);
    widget.presentLarge();
    Script.complete();
  }
  
  Script.setWidget(widget);
  Script.complete();
  
  /*=========================================================
   * DRAW WIDGET
   *=======================================================*/
  
  /**
   * Main widget rendering function.
   */
  function drawWidget(widget) {
    const {
      bannerColor,
      bannerBottomColor,
      infoBackgroundColor,
      width,
      height,
      bannerHeight,
      roundness,
      fontSize,
      xOffset,
      logoCircleDiameter,
    } = WIDGET_CONFIGURATIONS;
  
    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.backgroundColor = Color.clear();
  
    /////////////////////////////////////
    // Set up draw context
    /////////////////////////////////////
    const draw = new DrawContext();
    draw.opaque = false;
    draw.respectScreenScale = true;
    draw.size = new Size(width, height);
  
    const roundnessOffset = roundness + 30;
  
    /////////////////////////////////////
    // Draw bottom rectangle
    /////////////////////////////////////
    const bottomRectPath = new Path();
    bottomRectPath.addRoundedRect(
      new Rect(
        0,
        bannerHeight - roundnessOffset,
        width,
        height - bannerHeight + roundnessOffset
      ),
      roundness,
      roundness
    );
    draw.addPath(bottomRectPath);
    draw.setFillColor(bannerBottomColor);
    draw.fillPath();
  
    /////////////////////////////////////
    // Draw top rectangle (banner)
    /////////////////////////////////////
    const bannerRectPath = new Path();
    bannerRectPath.addRoundedRect(
      new Rect(0, 0, width, bannerHeight),
      roundness,
      roundness
    );
    draw.addPath(bannerRectPath);
    draw.setFillColor(bannerColor);
    draw.fillPath();
  
    /////////////////////////////////////
    // Draw bottom filler for banner rectangle
    /////////////////////////////////////
    const fillerBannerRectPath = new Path();
    fillerBannerRectPath.addRect(new Rect(0, 100, width, bannerHeight - 100));
    draw.addPath(fillerBannerRectPath);
    draw.setFillColor(bannerColor);
    draw.fillPath();
  
    /////////////////////////////////////
    // Draw the circle around the discord logo
    /////////////////////////////////////
    const imageCirclePath = new Path();
    imageCirclePath.addEllipse(
      new Rect(
        xOffset,
        bannerHeight - logoCircleDiameter / 2,
        logoCircleDiameter,
        logoCircleDiameter
      )
    );
    draw.addPath(imageCirclePath);
    draw.setFillColor(bannerBottomColor);
    draw.fillPath();
  
    /////////////////////////////////////
    // Draw the circle around the discord logo
    /////////////////////////////////////
  
    const innerCirclePath = new Path();
    innerCirclePath.addEllipse(
      new Rect(
        xOffset + 20,
        bannerHeight - (logoCircleDiameter - 40) / 2,
        logoCircleDiameter - 40,
        logoCircleDiameter - 40
      )
    );
    draw.addPath(innerCirclePath);
    draw.setFillColor(Color.white());
    draw.fillPath();
  
    /////////////////////////////////////
    // Draw the logo
    /////////////////////////////////////
  
    draw.drawImageInRect(
      logo,
      new Rect(
        xOffset,
        bannerHeight - (logoCircleDiameter - 170),
        logoCircleDiameter,
        logoCircleDiameter - 100
      )
    );
  
    /////////////////////////////////////
    // Draw the online green circle
    /////////////////////////////////////
  
    const smallCirclePath = new Path();
    smallCirclePath.addEllipse(new Rect(225, 250, 50, 50));
    draw.addPath(smallCirclePath);
    draw.setFillColor(Color.green());
    draw.fillPath();
  
    /////////////////////////////////////
    // Draw the text for the date
    /////////////////////////////////////
    const medDateOnlyFormatter = new DateFormatter();
    medDateOnlyFormatter.locale = "en";
    medDateOnlyFormatter.useMediumDateStyle();
    medDateOnlyFormatter.useNoTimeStyle();
  
    const dateStr = medDateOnlyFormatter.string(new Date());
    const dateParts = dateStr.split(", ");
  
    draw.setTextColor(Color.white());
    draw.setFont(Font.boldRoundedSystemFont(fontSize));
    draw.drawText(dateParts[0], new Point(xOffset, 350));
  
    draw.setTextColor(Color.lightGray());
    draw.drawText(`#${dateParts[1]}`, new Point(210, 350));
  
    /////////////////////////////////////
    // Draw bottom filler for banner rectangle
    /////////////////////////////////////
    const aboutMeRectPath = new Path();
    aboutMeRectPath.addRect(new Rect(0, 425, width, height - 425));
    draw.addPath(aboutMeRectPath);
    draw.setFillColor(infoBackgroundColor);
    draw.fillPath();
  
    /////////////////////////////////////
    //Draw Weather
    /////////////////////////////////////
  
    let startingY = 450;
    const lineSpacing = 55;
  
    draw.setTextColor(Color.lightGray());
    draw.setFont(Font.boldRoundedSystemFont(fontSize));
    draw.drawText("ABOUT ME", new Point(xOffset, startingY));
  
    const { weather } = data;
  
    draw.setTextColor(Color.lightGray());
    draw.setFont(Font.regularRoundedSystemFont(fontSize));
    draw.drawText(
      `${weather.icon} ${weather.description}, ${weather.temperature}°F  (feels like ${weather.feelsLike}°F)`,
      new Point(xOffset, (startingY += lineSpacing))
    );
    draw.drawText(
      `Low: ${weather.low}°F, High: ${weather.high}°F`,
      new Point(xOffset, (startingY += lineSpacing))
    );
    draw.setFont(Font.thinRoundedSystemFont(fontSize));
    draw.drawText(
      `${weather.location}`,
      new Point(xOffset, (startingY += lineSpacing))
    );
  
    /////////////////////////////////////
    //Calendar events
    /////////////////////////////////////
  
    const { events } = data;
  
    if (events.length > 1) {
      draw.setTextColor(Color.lightGray());
      draw.setFont(Font.boldRoundedSystemFont(fontSize));
      draw.drawText(
        "MY EVENTS",
        new Point(xOffset, (startingY += lineSpacing + 20))
      );
  
      for (let event of events) {
        startingY += lineSpacing;
  
        const startTime = TIME_FORMATTER.string(new Date(event.startDate));
        const endTime = TIME_FORMATTER.string(new Date(event.endDate));
  
        draw.setFont(Font.regularRoundedSystemFont(fontSize));
        draw.setTextColor(new Color(event.calendar.color.hex));
        draw.drawText("\u2759", new Point(xOffset, startingY));
        draw.setTextColor(Color.lightGray());
  
        draw.setFont(Font.thinRoundedSystemFont(fontSize));
        draw.drawText(`[${startTime}-${endTime}]`, new Point(80, startingY));
        draw.setFont(Font.regularRoundedSystemFont(fontSize));
        draw.drawText(`${event.title}`, new Point(525, startingY));
      }
    }
  
    /////////////////////////////////////
    //last updated
    /////////////////////////////////////
    const { lastUpdated } = data;
    const dateTimeFormatter = new DateFormatter();
    dateTimeFormatter.locale = "en";
    dateTimeFormatter.useShortDateStyle();
    dateTimeFormatter.useShortTimeStyle();
  
    draw.setTextColor(Color.lightGray());
    draw.setFont(Font.italicSystemFont(30));
    draw.drawText(
      `Last Updated: ${dateTimeFormatter.string(new Date(lastUpdated))}`,
      new Point(550, 950)
    );
  
    /////////////////////////////////////
    // Put the drawn image on the widget
    /////////////////////////////////////
    const drawn = draw.getImage();
    widget.addImage(drawn);
  }
  
  /*=========================================================
   * GET DATA
   *=======================================================*/
  
  /**
   * Fetch various pieces of data for the widget.
   */
  async function fetchData() {
    const { calendarNames } = WIDGET_CONFIGURATIONS;
  
    // Get the weather data
    const weather = await fetchWeather();
  
    // Fetch calendar events for today and tomorrow
    const events = await fetchEventsForCalendar(calendarNames);
  
    // Get last data update time (and set)
    const lastUpdated = await getLastUpdated();
    cache.write(CACHE_KEY_LAST_UPDATED, new Date().getTime());
  
    return {
      weather,
      events,
      lastUpdated,
    };
  }
  
  /**
   * Fetch the weather data from Open Weather Map
   */
  async function fetchWeather() {
    const { weatherApiKey } = WIDGET_CONFIGURATIONS;
  
    let location = await cache.read(CACHE_KEY_LOCATION);
    if (!location) {
      try {
        Location.setAccuracyToThreeKilometers();
        location = await Location.current();
      } catch (error) {
        location = await cache.read(CACHE_KEY_LOCATION);
      }
    }
    if (!location) {
      location = DEFAULT_LOCATION;
    }
    const url =
      "https://api.openweathermap.org/data/2.5/onecall?lat=" +
      location.latitude +
      "&lon=" +
      location.longitude +
      "&exclude=minutely,hourly,alerts&units=imperial&lang=en&appid=" +
      weatherApiKey;
    const address = await Location.reverseGeocode(
      location.latitude,
      location.longitude
    );
    const data = await fetchJson(url);
  
    const cityState = `${address[0].postalAddress.city}, ${address[0].postalAddress.state}`;
  
    if (!data || !data.current) {
      console.error(
        `Unable to fetch weather data. Please make sure the weatherApiKey is valid (current value: ${weatherApiKey}). Follow instructions here: https://home.openweathermap.org/api_keys`
      );
      return {
        location: cityState,
        icon: "❓",
        description: "Not available",
        temperature: "?",
        wind: "?",
        high: "?",
        low: "?",
        feelsLike: "?",
      };
    }
  
    const currentTime = new Date().getTime() / 1000;
    const isNight =
      currentTime >= data.current.sunset || currentTime <= data.current.sunrise;
  
    return {
      location: cityState,
      icon: getWeatherEmoji(data.current.weather[0].id, isNight),
      description: data.current.weather[0].main,
      temperature: Math.round(data.current.temp),
      wind: Math.round(data.current.wind_speed),
      high: Math.round(data.daily[0].temp.max),
      low: Math.round(data.daily[0].temp.min),
      feelsLike: Math.round(data.current.feels_like),
    };
  }
  
  /**
   * Given a weather code from Open Weather Map, determine the best emoji to show.
   *
   * @param {*} code Weather code from Open Weather Map
   * @param {*} isNight Is `true` if it is after sunset and before sunrise
   */
  function getWeatherEmoji(code, isNight) {
    if ((code >= 200 && code < 300) || code == 960 || code == 961) {
      return "⛈";
    } else if ((code >= 300 && code < 600) || code == 701) {
      return "🌧";
    } else if (code >= 600 && code < 700) {
      return "❄️";
    } else if (code == 711) {
      return "🔥";
    } else if (code == 800) {
      return isNight ? "🌕" : "☀️";
    } else if (code == 801) {
      return isNight ? "☁️" : "🌤";
    } else if (code == 802) {
      return isNight ? "☁️" : "⛅️";
    } else if (code == 803) {
      return isNight ? "☁️" : "🌥";
    } else if (code == 804) {
      return "☁️";
    } else if (code == 900 || code == 962 || code == 781) {
      return "🌪";
    } else if (code >= 700 && code < 800) {
      return "🌫";
    } else if (code == 903) {
      return "🥶";
    } else if (code == 904) {
      return "🥵";
    } else if (code == 905 || code == 957) {
      return "💨";
    } else if (code == 906 || code == 958 || code == 959) {
      return "🧊";
    } else {
      return "❓";
    }
  }
  
  /**
   * Fetch the next "accepted" calendar event from the given calendar
   *
   * @param {*} calendarName The calendar to get events from
   */
  async function fetchEventsForCalendar() {
    const { calendarName } = WIDGET_CONFIGURATIONS;
  
    const calendar = await Calendar.forEventsByTitle(calendarName);
    const events = await CalendarEvent.today([calendar]);
  
    console.log(`Got ${events.length} events for ${calendarName}`);
  
    const upcomingEvents = events.filter(
      (e) => new Date(e.endDate).getTime() >= new Date().getTime()
    );
  
    return upcomingEvents;
  }
  
  /**
   * Make a REST request and return the response
   *
   * @param {*} url URL to make the request to
   * @param {*} headers Headers for the request
   */
  async function fetchJson(url, headers) {
    try {
      console.log(`Fetching url: ${url}`);
      const req = new Request(url);
      req.headers = headers;
      const resp = await req.loadJSON();
      return resp;
    } catch (error) {
      console.error(
        `Error fetching from url: ${url}, error: ${JSON.stringify(error)}`
      );
    }
  }
  
  /**
   * Get the last updated timestamp from the Cache.
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
   * Fetch the discord logo image
   */
  async function getLogo() {
    const request = new Request(
      "https://logos-world.net/wp-content/uploads/2020/12/Discord-Logo.png"
    );
    const image = await request.loadImage();
    return image;
  }
  