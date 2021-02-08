// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;

/*=============================================================================
 * CONSTANTS
 ============================================================================*/
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

Date.prototype.addHours = function (numHours) {
  const date = new Date(this.valueOf());
  date.setHours(date.getHours() + numHours);
  return date;
};

Date.prototype.startOfDay = function () {
  const date = new Date(this.valueOf());
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  return date;
};

Date.prototype.endOfDay = function () {
  const date = new Date(this.valueOf());
  date.setHours(23);
  date.setMinutes(59);
  date.setSeconds(59);
  return date;
};

Date.prototype.addMinutes = function (numMinutes) {
  const date = new Date(this.valueOf());
  date.setMinutes(date.getMinutes() + numMinutes);
  return date;
};

/*=============================================================================
 * SCRIPT CONFIGURATIONS *** UPDATE ME!!! ***
 ============================================================================*/

// Example: 12 PM
const HOUR_FORMAT = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
});

// Example: Sat
const DAY_OF_WEEK_FORMAT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
});

// Example: 12
const DAY_OF_MONTH_FORMAT = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
});

/**
 * Widget confugurations. Edit these to customize the widget.
 */
const WIDGET_CONFIGURATIONS = {
  // Number of hours to show in the widget
  numHours: 8,

  // Number of days to show in the widget
  numDays: 5,

  // Calendars to show events from. Empty array means all calendars.
  // Calendar names can be found in the "Calendar" App. The name must be an exact string match.
  calendars: [],

  // Calendar callback app
  // When clicking on the widget, which calendar app should open?
  // Must be one of the supported apps:
  //   - calshow - Default iOS Calendar
  //   - googlecalendar - Google Calendar
  //   - x-fantastical3 - Fantastical
  callbackCalendarApp: 'calshow',

  // Whether or not to use a background image for the widget
  useBackgroundImage: true,

  // If no background image, default grayish background color gradient
  backgroundColor: [new Color("#29323c"), new Color("#1c1c1c")],

  // Font to use in Widget
  font: 'Menlo',

  // Bold Font to use in Widget
  fontBold: 'Menlo-Bold',

  // Text size of the day of week label
  dayOfWeekTextSize: 10,

  // Text size of the event text label
  eventTextSize: 10,

  // Default text color in Widget
  defaultTextColor: Color.white(),

  // Height of Widget's Draw Context
  widgetHeight: 400,

  // Width of Widget's Draw Context
  widgetWidth: 400,

  // Vertical spacing between the day event columns
  dayStackSpacing: 0,

  // Left padding of events in Draw Context
  eventsLeftPadding: 10,

  // Padding of the events text within the event rectangle
  eventsTextPadding: 5,

  // Corner radius of event rectangle in Draw Context
  eventsRounding: 5,

  // Text color of event titles
  eventsTextColor: Color.black(),

  // Thickness of hour/now line
  lineHeight: 2,

  // Color of hour/half-hour line
  lineColor: new Color('#ffffff', 0.3),

  // Width of the hours label column stack
  hoursLabelStackWidth: 30,

  // Vertical spacing, used between day-of-week label and all-day events
  verticalSpacing: 2,
};


/*=============================================================================
 * WIDGET SET UP / PRESENTATION
 ============================================================================*/

const widget = new ListWidget();

await setBackground(widget, WIDGET_CONFIGURATIONS);

const events = await getEvents(WIDGET_CONFIGURATIONS);

drawWidget(widget, events, WIDGET_CONFIGURATIONS);

console.log(`args.widgetParameter: ${JSON.stringify(args.widgetParameter)}`);

if (config.runsInWidget) {
  Script.setWidget(widget);
  Script.complete();
} else if (args.widgetParameter === 'callback') {
  Script.setWidget(widget);
  const timestamp = (new Date().getTime() - new Date('2001/01/01').getTime()) / 1000;
  const callback = new CallbackURL(`${WIDGET_CONFIGURATIONS.callbackCalendarApp}:${timestamp}`);
  callback.open();
  Script.complete();
} else {
  Script.setWidget(widget);
  widget.presentLarge();
  Script.complete();
}

