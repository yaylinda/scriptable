// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: magic;

/*=============================================================================
 * WIDGET CONFIGURATIONS *** CONFIGURE ME!!! ***
 ============================================================================*/

// NOTE: When setting up this Widget in the Scriptable App,
// make sure to put something (anything) in the "Widget Params" field.

/**
 * Edit these to customize the widget.
 */
const WIDGET_CONFIGURATIONS = {
  // The name or identifier for the widget
  widgetName: 'AggregatedDailyLogWidget',

  // Fields that you want to collect data about each day.
  // These fields will be shown in the Alert when you click on this Widget.
  fields: [
    {
      label   : 'Enough Sleep',
      category: 'SAMPLE_CAT_1',
    },
    {
      label   : 'Shower',
      category: 'SAMPLE_CAT_1',
    },
    {
      label   : 'Exercised',
      category: 'SAMPLE_CAT_1',
    },
    {
      label   : 'Vitamins',
      category: 'SAMPLE_CAT_1',
    },

    {
      label   : 'Vegetables',
      category: 'SAMPLE_CAT_2',
    },
    {
      label   : 'Caffeine',
      category: 'SAMPLE_CAT_2',
    },

    {
      label   : 'Happy',
      category: 'SAMPLE_CAT_3',
    },
    {
      label   : 'Sad',
      category: 'SAMPLE_CAT_3',
    },
  ] as Field[],

  // Fields to show aggregated data for in the Widget
  // NOTE: Make sure this is a proper subset of the items in "fields"
  fieldsToAggregate: [
    {
      label   : 'Enough Sleep',
      category: 'SAMPLE_CAT_1',
    },
    {
      label   : 'Shower',
      category: 'SAMPLE_CAT_1',
    },
    {
      label   : 'Exercised',
      category: 'SAMPLE_CAT_1',
    },
    {
      label   : 'Vitamins',
      category: 'SAMPLE_CAT_1',
    },

    {
      label   : 'Vegetables',
      category: 'SAMPLE_CAT_2',
    },
    {
      label   : 'Caffeine',
      category: 'SAMPLE_CAT_2',
    },

    {
      label   : 'Happy',
      category: 'SAMPLE_CAT_3',
    },
    {
      label   : 'Sad',
      category: 'SAMPLE_CAT_3',
    },
  ] as Field[],

  // Text colors to display for the various field categories from above.
  // If a category's color is not defined here, the default color is 'white'.
  categoryColors: {
    SAMPLE_CAT_1: '#7AE7B9',
    SAMPLE_CAT_2: '#5BD2F0',
    SAMPLE_CAT_3: '#FF6663',
  },

  // Maximum number of days to fetch historical data for
  // NOTE: If you increase this, make sure to play around with the font sizes, padding, and spacing so that the data fits
  numDays: 3,

  // Date format for the Alert title. Ex: "Fri, Nov 6"
  dateTextFormat: new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month  : 'short',
    day    : 'numeric',
  }),

  // Date format for the data grid. Showing the DOW as a letter.
  shortDateFormat: new Intl.DateTimeFormat('en-US', {
    weekday: 'narrow',
  }),

  // Whether to use a background image for the widget.
  // If false, the widget will have a gradient background, defined by "backgroundColor".
  useBackgroundImage: false,

  // If not using a background image, the gradient background color.
  backgroundColor: [new Color('#29323c'), new Color('#1c1c1c')],

  // Padding around the widget
  padding: 5,

  // Font to use in Widget
  font: 'Menlo',

  // Bold Font to use in Widget
  fontBold: 'Menlo-Bold',

  // Horizontal padding under the title text line
  titleTextSpacing: 10,

  // Title text size in the widget
  titleTextSize: 15,

  // Vertical padding between columns
  verticalTextSpacing: 5,

  // Vertical padding between columns of data grid
  verticalDataGridSpacing: 2,

  // Text size
  textSize: 10,
};

/*=============================================================================
 * WIDGET SET UP / PRESENTATION
 ============================================================================*/

