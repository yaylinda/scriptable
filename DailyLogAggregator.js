// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: magic;

/**************************************
 * Configurations
 *************************************/

// NOTE: This script uses the Cache script (https://github.com/yaylinda/scriptable/blob/main/Cache.js)
// Make sure to add the Cache script in Scriptable as well!

// This is the name of the directory (under Scriptable) in iCloud, to store the daily log files.
const DAILY_LOG_CACHE_NAME = 'DailyLogs';

// Text colors to display for the various field categories (default: white)
const CATEGORY_CONFIGURATIONS = {
  // TODO - Replace me with your own data!
  SAMPLE_CAT_1: {
    color: '#7AE7B9',
  },
  SAMPLE_CAT_2: {
    color: '#5BD2F0',
  },
  SAMPLE_CAT_3: {
    color: '#FF6663',
  },
};

// Fields to collect data for in the Alert
// Alert shows up when you click on the Widget
const FIELDS = [
  // TODO - Replace me with your own data!
  { label: 'Enough Sleep', category: 'SAMPLE_CAT_1' },
  { label: 'Shower', category: 'SAMPLE_CAT_1' },
  { label: 'Exercised', category: 'SAMPLE_CAT_1' },
  { label: 'Vitamins', category: 'SAMPLE_CAT_1' },

  { label: 'Vegetables', category: 'SAMPLE_CAT_2' },
  { label: 'Caffeine', category: 'SAMPLE_CAT_2' },

  { label: 'Happy', category: 'SAMPLE_CAT_3' },
  { label: 'Sad', category: 'SAMPLE_CAT_3' },
];

// Fields to show aggregated data for in the Widget
// NOTE: Make sure this is a proper subset of the items in FIELDS
const FIELDS_TO_AGGREGATE = [
  // TODO - Replace me with your own data!
  { label: 'Enough Sleep', category: 'SAMPLE_CAT_1' },
  { label: 'Shower', category: 'SAMPLE_CAT_1' },
  { label: 'Exercised', category: 'SAMPLE_CAT_1' },
  { label: 'Vitamins', category: 'SAMPLE_CAT_1' },

  { label: 'Vegetables', category: 'SAMPLE_CAT_2' },
  { label: 'Caffeine', category: 'SAMPLE_CAT_2' },

  { label: 'Happy', category: 'SAMPLE_CAT_3' },
  { label: 'Sad', category: 'SAMPLE_CAT_3' },
];

// Date format for the Alert title. Ex: "Fri, Nov 6"
const DATE_TEXT_FORMAT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short', 
  month: 'short', 
  day: 'numeric',
});

// Date format for the data grid. Showing the DOW as a letter.
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  weekday: 'narrow', 
})

// Maximum number of days to fetch historical data for
// NOTE: If you increase this, make sure to play around with the font sizes so that the data fits
const NUM_DAYS = 7;

// Padding around the widget
const PADDING = 5;

// Horizontal padding under the title text line
const TITLE_TEXT_SPACING = 10;

// Title text size in the widget
const TITLE_TEXT_SIZE = 15;

// Vertical padding between columns
const VERTICAL_TEXT_SPACING = 5;

// Vertical padding between columns of data grid
const VERTICAL_DATA_GRID_SPACING = 2;

// Text size
const TEXT_SIZE = 10;

/**************************************
 * Initial Setups
 *************************************/

// Import Cache module
const Cache = importModule('Cache');
const DAILY_LOG_CACHE = new Cache(DAILY_LOG_CACHE_NAME);

/**
 * Convenience function to add days to a Date.
 * 
 * @param {*} days The number of days to add
 */
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

// Fetch data from DailyLogs cache
const data = await fetchData();

// Show alert with current data (if running script in app)
if (config.runsInApp) {
  const alert = createAlert(data.dateText, data.today);

  const response = await alert.present();

  if (response === 0) {
    console.log('Cancel was pressed... doing nothing');
  } else if (response === 1) {
      console.log('Submit was pressed');

      const updatedFields = [];
      for (let i = 0; i < FIELDS.length; i++) {
        const value = alert.textFieldValue(i);
        updatedFields.push({
          label: FIELDS[i].label, 
          category: FIELDS[i].category, 
          value, 
        });
      }

      DAILY_LOG_CACHE.write(data.dateKey, updatedFields);
      data.today = updatedFields;
      data.fields[0] = updatedFields;
  }
}

// Aggregate data
// const transformed = transformData(data.dateKey, data);

// Create widget with data
const widget = createWidget(data);

// Set widget
Script.setWidget(widget);
Script.complete();

/**************************************
 * Alert
 *************************************/