/*=============================================================================
 * DRAW WIDGET
 ============================================================================*/

/**
 * Main draw widget function.
 */
function drawWidget(widget, events, WIDGET_CONFIGURATIONS) {
  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();
  mainStack.spacing = WIDGET_CONFIGURATIONS.dayStackSpacing;

  // Calculate the maximum number of all-day events of the days to draw
  const numAllDayEvents = Object.values(events).map(e => {
    if (e['all-day']) {
      return e['all-day'].length;
    } else {
      return 0;
    }
  });
  const maxNumAllDayEvents = Math.max(...numAllDayEvents);

  // Draw the hour label column
  const hoursLabelStack = mainStack.addStack();
  hoursLabelStack.layoutVertically();
  drawHoursLabelStack(hoursLabelStack, maxNumAllDayEvents, WIDGET_CONFIGURATIONS);

  // Draw one column for each day's events
  Object.keys(events).forEach(day => {
    const dayEventsStack = mainStack.addStack();
    dayEventsStack.layoutVertically();

    const dayEvents = events[day];
    drawDayEventsStack(dayEventsStack, day, dayEvents, maxNumAllDayEvents, WIDGET_CONFIGURATIONS);
  });
}

/**
 * Function to draw events of one day, as a vertical column stack.
 */
function drawDayEventsStack(stack, day, events, maxNumAllDayEvents, {
  defaultTextColor,
  font,
  fontBold,
  dayOfWeekTextSize,
  eventsTextColor,
  eventTextSize,
  numDays,
  numHours,
  widgetHeight,
  widgetWidth,
  eventsLeftPadding,
  eventsTextPadding,
  eventsRounding,
  lineHeight,
  lineColor,
  hoursLabelStackWidth,
  verticalSpacing
}) {
  const halfHourEventHeight = (widgetHeight - verticalSpacing - maxNumAllDayEvents) / (numHours * 2);
  const allDayEventHeight = halfHourEventHeight / 2;
  const stackWidth = (widgetWidth - hoursLabelStackWidth) / numDays;

  const draw = new DrawContext();
  draw.opaque = false;
  draw.respectScreenScale = true;
  draw.size = new Size(stackWidth, widgetHeight);

  // Day day of week label
  draw.setTextColor(defaultTextColor);
  draw.setFont(new Font(fontBold, dayOfWeekTextSize));
  draw.drawTextInRect(
    `${DAY_OF_WEEK_FORMAT.format(new Date(day))} ${DAY_OF_MONTH_FORMAT.format(new Date(day))}`,
    new Rect(
      eventsLeftPadding,
      0,
      stackWidth,
      allDayEventHeight + verticalSpacing,
    )
  );

  // Draw all-day events at the top of the day events stack
  if (events['all-day']) {
    let numAllDayEvents = 1;

    for (let i = 0; i < events['all-day'].length; i++) {
      const { title, color } = events['all-day'][i];

      const eventRectY = numAllDayEvents * allDayEventHeight + i;
      const eventRect = new Rect(
        eventsLeftPadding,
        eventRectY,
        (stackWidth - eventsLeftPadding),
        allDayEventHeight
      );
      const eventPath = new Path();
      eventPath.addRoundedRect(eventRect, eventsRounding, eventsRounding);

      draw.addPath(eventPath);
      draw.setFillColor(new Color(color));
      draw.fillPath();

      // Draw event name text
      draw.setTextColor(eventsTextColor);
      draw.setFont(new Font(font, eventTextSize));
      draw.drawTextInRect(
        `${title}`,
        new Rect(
          eventsLeftPadding + eventsTextPadding,
          eventRectY,
          (stackWidth - eventsLeftPadding) - eventsTextPadding,
          allDayEventHeight
        )
      );

      numAllDayEvents += 1;
    }
  }

  // Y Offset based on number of all-day events
  const offsetY = (maxNumAllDayEvents + 1) * allDayEventHeight + verticalSpacing + maxNumAllDayEvents;

  const currentDate = new Date();

  // Loop through all the hours and draw the lines
  for (let i = 0; i < numHours; i++) {
    const topPointY = offsetY + halfHourEventHeight * 2 * i;
    const midPointY = topPointY + halfHourEventHeight;

    // Draw line at the hour
    const topPath = new Path();
    topPath.addRect(new Rect(eventsLeftPadding, topPointY, stackWidth - eventsLeftPadding, lineHeight));
    draw.addPath(topPath);
    draw.setFillColor(lineColor);
    draw.fillPath();

    // Draw line at the half hour
    const middlePath = new Path();
    middlePath.addRect(new Rect(eventsLeftPadding, midPointY, stackWidth - eventsLeftPadding, lineHeight / 2));
    draw.addPath(middlePath);
    draw.setFillColor(lineColor);
    draw.fillPath();
  }

  // Loop through all the hours and draw the events (on top of the lines)
  for (let i = 0; i < numHours; i++) {

    const currentHourDate = currentDate.addHours(i);
    const currentHourText = HOUR_FORMAT.format(currentHourDate);

    const topPointY = offsetY + halfHourEventHeight * 2 * i;

    // Draw events for this hour (if any)
    const hourEvents = events[currentHourText];
    if (hourEvents) {
      for (let j = 0; j < hourEvents.length; j++) {
        // TODO - determine width of events based on num events in hour
        const { startMinute, title, color, duration } = hourEvents[j];

        // Determine top Y of event
        const eventRectY = topPointY + Math.floor((startMinute * halfHourEventHeight) / 30);

        // Determine height of events
        const eventHeight = Math.floor((duration * halfHourEventHeight) / 30);

        const eventRect = new Rect(
          eventsLeftPadding,
          eventRectY,
          stackWidth - eventsLeftPadding,
          eventHeight
        );
        const eventPath = new Path();
        eventPath.addRoundedRect(eventRect, eventsRounding, eventsRounding);

        draw.addPath(eventPath);
        draw.setFillColor(new Color(color));
        draw.fillPath();

        // Draw event name text
        draw.setTextColor(eventsTextColor);
        draw.setFont(new Font(font, eventTextSize));
        draw.drawTextInRect(
          `${title}`,
          new Rect(
            eventsLeftPadding + eventsTextPadding,
            eventRectY,
            (stackWidth - eventsLeftPadding) - eventsTextPadding,
            eventHeight
          )
        );
      }
    }
  }

  // Draw line at the current time
  const currentMinute = new Date().getMinutes();
  let currentMinuteY = offsetY + (currentMinute * halfHourEventHeight) / 30;
  const currentMinutePath = new Path();
  currentMinutePath.addRect(new Rect(eventsLeftPadding, currentMinuteY, stackWidth, lineHeight));
  draw.addPath(currentMinutePath);
  draw.setFillColor(Color.red());
  draw.fillPath();

  // Put the content on the widget stack
  const drawn = draw.getImage();
  stack.addImage(drawn);
}