// Import and init a ScriptableCache class for this widget
const Cache = importModule('WidgetCache');
// eslint-disable-next-line no-undef
const DAILY_LOG_CACHE = new Cache(WIDGET_CONFIGURATIONS.widgetName) as WidgetCache;

(
  function main() {
    const doMain = async () => {
      const { fields } = WIDGET_CONFIGURATIONS;

      // Fetch data from DailyLogs cache for n days
      const data = await fetchData();

      // Show alert with current data for today (if running script in app).
      // Allows the user to update the value for each field for the current day,
      // and saves the updated data in the Cache.
      if (config.runsInApp && data && data.length) {
        const today = data[0];

        const alert = createAlert(today.dateText, today.fields);

        const response = await alert.present();

        if (response === 0) {
          console.log('Cancel was pressed... doing nothing');
        } else if (response === 1) {
          console.log('Submit was pressed');

          const updatedFields: FieldWithValue[] = [];
          for (let i = 0; i < fields.length; i++) {
            const value = alert.textFieldValue(i);
            updatedFields.push({
              ...fields[i],
              value,
            });
          }

          DAILY_LOG_CACHE.write(today.dateKey, updatedFields);
          data[0].fields = [...updatedFields];
        }
      }

      // Create widget with data
      const widget = createWidget(data);

      await setBackground(widget);

      // Set widget
      Script.setWidget(widget);
      Script.complete();
    };

    doMain();
  }
)();

/*=============================================================================
 * ALERT
 ============================================================================*/

/**
 * Creates an alert.
 *
 * @param {string} dateText - The date text to be displayed in the alert title.
 * @param {FieldWithValue[]} fields - An array of fields with their corresponding values.
 * @return {Alert} The created alert.
 */
function createAlert(dateText: string, fields: FieldWithValue[]): Alert {
  // console.log(`Creating alert, dateText=${dateText}, fields=${JSON.stringify(fields)}`);

  const alert = new Alert();
  alert.title = `Daily Log for ${dateText}`;

  fields.forEach(field => {
    alert.addTextField(field.label, `${field.value}`);
  });

  alert.addAction('Cancel'); // 0
  alert.addAction('Submit'); // 1

  return alert;
}

/*=============================================================================
 * DRAW WIDGET
 ============================================================================*/

