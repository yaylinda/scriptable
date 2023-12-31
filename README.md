# scriptable
My collection of various Scriptable Widgets and utilities for the [Scriptable iOS App](https://scriptable.app/)! 

To use one of the Widgets, just create a new Widget from the Scriptable App, and copy and paste the code from the `.js` file 😄.

If you'd like to contribute to the code, see [Local Development](https://github.com/yaylinda/scriptable#LocalDevelopment).

## Widgets List
- [DiscordWidget](https://github.com/yaylinda/scriptable#DiscordWidget)
- [WordClockWidget](https://github.com/yaylinda/scriptable#WordClockWidget)
- [MultiDayCalendarWidget](https://github.com/yaylinda/scriptable#MultiDayCalendarWidget)
- [CalendarEventsWidget](https://github.com/yaylinda/scriptable#calendareventswidget)
- [DailyLogWidget v2 (AggregatedDailyLogs)](https://github.com/yaylinda/scriptable#dailylogwidget-v2-aggregateddailylogs)
- [DailyLogWidget](https://github.com/yaylinda/scriptable#dailylogwidget)
- [TerminalWidget](https://github.com/yaylinda/scriptable#terminalwidget)

### DiscordWidget
Displays useful information about your day in a Discord-themed widget! 

Currently shows information such as:
- Today's date
- Weather (temperature, feels like, high, low, conditions) in your local area
- Any upcoming events on your calendar

Please make sure to update `WIDGET_CONFIGURATIONS` to set things like your openweather.api API key, and to see other configurable variables, such as:
- Banner color
- Background colors
- Icon

I would also reccommend getting the [GenerateTransparentBackground](https://github.com/yaylinda/scriptable/blob/main/GenerateTransparentBackground.js) script and using the output of that as the background for the Discord Widget. Then you can get a look like the screenshot below:

![DiscordWidget](/images/DiscordWidget.png)

### WordClockWidget
This widget displays the current (or most recently refreshed) time as a word clock. The widget can be customized to use a background photo, or background color; font name, size, and color, and other things. See `WIDGET_CONFIGURATIONS` for other configurable variables.

![WordClockWidget](/images/WordClockWidget.png)

##### NOTE
Due to the delay in the Scriptable widget refresh, the time displayed might be a bit behind... there is really no workaround for this issue at this time. 

### MultiDayCalendarWidget
This widget displays events from your calendars for the next given number of days, with a customizable window of the number of hours to show. The number of days, number of hours, and the starting hour, are configurable within the script. The configuration also allows for filtering events from certain calendars. Please use the `LARGE` widget size for best display results. 

All widget configurations/behaviors can be found by updating the `WIDGET_CONFIGURATIONS` (comments and descriptions included in the code).

![MultiDayCalendarWidget](/images/MultiDayCalendarWidget.png)
![MultiDayCalendarWidgetSetup](/images/MultiDayCalendarWidgetSetup.png)

### CalendarEventsWidget
This widget displays all-day events, and any upcoming events within the moving window of the next 6 hours (number of hours is configurable). Also allows for filtering events from certain calendars, and will open the calendar of your choice on-press. 

All widget configurations/behaviors can be found by updating `WIDGET_CONFIGURATIONS` (comments and descriptions included in the code).

![CalendarEventsWidget](/images/CalendarEventsWidget.png)
![CalendarEventsWidget2](/images/CalendarEventsWidget2.png)

#### Set Up
Configure the widget set-up on your homescreen, as shown in the below screenshot: 
![CalendarEventsWidgetSetup](/images/CalendarEventsWidgetSetup.png)

#### TODO
Multiple events for an hour are currently drawn on top of each other. Need to reduce the width of events based on how many are in each hour.

### DailyLogWidget V2 (AggregatedDailyLogs)
An updated look to the `DailyLogWidget`, showing a data grid of activites completed for each day.

#### Features:
- Customizable list of activites
- Customizable number of days to show in the grid
- Automatically creates a new log entry for the new day at 5 AM (time is customizable)
- Clicking on Widget brings up a dialog to update activites completed or not completed
- The data for each day is saved in iCloud (JSON format), where the filename is in the format `YYYY_MM_DD`

![AggregatedDailyLogs](/images/AggregatedDailyLogs.png)

### DailyLogWidget
Customizable list of things and colors. Creates a new "log" for each day at 5 AM (time is also customizable for when you want the new day to start). 

Click on the Widget to bring up a dialog to update things you've completed for the day. The data for each day is saved in iCloud (JSON format), in it's own file, where the filename name is in the format `YYYY-MM-DD`.

![DailyLogWidget](/images/DailyLogWidgetPreview.gif)

### TerminalWidget
Inspired by [evandcoleman](https://github.com/evandcoleman/scriptable), but re-written for my own data.

Currently, this widget shows information about:
- next calendar event
- next work calendar event
- weather
- location
- days until period start/end
- device stats (battery and screen brightness)

![TerminalWidget](/images/TerminalWidget.png)

## Local Development

This section is only relevant if you're interested in contributing to the source code for the widgets.

If you just want to use one of the Widgets, just create a new Widget from the Scriptable App, and copy and paste the code from the `.js` file 😄.

### Initial Setup
#### Find Scriptable App iCloud Drive Directory
On your Mac, determine the path of the **Scriptable App iCloud Drive Directory** path. This directory should already exist if you have downloaded the app on your iPhone.

You can export this as an env var `SCRIPTABLE_DIR`. 
```shell
export SCRIPTABLE_DIR='~/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents'
```

#### Clone Repo and Branch
```shell
# Go to whatever directory you keep your projects/code files normally
cd ~/Developer

# Clone this repo
git clone https://github.com/yaylinda/scriptable.git

# Create your feature branch
git checkout -b <FEATURE_BRANCH_NAME>

# Install deps
npm install

# Now you're ready to code!
```

### Update Source Code
All the source code can be found in the `src` directory of this repo. There is one `.ts` file for each corresponding Widget. We use `tsc` to generate the associated `.js` file.

The Scriptable App only recognizes `.js` files that are in the **Scriptable App iCloud Drive Directory** as Widgets. However, it's much more pleasant writing code in Typescript, which is why we have this compilation process.

#### Compile and Generate
Once you've made the desired changes to the TS source code, run `npm run compile`, which does the following:
1. Compiles the TS, and generates the JS files as output
2. Copies the updated JS files into the **Scriptable App iCloud Drive Directory** (it will use the value of `SCRIPTABLE_DIR`)
    - **NOTE:** this will copy ALL of the JS files into your Scriptable App

#### Test the New Widget
You should see the new JS file in the **Scriptable App iCloud Drive Directory** on your Mac, and the Scriptable App should have the new widget code! 

Run it to verify the desired behavior.

If it looks good, push the changes to your branch and put up a PR. Note that the changes will include the TS source code, and the generated JS files. 

Thank you 🙏!
