# scriptable
Playing around with various scripts for the Scriptable app on iOS.

## CalendarEventsWidget
This widget displays all-day events, and any upcoming events within the moving window of the next 6 hours (number of hours is configurable).

![CalendarEventsWidget](/images/CalendarEventsWidget.png)
![CalendarEventsWidget2](/images/CalendarEventsWidget2.png)



## DailyLogWidget v2 (AggregatedDailyLogs)
And updated look to the DailyLogWidget, showing a data grid of activites completed for each day.

Features:
- Customizable list of activites
- Customizable number of days to show in the grid
- Automatically creates a new log entry for the new day at 5 AM (time is customizable)
- Clicking on Widget brings up a dialog to update activites completed or not completed
- The data for each day is saved in iCloud (JSON format), where the filename is in the format `YYYY_MM_DD`

![AggregatedDailyLogs](/images/AggregatedDailyLogs.png)

## DailyLogWidget
Customizable list of things and colors. Creates a new "log" for each day at 5 AM (time is also customizable for when you want the new day to start). 

Click on the Widget to bring up a dialog to update things you've completed for the day. The data for each day is saved in iCloud (JSON format), in it's own file, where the filename name is in the format `YYYY-MM-DD`.

![DailyLogWidget](/images/DailyLogWidgetPreview.gif)

## TerminalWidget
Inspired by [evandcoleman](https://github.com/evandcoleman/scriptable), but re-written for my own data.

Currently, this widget shows information about:
- next calendar event
- next work calendar event
- weather
- location
- days until period start/end
- device stats (battery and screen brightness)

![TerminalWidget](/images/TerminalWidget.png)

## Cache
Copied from [evandcoleman](https://github.com/evandcoleman/scriptable/blob/main/scripts/cache.js). This is used to cache values for the TerminalWidget, DailyLogWidget.
