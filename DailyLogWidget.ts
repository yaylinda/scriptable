
// NOTE: This script uses the Cache script (https://github.com/yaylinda/scriptable/blob/main/Cache.js)
// Make sure to add the Cache script in Scriptable as well!

// NOTE 2: When setting up the widget, make sure to put something (anything) in the "Widget Params" field.

/*-----------------
 * Configurations
 *---------------*/

// TODO - This is sample data. Customize me!
const CATEGORY_CONFIGURATIONS = {
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

// TODO - This is sample data. Customize me!
const FIELDS = [
  { label: 'Enough Sleep', category: 'SAMPLE_CAT_1' },
  { label: 'Shower', category: 'SAMPLE_CAT_1' },
  { label: 'Exercised', category: 'SAMPLE_CAT_1' },
  { label: 'Vitamins', category: 'SAMPLE_CAT_1' },

  { label: 'Vegetables', category: 'SAMPLE_CAT_2' },
  { label: 'Caffeine', category: 'SAMPLE_CAT_2' },

  { label: 'Happy', category: 'SAMPLE_CAT_3' },
  { label: 'Sad', category: 'SAMPLE_CAT_3' },
];

// Number of columns to display the fields in
const NUM_COLUMNS = 4;

// Text size for field data information
const TEXT_SIZE = 6;

// Spacing between lines of text of field data
const TEXT_SPACING = 4;

// Text size for the header text. Ex: "Daily Log for Fri, Nov 6"
const DATE_TEXT_SIZE = 12;

// Spacing below the header text
const DATE_TEXT_SPACING = 10;

// Date format. Ex: "Fri, Nov 6"
const DATE_TEXT_FORMAT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

// What time should we start a daily log for the new day? (24hr format)
const NEW_DAY_START = 5;

// Whether or not to use a background image for the widget (if false, use gradient color)
const USE_BACKGROUND_IMAGE = false;

/**************************************
 * Initial Setups
 *************************************/

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

// Import and setup Cache
const Cache = importModule('Cache');
const cache = new Cache('DailyLogWidget');

// Fetch data
const data = await fetchData();

// Show alert with current data (if running script in app)
if (config.runsInApp) {
  const alert = createAlert(data);

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

    cache.write(data.dateKey, updatedFields);
    data.fields = updatedFields;
  }
}

// Create widget with data
const widget = createWidget(data);

// Set background image of widget, if flag is true
if (USE_BACKGROUND_IMAGE) {
  // Determine if our image exists and when it was saved.
  const files = FileManager.local();
  const path = files.joinPath(files.documentsDirectory(), 'daily-log-widget-background');
  const exists = files.fileExists(path);

  // If it exists and we're running in the widget, use photo from cache
  if (exists && config.runsInWidget) {
    widget.backgroundImage = files.readImage(path);

  // If it's missing when running in the widget, use a gray background.
  } else if (!exists && config.runsInWidget) {
    const bgColor = new LinearGradient();
    bgColor.colors = [new Color("#29323c"), new Color("#1c1c1c")];
    bgColor.locations = [0.0, 1.0];
    widget.backgroundGradient = bgColor;

  // But if we're running in app, prompt the user for the image.
  } else if (config.runsInApp && !args.widgetParameter){
    const img = await Photos.fromLibrary();
    widget.backgroundImage = img;
    files.writeImage(path, img);
  }
}

// Set widget
Script.setWidget(widget);
Script.complete();

/**************************************
 * Alert
 *************************************/

function createAlert(data) {
  console.log('Creating alert with data: ' + JSON.stringify(data));

  const alert = new Alert();
  alert.title = `Daily Log for ${data.dateText}`;

  data.fields.forEach(field => {
    alert.addTextField(field.label, `${field.value}`);
  });

  alert.addAction('Cancel'); // 0
  alert.addAction('Submit'); // 1

  return alert;
}

/**************************************
 * Widget Layout
 *************************************/

function createWidget(data) {
  console.log(`Creating widget with data: ${JSON.stringify(data)}`);

  // Widget
  const widget = new ListWidget();
  const bgColor = new LinearGradient();
  bgColor.colors = [new Color("#29323c"), new Color("#1c1c1c")];
  bgColor.locations = [0.0, 1.0];
  widget.backgroundGradient = bgColor;
  widget.setPadding(10, 10, 10, 10);

  // Main stack
  const stack = widget.addStack();
  stack.layoutVertically();

  // Top stack
  const topStack = stack.addStack();
  topStack.layoutHorizontally();

  const dateTextLine = topStack.addText(`Daily Log for ${data.dateText}`);
  dateTextLine.textColor = Color.white();
  dateTextLine.font = new Font('Menlo', DATE_TEXT_SIZE);

  // Horizontal spacer under date string
  stack.addSpacer(DATE_TEXT_SPACING);

  // Main bottom stack
  // Will be set up with 2 columns to show field data
  const bottomStack = stack.addStack();
  bottomStack.layoutHorizontally();

  // Split the field data amongst N columns, and display the data
  const chunkedFields = chunkArray(data.fields, NUM_COLUMNS);
  chunkedFields.forEach(chunk => {
    formatColumn(bottomStack, chunk);
    bottomStack.addSpacer(10);
  });

  return widget;
}

function formatColumn(parentStack, fields) {
  // Indicator for if the field was done or not
  const indicatorStack = parentStack.addStack();
  indicatorStack.layoutVertically();
  indicatorStack.spacing = TEXT_SPACING;
  fields.forEach(field => {
    addTextToStack(indicatorStack, field.value ? '✅ ' : '❌');
  });

  // Horizontal spacer between indicator and label
  parentStack.addSpacer(TEXT_SPACING);

  // Label for the field
  const labelStack = parentStack.addStack();
  labelStack.layoutVertically();
  labelStack.spacing = TEXT_SPACING;
  fields.forEach(field => {
    addTextToStack(labelStack, field.label, new Color(CATEGORY_CONFIGURATIONS[field.category].color));
  });
}

function addTextToStack(stack, text, textColor) {
  const textLine = stack.addText(text);
  if (textColor) {
    textLine.textColor = textColor;
  }
  textLine.font = new Font('Menlo', TEXT_SIZE);
  textLine.leftAlignText();
}

/**************************************
 * Fetch Data (date, fields, etc)
 *************************************/

async function fetchData() {

  // Determine day
  let date = new Date();
  if (date.getHours() < NEW_DAY_START) {
    date = date.addDays(-1);
  }

  // Format date for display
  const dateText = DATE_TEXT_FORMAT.format(date);

  // Format date for key cache
  const dateKey = `${date.getFullYear()}_${padNumber(date.getMonth())}_${padNumber(date.getDate())}`;

  // Fetch fields from Cache (or initialize)
  let fields = await cache.read(dateKey);
  if (!fields) {
    fields = initializeFields();
    cache.write(dateKey, fields);
  }

  return {
    dateText,
    dateKey,
    fields,
  }
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
 * Helper Functions
 *************************************/

function chunkArray(arr, chunkCount) {
  const chunks = [];
  while (arr.length) {
    const chunkSize = Math.ceil(arr.length / chunkCount--);
    const chunk = arr.slice(0, chunkSize);
    chunks.push(chunk);
    arr = arr.slice(chunkSize);
  }
  return chunks;
}