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
  backgroundColor: [new Color("#29323c"), new Color("#1c1c1c")],

  // The font to use for the words in the word clock
  font: "Menlo-Bold",

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
};

/*=========================================================
 * WIDGET SET UP / PRESENTATION
 ========================================================*/

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
function drawWidget(
  widget,
  {
    font,
    fontSize,
    textColorHighlighted,
    textShadowHighlighted,
    textShadowHighlightedRadius,
    textColorBackground,
    textAlphaBackground,
    spacingBetweenLines,
    spacingBetweenWords,
  }
) {
  const mainStack = widget.addStack();
	mainStack.layoutHorizontally()

	const leftStack = mainStack.addStack();
	leftStack.layoutzVertically();
	leftStack.addImage("https://img.pokemondb.net/sprites/black-white/anim/normal/bulbasaur.gif")
	leftStack.addDate(new Date())

	const rightStack = mainStack.addStack();
	rightStack.layoutzVertically()
	// TODO - weather, number of events


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
async function setBackground(widget, { useBackgroundImage, backgroundColor }) {
  if (useBackgroundImage) {
    // Determine if our image exists and when it was saved.
    const files = FileManager.local();
    const path = files.joinPath(
      files.documentsDirectory(),
      "poke-widget-background"
    );
    const exists = files.fileExists(path);

    // If it exists and we're running in the widget,
    // use photo from cache
    // Or we're invoking the script to run FROM the widget
    // with a widgetParameter
    if (
      (exists && config.runsInWidget) ||
      args.widgetParameter === "callback"
    ) {
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