/**
 * Function to draw the left-most vertical column stack of the hours labels.
 */
function drawHoursLabelStack(stack, maxNumAllDayEvents, {
  defaultTextColor,
  font,
  eventTextSize,
  numHours,
  widgetHeight,
  lineHeight,
  hoursLabelStackWidth,
  verticalSpacing,
}) {
  const draw = new DrawContext();
  draw.opaque = false;
  draw.respectScreenScale = true;
  draw.size = new Size(hoursLabelStackWidth, widgetHeight);

  const halfHourEventHeight = (widgetHeight - verticalSpacing - maxNumAllDayEvents) / (numHours * 2);
  const allDayEventHeight = halfHourEventHeight / 2;

  // Y Offset based on number of all-day events
  const offsetY = (maxNumAllDayEvents + 1) * allDayEventHeight + verticalSpacing + maxNumAllDayEvents;

  const currentDate = new Date();

  // Loop through all the hours and draw the lines
  for (let i = 0; i < numHours; i++) {

    const currentHourDate = currentDate.addHours(i);
    const currentHourText = HOUR_FORMAT.format(currentHourDate);

    const topPointY = offsetY + halfHourEventHeight * 2 * i - (i * lineHeight);

    // Draw hour text
    draw.setTextColor(defaultTextColor);
    draw.setFont(new Font(font, eventTextSize));
    draw.drawText(`${currentHourText}`, new Point(0, topPointY));
  }

  // Put the content on the widget stack
  const drawn = draw.getImage();
  stack.addImage(drawn);
}

