// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: magic;

/*=============================================================================
 * Types
 ============================================================================*/
interface CalendarEventData {
  start?: Date,
  end?: Date,
  startMinute?: number,
  title: string,
  color: string,
  duration?: number,
}

type CalendarEventsByHour = Record<'all-day' | string, CalendarEventData[]>


/*=============================================================================
 * CONSTANTS
 ============================================================================*/

const addHours = (input: Date, numHours: number) => {
  const date = new Date(input.valueOf());
  date.setHours(date.getHours() + numHours);
  return date;
};

const addMinutes = (input: Date, numMinutes: number) => {
  const date = new Date(input);
  date.setMinutes(date.getMinutes() + numMinutes);
  return date;
};

/*=============================================================================
 * WIDGET CONFIGURATIONS *** CONFIGURE ME!!! ***
 ============================================================================*/

// Example: 12 PM
const HOUR_FORMAT = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
});

// Example: Saturday
const DAY_OF_WEEK_FORMAT = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
});

// Example: 12
const DAY_OF_MONTH_FORMAT = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
});


/**
 * Widget confugurations. Edit these to customize the widget.
 */
const WIDGET_CONFIGURATIONS = {
  // Number of hours to show in the agenda
  numHours: 6,

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

  // If no background, default grayish background color gradient
  backgroundColor: [new Color('#29323c'), new Color('#1c1c1c')],

  // Font to use in Widget
  font: 'Menlo',

  // Bold Font to use in Widget
  fontBold: 'Menlo-Bold',

  // Default text size in Widget
  defaultTextSize: 10,

  // Larger text size in Widget
  largeTextSize: 20,

  // Default text color in Widget
  defaultTextColor: Color.white(),

  // Default spacing between elements
  defaultSpacer: 10,

  // Smaller spacing between elements
  smallSpacer: 5,

  // Height of Widget's Draw Context
  widgetHeight: 400,

  // Width of Widget's Draw Context
  widgetWidth: 400,

  // Default padding in Draw Context
  padding: 10,

  // Left padding of events in Draw Context
  eventsLeftPadding: 80,

  // Corner radius of events in Draw Context
  eventsRounding: 10,

  // Text color of event titles
  eventsTextColor: Color.black(),

  // Thickness of hour/now line
  lineHeight: 4,

  // Color of hour/half-hour line
  lineColor: new Color('#ffffff', 0.3),
};

/*=============================================================================
 * WIDGET SET UP / PRESENTATION
 ============================================================================*/

/**
 *
 */
(function main() {
  const doMain = async () => {
    const widget = new ListWidget();

    await setBackground(widget);

    const events = await getEvents();
    console.log(JSON.stringify(events));

    drawWidget(widget, events);

    console.log(`args.widgetParameter: ${JSON.stringify(args.widgetParameter)}`);

    if (config.runsInWidget) {
      Script.setWidget(widget);
      Script.complete();
    } else if (args.widgetParameter === 'callback') {
      const timestamp = (new Date().getTime() - new Date('2001/01/01').getTime()) / 1000;
      const callback = new CallbackURL(`${WIDGET_CONFIGURATIONS.callbackCalendarApp}:${timestamp}`);
      callback.open();
      Script.complete();
    } else {
      Script.setWidget(widget);
      widget.presentMedium();
      Script.complete();
    }
  };

  doMain();
})();

/*=============================================================================
 * DRAW WIDGET
 ============================================================================*/

/**
 * Draw a widget by adding stacks and drawing the left and right stack contents.
 *
 * @param {ListWidget} widget - The widget to draw on.
 * @param {CalendarEventsByHour} events - The calendar events to display.
 */
function drawWidget(widget: ListWidget, events: CalendarEventsByHour) {
  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();
  mainStack.spacing = 30;

  // Left stack contains date, and all day events
  const leftStack = mainStack.addStack();
  leftStack.layoutVertically();

  // Right stack contains calendar events
  const rightStack = mainStack.addStack();
  rightStack.layoutVertically();

  drawLeftStack(leftStack, events);
  drawRightStack(rightStack, events);
}

/**
 * Draws the left stack of the widget with the given stack and events.
 *
 * @param {WidgetStack} stack - The stack to draw the left stack on.
 * @param {CalendarEventsByHour} events - The events to display.
 */
