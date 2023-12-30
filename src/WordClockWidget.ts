// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;
/*=========================================================
 * WIDGET CONFIGURATIONS
 ========================================================*/

const WIDGET_CONFIGURATIONS = {

  // If this is true, it opens a prompt to select a 
  // background image from the photo gallery,
  // when the widget is run from the Scriptable app
  useBackgroundImage: true,

  // If useBackgroundImage is set to false, this background
  // color gradient will be use. Feel free to set to your
  // own colors
  backgroundColor: [
    new Color("#29323c"), 
    new Color("#1c1c1c")
  ],

  // The font to use for the words in the word clock
  font: 'Menlo-Bold',

  // The font size to use for the words in the word clock
  fontSize: 14,

  // The color to use for the "highlighted" words.
  // The "highlighted" words tells the time
  textColorHighlighted: Color.white(),

  // The color of the highlighted text shadow
  textShadowHighlighted: Color.cyan(),

  // The radius of the highlighted text shadow
  textShadowHighlightedRadius: 3,

  // The color of the words that are NOT highlighted
  textColorBackground: Color.lightGray(),

  // The opacity of the non-highlighted words 
  // 1 -> opaque; 0 -> transparent
  textAlphaBackground: 0.5,

  // The spacing between the lines of words of the clock
  spacingBetweenLines: 4,
  
  // The spacing between each individual word, within the
  // same line
  spacingBetweenWords: 8,
}

/*=========================================================
 * WIDGET SET UP / PRESENTATION
 ========================================================*/

/**
 * The words to display for the clock. If you want to use
 * other words, make sure to update getHighlightedWords()
 * accordingly.
 */ 
const TIME_WORDS_MATRIX = [
  ['IT', 'IS', 'HALF', 'TEN'],
  ['QUARTER', 'TWENTY'],
  ['FIVE', 'MINUTES', 'TO'],
  ['PAST', 'TWO', 'THREE'],
  ['ONE', 'FOUR', 'FIVE'],
  ['SIX', 'SEVEN', 'EIGHT'],
  ['NINE', 'TEN', 'ELEVEN'],
  ['TWELVE', 'O\'CLOCK'],
];

const widget = new ListWidget();

await setBackground(widget, WIDGET_CONFIGURATIONS);

drawWidget(widget, WIDGET_CONFIGURATIONS);

if (config.runsInWidget) {
  Script.setWidget(widget);
  Script.complete();
} else {
  Script.setWidget(widget);
  widget.presentSmall();
  Script.complete();
}

/*=========================================================
 * FUNCTIONS
 ========================================================*/

/**
 * Main widget rendering function.
 * 
 * Lays out the widget as a vertical list of stacks, 
 * containing texts.
 */ 
function drawWidget(widget, { 
  font,
  fontSize,
  textColorHighlighted,
  textShadowHighlighted,
  textShadowHighlightedRadius,
  textColorBackground,
  textAlphaBackground,
  spacingBetweenLines,
  spacingBetweenWords,
}) {
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.spacing = spacingBetweenLines;

  const highlightedWords = getHighlightedWords();

  for (let i = 0; i < TIME_WORDS_MATRIX.length; i++) {
    const numWords = TIME_WORDS_MATRIX[i].length;
    
    const textStack = mainStack.addStack();
    textStack.layoutHorizontally();
    textStack.spacing = spacingBetweenWords;

    for (let j = 0; j < numWords; j++) {
      const text = textStack.addText(TIME_WORDS_MATRIX[i][j]);
      text.font = new Font(font, fontSize);
      if (highlightedWords[i] && highlightedWords[i][j]) {
        text.textColor = textColorHighlighted;
        text.shadowColor = textShadowHighlighted;
        text.shadowRadius = textShadowHighlightedRadius;
      } else {
        text.textColor = textColorBackground;
        text.alpha = textAlphaBackground;
      }
    }
  }
}

/**
 * Based on the input time, returns an array of arrays of
 * which "time" words should be highlighted.
 * 
 * This is used as a look-up when adding texts to the 
 * stack.
 */
