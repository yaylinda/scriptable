// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: magic;
/**************************************
 * Configurations
 *************************************/

const DAILY_LOG_CACHE_NAME = 'DailyLogWidget';

const FIELDS = [
    'Shower',
    'Enough Sleep',
    'Cooked',
    'Ate at Restaurant',
    'Lunch',
    'Chores',
    'Happy (General)',
    'Happy (Relationship)',
];

const NUM_DAYS = 10;

const PADDING = 5;
const TITLE_TEXT_SIZE = 10;
const TITLE_TEXT_SPACING = 10;

const TEXT_SPACING = 4;
const TEXT_SIZE = 8;

/**************************************
 * Initial Setups
 *************************************/

// Import Cache module
const Cache = importModule('Cache');

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

// Fetch data from DailyLogWidget cache
const data = await fetchData();

// Aggregate data
const transformed = transformData(data);

// Create widget with data
const widget = createWidget(transformed);

// Set widget
Script.setWidget(widget);
Script.complete();

/**************************************
 * Widget
 *************************************/

function createWidget(transformed) {
  console.log('Creating widget...');
  console.log(JSON.stringify(transformed));

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

  const titleTextLine = topStack.addText(`Aggregated Daily Logs`);
  titleTextLine.textColor = Color.white();
  titleTextLine.font = new Font('Menlo-Bold', TITLE_TEXT_SIZE);

  // Horizontal spacer under title string
  stack.addSpacer(TITLE_TEXT_SPACING);

  // Main bottom stack
  // Will be set up with 2 columns to show field data
  const bottomStack = stack.addStack();
  bottomStack.layoutHorizontally();

  // Left stack
  const leftStack = bottomStack.addStack();
  leftStack.layoutVertically();
  leftStack.spacing = TEXT_SPACING;
  FIELDS.forEach(field => {
    addTextToStack(leftStack, field, Color.white());
  });

  bottomStack.addSpacer(TEXT_SPACING);

  // Right stack
  const rightStack = bottomStack.addStack();
  rightStack.layoutVertically();
  rightStack.spacing = TEXT_SPACING;
  FIELDS.forEach(field => {
    addFieldDataToStack(rightStack, field, transformed);
  });

  return widget;
}

function addFieldDataToStack(stack, field, data) {
  const fieldData = data[field];

  let fieldDataText = '';
  let numCompletedDays = 0;
  fieldData.forEach(value => {
    fieldDataText += `${value ? '✅' : '❌'} `;
    numCompletedDays += value ? 1 : 0;
  });

  fieldDataText += `[${numCompletedDays}/${fieldData.length}]`;

  addTextToStack(stack, fieldDataText, Color.white());
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
 * Fetch Data
 *************************************/

async function fetchData() {

  const dailyLogCache = new Cache(DAILY_LOG_CACHE_NAME);

  const data = [];

  // Determine day
  let date = new Date();
  if (date.getHours() < 5) {
    date = date.addDays(-1);
  }

  for (let i = 0; i < NUM_DAYS; i++) {
    const dateCacheKey = `${date.getFullYear()}_${padNumber(date.getMonth())}_${padNumber(date.getDate())}`;
    const dayData = await dailyLogCache.read(dateCacheKey);

    if (!dayData) {
      console.log(`Cache miss for key=${dateCacheKey}, breaking out of loop...`);
      break;
    }

    data.push(dayData);

    date = date.addDays(-1);
  }

  console.log(`Got ${data.length} days of data`);

  return data;
}

function padNumber(num) {
  return num < 10 ? `0${num}` : num;
}

/**************************************
 * Aggregate Data
 *************************************/

function transformData(data) {

  // Aggregated data will only contain data for fields that are "active"
  // Which are fields that we are recording today
  const activeFields = new Set(data[0].map(f => f.label));
  console.log(`Active fields: ${activeFields}`);

  const transformed = {};
  activeFields.forEach(f => {
    transformed[f] = [];
  })

  for (let i = 0; i < data.length; i++) {
    const fields = data[i];
    for (let field of fields) {
      if (transformed[field.label]) {
        transformed[field.label][i] = !!field.value;
      }
    }
  }
  
  return transformed;
}