function drawLeftStack(stack: WidgetStack, events: CalendarEventsByHour) {
  const {
    font,
    fontBold,
    defaultTextSize,
    largeTextSize,
    defaultTextColor,
    defaultSpacer,
    smallSpacer,
  } = WIDGET_CONFIGURATIONS;

  const currentDate = new Date();

  const dateStack = stack.addStack();
  dateStack.layoutHorizontally();

  const dowText = dateStack.addText(DAY_OF_WEEK_FORMAT.format(currentDate).toUpperCase());
  dowText.textColor = defaultTextColor;
  dowText.font = new Font(font, largeTextSize);

  dateStack.addSpacer(smallSpacer);

  const domText = dateStack.addText(DAY_OF_MONTH_FORMAT.format(currentDate));
  domText.textColor = defaultTextColor;
  domText.font = new Font(fontBold, largeTextSize);

  stack.addSpacer(defaultSpacer);

  const allDayEvents = events['all-day'];

  if (allDayEvents) {
    const allDayEventsText = stack.addText('All-day events');
    allDayEventsText.textColor = defaultTextColor;
    allDayEventsText.font = new Font(fontBold, defaultTextSize);

    stack.addSpacer(smallSpacer);

    for (let event of allDayEvents) {
      const eventStack = stack.addStack();
      eventStack.layoutHorizontally();

      const calendarIconText = eventStack.addText('\u2759');
      calendarIconText.textColor = new Color(event.color);
      calendarIconText.font = new Font(font, defaultTextSize);

      eventStack.addSpacer(smallSpacer);

      const calendarEventText = eventStack.addText(event.title);
      calendarEventText.textColor = defaultTextColor;
      calendarEventText.font = new Font(font, defaultTextSize);

      stack.addSpacer(smallSpacer);
    }
  } else {
    const noAllDayEventsText = stack.addText('No all-day events');
    noAllDayEventsText.textColor = defaultTextColor;
    noAllDayEventsText.font = new Font(fontBold, defaultTextSize);
  }
}

/**
 * Draws a right-aligned stack of events on a widget.
 *
 * @param {WidgetStack} stack - The widget stack to add the drawn image to.
 * @param {CalendarEventsByHour} events - An object containing events grouped by hour.
 */
function drawRightStack(stack: WidgetStack, events: CalendarEventsByHour) {
  const {
    defaultTextColor,
    font,
    largeTextSize,
    eventsTextColor,
    numHours,
    widgetHeight,
    widgetWidth,
    padding,
    eventsLeftPadding,
    eventsRounding,
    lineHeight,
    lineColor,
  } = WIDGET_CONFIGURATIONS;

  const halfHourEventHeight = widgetHeight / (numHours * 2);

  const draw = new DrawContext();
  draw.opaque = false;
  draw.respectScreenScale = true;
  draw.size = new Size(widgetWidth, widgetHeight);

  const currentDate = new Date();

  // Loop through all the hours and draw the lines
  for (let i = 0; i < numHours; i++) {

    const currentHourDate = addHours(currentDate, i);
    const currentHourText = HOUR_FORMAT.format(currentHourDate);

    const topPointY = halfHourEventHeight * 2 * i;
    const midPointY = topPointY + halfHourEventHeight;

    // Draw line at the hour
    const topPath = new Path();
    topPath.addRect(new Rect(eventsLeftPadding - padding, topPointY, widgetWidth, lineHeight));
    draw.addPath(topPath);
    draw.setFillColor(lineColor);
    draw.fillPath();

    // Draw line at the half hour
    const middlePath = new Path();
    middlePath.addRect(new Rect(eventsLeftPadding - padding, midPointY, widgetWidth, lineHeight / 2));
    draw.addPath(middlePath);
    draw.setFillColor(lineColor);
    draw.fillPath();

    // Draw hour text
    draw.setTextColor(defaultTextColor);
    draw.setFont(new Font(font, largeTextSize));
    draw.drawText(`${currentHourText}`, new Point(0, topPointY));
  }

  // Loop through all the hours and draw the events (on top of the lines)
  for (let i = 0; i < numHours; i++) {

    const currentHourDate =  addHours(currentDate, i);
    const currentHourText = HOUR_FORMAT.format(currentHourDate);

    const topPointY = halfHourEventHeight * 2 * i;
    // const midPointY = topPointY + halfHourEventHeight;

    // Draw events for this hour (if any)
    const hourEvents = events[currentHourText];
    if (hourEvents) {
      for (let j = 0; j < hourEvents.length; j++) {
        // TODO - determine width of events based on num events in hour
        const { startMinute, title, color, duration } = hourEvents[j];

        // Determine top Y of event
        const eventRectY = topPointY + Math.floor(((startMinute || 0) * halfHourEventHeight) / 30);

        // Determine height of events
        const eventHeight = Math.floor(((duration || 0) * halfHourEventHeight) / 30);

        const eventRect = new Rect(
          eventsLeftPadding + padding,
          eventRectY,
          widgetWidth - (eventsLeftPadding + padding * 3),
          eventHeight
        );
        const eventPath = new Path();
        eventPath.addRoundedRect(eventRect, eventsRounding, eventsRounding);

        draw.addPath(eventPath);
        draw.setFillColor(new Color(color));
        draw.fillPath();

        // Draw event name text
        draw.setTextColor(eventsTextColor);
        draw.setFont(new Font(font, largeTextSize));
        draw.drawText(`${title}`, new Point(eventsLeftPadding + padding + padding, eventRectY + padding / 2));
      }
    }
  }

  // Draw line at the current time
  const currentMinute = new Date().getMinutes();
  let currentMinuteY = (currentMinute * halfHourEventHeight) / 30;
  const currentMinutePath = new Path();
  currentMinutePath.addRect(new Rect(eventsLeftPadding, currentMinuteY, widgetWidth, lineHeight));
  draw.addPath(currentMinutePath);
  draw.setFillColor(Color.red());
  draw.fillPath();

  // Put the content on the widget stack
  const drawn = draw.getImage();
  stack.addImage(drawn);
}