function createWidget(data: DayFieldsWithValue[]) {
  console.log(`Creating widget data=${JSON.stringify(data)}`);

  const {
    padding,
    fontBold,
    titleTextSize,
    titleTextSpacing,
    fieldsToAggregate,
    categoryColors,
    verticalTextSpacing,
    verticalDataGridSpacing,
    shortDateFormat,
  } = WIDGET_CONFIGURATIONS;

  // Widget
  const widget = new ListWidget();
  widget.setPadding(padding, padding, padding, padding);

  // Main stack
  const stack = widget.addStack();
  stack.layoutVertically();

  // Top stack
  const topStack = stack.addStack();
  topStack.layoutHorizontally();

  // Title stack and text of widget
  const titleTextLine = topStack.addText('Daily Logs');
  titleTextLine.textColor = Color.white();
  titleTextLine.font = new Font(fontBold, titleTextSize);
  topStack.addSpacer(titleTextSpacing);

  // Main bottom stack
  // Data will be added column by column
  const bottomStack = stack.addStack();
  bottomStack.layoutHorizontally();

  // Field label column
  addColumnToStack(bottomStack, [{ value: '' }]
    .concat(fieldsToAggregate
      .map(field => ({
        value: field.label,
        color: categoryColors[field.category as keyof typeof categoryColors],
      }))));

  bottomStack.addSpacer(verticalTextSpacing);

  // Use to keep track of how many days each field was completed
  const fieldCompletionCounts: Record<string, number> = {};
  fieldsToAggregate.forEach(field => fieldCompletionCounts[field.label] = 0);

  // Collect data to format one column for each day's data
  const dataByDay = data.reverse();

  // One column per day
  dataByDay.forEach(dayData => {
    const date = parseDateFromKey(dayData.dateKey);

    const columnData: Cell[] = [];

    // First cell: date label
    columnData.push({
      value : `${shortDateFormat.format(date)}`,
      isBold: true,
      align : 'center',
    });

    // One cell per field data
    fieldsToAggregate.forEach(field => {
      const fieldFromDay = dayData.fields.find(d => d.label === field.label);
      if (fieldFromDay) {
        columnData.push({ value: fieldFromDay.value ? '✅' : '❌' });
        fieldCompletionCounts[fieldFromDay.label] += fieldFromDay.value ? 1 : 0;
      } else {
        columnData.push({ value: '?' });
      }
    });

    addColumnToStack(bottomStack, columnData);
    bottomStack.addSpacer(verticalDataGridSpacing);
  });

  // Vertical spacing between data grid column and completion percentage
  bottomStack.addSpacer(verticalTextSpacing);

  // Column of percentage for each field
  const completionData: Cell[] = [{ value: ' ' }];

  fieldsToAggregate.forEach(field => {
    const completionCount = fieldCompletionCounts[field.label];
    let completionRate = (
      completionCount * 100 / data.length
    ).toFixed(0);

    // Add some left padding for numbers of 1 or 2 digits
    if (completionRate.length === 1) {
      completionRate = '  ' + completionRate;
    } else if (completionRate.length === 2) {
      completionRate = ' ' + completionRate;
    }

    completionData.push({
      value: `[${completionRate}%]`,
      align: 'right',
      color: completionCount === data.length ? '#66ff00' : '#ffffff',
    });
  });

  addColumnToStack(bottomStack, completionData);

  return widget;
}

/**
 * Adds a column to a widget stack.
 *
 * @param {WidgetStack} stack - The widget stack to add the column to.
 * @param {Cell[]} columnData - The data of the cells in the column.
 * @return {void}
 */
function addColumnToStack(stack: WidgetStack, columnData: Cell[]): void {
  // console.log(`columnData: ${JSON.stringify(columnData)}`);

  const {verticalTextSpacing} = WIDGET_CONFIGURATIONS;

  const column = stack.addStack();
  column.layoutVertically();
  column.spacing = verticalTextSpacing;
  columnData.forEach(cd => addCellToColumn(column, cd));
}

/**
 * Adds a cell to the given column.
 *
 * @param {WidgetStack} column - The column to add the cell to.
 * @param {Cell} data - The data to be added to the cell.
 *
 * @return {void}
 */
function addCellToColumn(column: WidgetStack, data: Cell): void {
  const cell = column.addStack();
  cell.layoutVertically();
  addTextToStack(cell, data);
}

/**
 * Adds text to the given stack with the specified configurations.
 *
 * @param {WidgetStack} stack - The stack to add the text to.
 * @param {Cell} data - The data object containing the text and its configurations.
 */
function addTextToStack(stack: WidgetStack, data: Cell) {
  // console.log(`addTextToStack, data: ${JSON.stringify(data)}`);

  const {font, fontBold, textSize} = WIDGET_CONFIGURATIONS;

  const {
    value,
    color,
    isBold,
    align,
  } = data;

  const textLine = stack.addText(value);

  textLine.font = new Font(isBold ? fontBold : font, textSize);

  if (color) {
    textLine.textColor = new Color(color);
  }

  if (align === 'center') {
    textLine.centerAlignText();
  } else if (align === 'right') {
    textLine.rightAlignText();
  } else {
    textLine.leftAlignText();
  }
}

/*=============================================================================
 * FETCH DATA
 ============================================================================*/

/**
 * Fetches data for a specified number of days.
 *
 * @returns {Promise<DayFieldsWithValue[]>} The fetched data for each day.
 */