/*=============================================================================
 * FUNCTIONS
 ============================================================================*/

/**
 * Fetch calendar events for the given number of days (from today), and from the given calendars.
 * 
 * Returns an array, where each element is an object in the format: { hour: [events] } 
 */
async function getEvents({ numDays, calendars }) {

  const events = {};

  const now = new Date();

  for (let i = 0; i < numDays; i++) {
    const day = now.addDays(i);
    const startOfDay = day.startOfDay();
    const endOfDay = day.endOfDay();

    const dayEvents = await CalendarEvent.between(startOfDay, endOfDay, calendars);

    const eventsByHour = {};

    dayEvents.forEach(e => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);

      if (e.isAllDay) { // All day events
        if (!eventsByHour['all-day']) {
          eventsByHour['all-day'] = [];
        }
        eventsByHour['all-day'].push({
          title: e.title,
          color: `#${e.calendar.color.hex}`,
        });
      } else { // Other events
        const hourKey = HOUR_FORMAT.format(start);

        if (!eventsByHour[hourKey]) {
          eventsByHour[hourKey] = [];
        }

        let eventDuration = Math.floor(((end - start) / 1000) / 60);

        const eventObj = {
          start,
          end,
          startMinute: start.getMinutes(),
          title: e.title,
          color: `#${e.calendar.color.hex}`,
          duration: eventDuration,
        };

        eventsByHour[hourKey].push(eventObj);
      }
    });

    events[startOfDay] = eventsByHour;
  }

  return events;
}

/**
 * Set the background of the widget.
 * 
 * If useBackgroundImage is false, defaults the background to the given backgroundColor.
 * 
 * Update WIDGET_CONFIGURATIONS to configure. 
 */
async function setBackground(widget, { useBackgroundImage, backgroundColor }) {
  if (useBackgroundImage) {
    // Determine if our image exists and when it was saved.
    const files = FileManager.local();
    const path = files.joinPath(files.documentsDirectory(), 'multi-day-calendar-widget-background');
    const exists = files.fileExists(path);

    // If it exists and we're running in the widget, use photo from cache
    // Or we're invoking the script to run FROM the widget with a widgetParameter
    if (exists && config.runsInWidget || args.widgetParameter === 'callback') {
      widget.backgroundImage = files.readImage(path);

      // If it's missing when running in the widget, fallback to backgroundColor
    } else if (!exists && config.runsInWidget) {
      const bgColor = new LinearGradient();
      bgColor.colors = backgroundColor;
      bgColor.locations = [0.0, 1.0];
      widget.backgroundGradient = bgColor;

      // But if we're running in app, prompt the user for the image.
    } else if (config.runsInApp) {
      const img = await Photos.fromLibrary();
      widget.backgroundImage = img;
      files.writeImage(path, img);
    }
  } else {
    const bgColor = new LinearGradient();
    bgColor.colors = backgroundColor;
    bgColor.locations = [0.0, 1.0];
    widget.backgroundGradient = bgColor;
  }
}