function createAlert(dateText, fields) {
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

/**************************************
 * Widget
 *************************************/

function createWidget(data) {
  console.log(`Creating widget data=${JSON.stringify(data)}`);

  // Widget
  const widget = new ListWidget();
  const bgColor = new LinearGradient();
  bgColor.colors = [new Color("#29323c"), new Color("#1c1c1c")];
  bgColor.locations = [0.0, 1.0];
  widget.backgroundGradient = bgColor;
  widget.setPadding(PADDING, PADDING, PADDING, PADDING);

  // Main stack
  const stack = widget.addStack();
  stack.layoutVertically();

  // Top stack
  const topStack = stack.addStack();
  topStack.layoutHorizontally();

  // Title stack and text of widget
  const titleTextLine = topStack.addText(`Daily Logs`);
  titleTextLine.textColor = Color.white();
  titleTextLine.font = new Font('Menlo-Bold', TITLE_TEXT_SIZE);
  topStack.addSpacer(TITLE_TEXT_SPACING);

  // Main bottom stack
  // Data will be added column by column
  const bottomStack = stack.addStack();
  bottomStack.layoutHorizontally();

  // Field label column
  addColumnToStack(bottomStack, [{ value: '' }]
    .concat(FIELDS_TO_AGGREGATE
      .map(field => ({
        value: field.label, 
        color: CATEGORY_CONFIGURATIONS[field.category].color, 
      }))));

  bottomStack.addSpacer(VERTICAL_TEXT_SPACING);

  // Use to keep track of how many days each field was completed
  const fieldCompletionCounts = {};
  FIELDS_TO_AGGREGATE.forEach(field => fieldCompletionCounts[field.label] = 0);

  // Collect data to format one column for each day's data
  const dataByDay = data.fields.reverse();

  let date = parseDateFromKey(data.dateKey);
  date = date.addDays(-1 * (dataByDay.length - 1));
  
  // One column per day
  dataByDay.forEach(dayData => {
    const columnData = [];

    // First cell: date label
    columnData.push({
      value: `${SHORT_DATE_FORMAT.format(date)}`,
      isBold: true,
      align: 'center',
    });
    
    // One cell per field data
    FIELDS_TO_AGGREGATE.forEach(field => {
      const fieldFromDay = dayData.find(d => d.label === field.label);
      if (fieldFromDay) {
        columnData.push({ value: fieldFromDay.value ? '✅' : '❌' });
        fieldCompletionCounts[fieldFromDay.label] += fieldFromDay.value ? 1 : 0;
      } else {
        columnData.push({ value: '?'});
      }
    });
    
    addColumnToStack(bottomStack, columnData);
    bottomStack.addSpacer(VERTICAL_DATA_GRID_SPACING);
    date = date.addDays(1);
  });
  
  // Vertical spacing between data grid column and completion percentage
  bottomStack.addSpacer(VERTICAL_TEXT_SPACING);

  // Column of percentage for each field
  const completionData = [{ value: ' '}];

  FIELDS_TO_AGGREGATE.forEach(field => {
    const completionCount = fieldCompletionCounts[field.label];
    let completionRate = (completionCount * 100 / data.fields.length).toFixed(0);

    // Add some left padding for numbers of 1 or 2 digits
    if (completionRate.length === 1) {
      completionRate = '  ' + completionRate;
    } else if (completionRate.length === 2) {
      completionRate = ' ' + completionRate;
    }

    completionData.push({
      value: `[${completionRate}%]`, 
      align: 'right',
      color: completionCount === data.fields.length ? '#66ff00' : '',
    });
  });

  addColumnToStack(bottomStack, completionData);

  return widget;
}

function addColumnToStack(stack, columnData) {
  // console.log(`columnData: ${JSON.stringify(columnData)}`);

  const column = stack.addStack();
  column.layoutVertically();
  column.spacing = VERTICAL_TEXT_SPACING;
  columnData.forEach(cd => addCellToColumn(column, cd));
}

function addCellToColumn(column, data) {
  const cell = column.addStack();
  cell.layoutVertically();
  addTextToStack(cell, data);
}

function addTextToStack(stack, data) {
  console.log(`addTextToStack, data: ${JSON.stringify(data)}`);
  const { value, color, isBold, align } = data;

  const textLine = stack.addText(value);

  textLine.font = new Font(`Menlo${isBold ? '-Bold' : ''}`, TEXT_SIZE);

  if (color) {
    textLine.color = new Color(color);
  }

  if (align === 'center') {
    textLine.centerAlignText();
  } else if (align === 'right') {
    textLine.rightAlignText();
  } else {
    textLine.leftAlignText();
  }
}

/**************************************
 * Fetch Data
 *************************************/

async function fetchData() {

  // Determine day
  let date = new Date();
  if (date.getHours() < 5) {
    date = date.addDays(-1);
  }

  // Format today's date for display
  const dateText = DATE_TEXT_FORMAT.format(date);
  const dateKey = `${date.getFullYear()}_${padNumber(date.getMonth())}_${padNumber(date.getDate())}`;

  const fields = [];

  for (let i = 0; i < NUM_DAYS; i++) {
    const dateCacheKey = `${date.getFullYear()}_${padNumber(date.getMonth())}_${padNumber(date.getDate())}`;
    let dayData = await DAILY_LOG_CACHE.read(dateCacheKey);

    if (!dayData) {
      if (i === 0) {
        // This means it's a new day, so we need to initialize field data and create a new log entry
        console.log(`Cache miss for key=${dateCacheKey}, creating new log entry...`);
        dayData = initializeFields();
        DAILY_LOG_CACHE.write(dateCacheKey, dayData);
      } else {
        console.log(`Cache miss for key=${dateCacheKey}, breaking out of loop...`);
        break;
      }
    }

    fields.push(dayData);

    date = date.addDays(-1);
  }

  console.log(`Got ${fields.length} days of data`);

  return {
    today: fields[0],
    fields,
    dateText,
    dateKey,
  };
}

function initializeFields() {
  return FIELDS.map((field) => ({
    label: field.label,
    category: field.category,
    value: '',
  }));
}

function padNumber(num) {
  return num < 10 ? `0${num}` : num;
}

/**************************************
 * Aggregate Data
 *************************************/

function parseDateFromKey(dateKey) {
  const dateParts = dateKey.split('_');

  return new Date(
    parseInt(dateParts[0]), // year
    parseInt(dateParts[1]), // month (0-indexed)
    parseInt(dateParts[2]), // day of month
  );
}
