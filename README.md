# scriptable
Playing around with various scripts for the Scriptable app on iOS.

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

## DailyLogWidget
Customizable list of things and colors. Creates a new "log" for each day at 5 AM (time is also customizable for when you want the new day to start). 

Click on the Widget to bring up a dialog to update things you've completed for the day. 

![DailyLogWidget](/images/DailyLogWidgetPreview.gif)

### [Upcoming] DailyLogAggregatorWidget
Aggregates your data from `DailyLogWidget` and presents the data in a series of charts.

## Cache
Copied from [evandcoleman](https://github.com/evandcoleman/scriptable/blob/main/scripts/cache.js). This is used to cache values for the TerminalWidget, DailyLogWidget.