async function fetchData(): Promise<DayFieldsWithValue[]> {
  const {
    dateTextFormat,
    numDays,
  } = WIDGET_CONFIGURATIONS;

  // Determine today's date
  let startingDate = new Date();
  if (startingDate.getHours() < 5) {
    startingDate = addDays(startingDate, -1);
  }

  const data: DayFieldsWithValue[] = [];

  for (let i = 0; i < numDays; i++) {
    const date = addDays(startingDate, -1 * i);
    const dateText = dateTextFormat.format(date);
    const dateCacheKey = `${date.getFullYear()}_${padNumber(date.getMonth())}_${padNumber(date.getDate())}`;
    const dateCacheData = await DAILY_LOG_CACHE.read<FieldWithValue[]>(dateCacheKey);

    const dayData: DayFieldsWithValue = {
      dateKey: dateCacheKey,
      dateText,
      fields : [],
    };

    if (dateCacheData) {
      // Found cached data for the date
      dayData.fields = [...dateCacheData];
    } else {
      if (i === 0) {
        // This means it's a new day, so we need to initialize field data and create a new log entry
        console.log(`Cache miss for key=${dateCacheKey}, creating new log entry...`);
        const newDayData = initializeFields();
        DAILY_LOG_CACHE.write(dateCacheKey, newDayData);
        dayData.fields = [...newDayData];
      } else {
        console.warn(`Cache miss for key=${dateCacheKey}, breaking out of loop...`);
        break;
      }
    }

    data.push(dayData);
  }

  console.log(`Got ${data.length} days of data`);

  return data;
}

/**
 * Initializes the fields for a widget based on the configurations.
 *
 * @returns {FieldWithValue[]} - An array of fields with their initial values.
 */
function initializeFields(): FieldWithValue[] {
  const { fields } = WIDGET_CONFIGURATIONS;

  return fields.map((field) => (
    {
      label   : field.label,
      category: field.category,
      value   : '',
    }
  ));
}

/**
 * Pads a number with leading zero if it is less than 10.
 *
 * @param {number} num - The number to be padded.
 * @return {string|number} - The padded number. If the number is less than 10, it returns the padded number as a string, otherwise, it returns the number as is.
 */
function padNumber(num: number): string | number {
  return num < 10 ? `0${num}` : num;
}

/**
 * Parses a date from a given date key.
 *
 * @param {string} dateKey - The date key to parse.
 * @return {Date} The parsed date.
 */
function parseDateFromKey(dateKey: string): Date {
  const dateParts = dateKey.split('_');

  return new Date(
    parseInt(dateParts[0]), // year
    parseInt(dateParts[1]), // month (0-indexed)
    parseInt(dateParts[2]), // day of month
  );
}

/*=============================================================================
 * HELPER FUNCTIONS
 ============================================================================*/

/**
 * Sets the background for the widget.
 *
 * @param {WidgetStack} widget - The widget to set the background for.
 *
 * @return {Promise<void>} - A promise that resolves when the background is set.
 */
async function setBackground(widget: ListWidget): Promise<void> {

  const {
    useBackgroundImage,
    backgroundColor,
    widgetName,
  } = WIDGET_CONFIGURATIONS;

  if (useBackgroundImage) {
    // Determine if our image exists and when it was saved.
    const files = FileManager.local();
    const path = files.joinPath(files.documentsDirectory(), `${widgetName}-background`);
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
 * Adds a specified number of days to a given date.
 *
 * @param {Date} input - The input date.
 * @param {number} numdays - The number of days to add.
 * @returns {Date} - The new date after adding the specified number of days.
 */
const addDays = (input: Date, numdays: number): Date => {
  const date = new Date(input);
  date.setDate(date.getDate() + numdays);
  return date;
};

/*=============================================================================
 * TYPES
 ============================================================================*/

interface Field {
  label: string;
  category: string;
}

interface FieldWithValue extends Field {
  value: string;
}

interface DayFieldsWithValue {
  dateText: string,
  dateKey: string,
  fields: FieldWithValue[],
}

interface Cell {
  value: string,
  align?: 'center' | 'right',
  isBold?: boolean,
  color?: string,
}

// This is needed so typescript behaves.
export {};