function getHighlightedWords() {
  // The dimensions of this should match the dimensions of
  // TIME_WORDS_MATRIX
  const defaultHighlights = [
    [true, true, false, false],
    [false, false],
    [false, false, false],
    [false, false, false],
    [false, false, false],
    [false, false, false],
    [false, false, false],
    [false, true],
  ];

  const date = new Date();
  let hour = date.getHours();
  const minute = date.getMinutes();

  if (minute <= 30) {
    // highlight "past"
    defaultHighlights[3][0] = true;
  } else {
    // highlight "to"
    defaultHighlights[2][2] = true;
    // increment hour
    hour = hour + 1;
  }

 if (minute >= 5 && minute < 10) {
    // highlight "five"
    defaultHighlights[2][0] = true;
    // highlight "minutes"
    defaultHighlights[2][1] = true;
  } else if (minute >= 10 && minute < 15) {
    // highlight "ten"
    defaultHighlights[0][3] = true;
    // highlight "minutes"
    defaultHighlights[2][1] = true;
  } else if (minute >= 15 && minute < 20) {
    // highlight "quarter"
    defaultHighlights[1][0] = true;
  } else if (minute >= 20 && minute < 25) {
    // highlight "twenty"
    defaultHighlights[1][1] = true;
    // highlight "minutes"
    defaultHighlights[2][1] = true;
  } else if (minute >= 25 && minute < 30) {
    // highlight "twenty"
    defaultHighlights[1][1] = true;
    // highlight "five"
    defaultHighlights[2][0] = true;
    // highlight "minutes"
    defaultHighlights[2][1] = true;
  } else if (minute >= 30 && minute < 35) {
    // highlight "half"
    defaultHighlights[0][2] = true;
  } else if (minute >= 35 && minute < 40) {
    // highlight "twenty"
    defaultHighlights[1][1] = true;
    // highlight "five"
    defaultHighlights[2][0] = true;
    // highlight "minutes"
    defaultHighlights[2][1] = true;
  } else if (minute >= 40 && minute < 45) {
    // highlight "twenty"
    defaultHighlights[1][1] = true;
    // highlight "minutes"
    defaultHighlights[2][1] = true;
  } else if (minute >= 45 && minute < 50) {
    // highlight "quarter"
    defaultHighlights[1][0] = true;
  } else if (minute >= 50 && minute < 55) {
    // highlight "ten"
    defaultHighlights[0][3] = true;
    // highlight "minutes"
    defaultHighlights[2][1] = true;
  } else if (minute >= 55) {
    // highlight "five"
    defaultHighlights[2][0] = true;
    // highlight "minutes"
    defaultHighlights[2][1] = true;
  }
  
  if (hour > 12) {
    hour = hour - 12;
  }

  if (hour === 1) {
    defaultHighlights[4][0] = true;
  } else if (hour === 2) {
    defaultHighlights[3][1] = true;
  } else if (hour === 3) {
    defaultHighlights[3][2] = true;
  } else if (hour === 4) {
    defaultHighlights[4][1] = true;
  } else if (hour === 5) {
    defaultHighlights[4][2] = true;
  } else if (hour === 6) {
    defaultHighlights[5][0] = true;
  } else if (hour === 7) {
    defaultHighlights[5][1] = true;
  } else if (hour === 8) {
    defaultHighlights[5][2] = true;
  } else if (hour === 9) {
    defaultHighlights[6][0] = true;
  } else if (hour === 10) {
    defaultHighlights[6][1] = true;
  } else if (hour === 11) {
    defaultHighlights[6][2] = true;
  } else if (hour === 12) {
    defaultHighlights[7][0] = true;
  } 

  return defaultHighlights;
}

/**
 * Sets the background on the widget.
 * 
 * If the script/widget is running as a widget, 
 * set the background from the cache. 
 * 
 * If no background image is in the cache,
 * default to the gray gradient.
 * 
 * If running in the app, prompt the user to select a 
 * background image. Persist in cache.
 */ 
 async function setBackground(widget, { 
   useBackgroundImage, 
   backgroundColor,
}) {
  if (useBackgroundImage) {
    // Determine if our image exists and when it was saved.
    const files = FileManager.local();
    const path = files.joinPath(
      files.documentsDirectory(), 
      'word-clock-widget-background'
    );
    const exists = files.fileExists(path);

    // If it exists and we're running in the widget, 
    // use photo from cache
    // Or we're invoking the script to run FROM the widget 
    // with a widgetParameter
    if (exists && config.runsInWidget 
        || args.widgetParameter === 'callback') {
      widget.backgroundImage = files.readImage(path);

      // If it's missing when running in the widget, 
      // fallback to backgroundColor
    } else if (!exists && config.runsInWidget) {
      const bgColor = new LinearGradient();
      bgColor.colors = backgroundColor;
      bgColor.locations = [0.0, 1.0];
      widget.backgroundGradient = bgColor;

      // But if we're running in app, prompt the user for 
      // the image.
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