/*=============================================================================
 * FUNCTIONS
 ============================================================================*/

/**
 * Sets the background for the widget.
 *
 * @param {WidgetStack} widget - The widget to set the background for.
 *
 * @return {Promise<void>} - A promise that resolves when the background is set.
 */
async function setBackground(widget: ListWidget): Promise<void> {

  const { useBackgroundImage, backgroundColor } = WIDGET_CONFIGURATIONS;

  if (useBackgroundImage) {
    // Determine if our image exists and when it was saved.
    const files = FileManager.local();
    const path = files.joinPath(files.documentsDirectory(), 'calendar-events-widget-background');
    const exists = files.fileExists(path);

    // If it exists, and we're running in the widget, use photo from cache
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

/**
 * Retrieves events based on the specified configurations.
 * @async
 * @returns {Promise<CalendarEventsByHour>} - A Promise that resolves to an object containing events grouped by hour.
 */
async function getEvents() {
  const { numHours, calendars } = WIDGET_CONFIGURATIONS;

  const todayEvents = await CalendarEvent.today([]);
  const tomorrowEvents = await CalendarEvent.tomorrow([]);
  const combinedEvents = todayEvents.concat(tomorrowEvents);

  let now = new Date();
  now = addMinutes(now, now.getMinutes() * -1);
  const inNumHours = addHours(now, numHours);

  const eventsByHour: CalendarEventsByHour = {} as CalendarEventsByHour;

  combinedEvents.forEach((event) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    // Filter for events that:
    //   - start between now and numHours from now
    //   - are in the specified array of calendars (if any)
    if (start <= inNumHours && end > now && (calendars.length === 0 || calendars.includes(event.calendar.title))) {
      if (event.isAllDay) { // All-day events
        if (!eventsByHour['all-day']) {
          eventsByHour['all-day'] = [];
        }
        eventsByHour['all-day'].push({
          title: event.title,
          color: `#${event.calendar.color.hex}`,
        });
      } else if (start < now && end > now) { // Events that started before the current hour, but have not yet ended
        const hourKey = HOUR_FORMAT.format(now);

        if (!eventsByHour[hourKey]) {
          eventsByHour[hourKey] = [];
        }

        const diff = end.getTime() - start.getTime();
        const eventDuration = Math.floor((diff / 1000) / 60);

        eventsByHour[hourKey].push({
          start,
          end,
          startMinute: start.getMinutes(),
          title: event.title,
          color: `#${event.calendar.color.hex}`,
          duration: eventDuration,
        });

      } else { // Events that start between now and inNumHours
        const hourKey = HOUR_FORMAT.format(start);

        if (!eventsByHour[hourKey]) {
          eventsByHour[hourKey] = [];
        }

        const diff = end.getTime() - start.getTime();
        const eventDuration = Math.floor((diff / 1000) / 60);

        eventsByHour[hourKey].push({
          start,
          end,
          startMinute: start.getMinutes(),
          title: event.title,
          color: `#${event.calendar.color.hex}`,
          duration: eventDuration,
        });
      }
    }
  });

  return eventsByHour;
}
