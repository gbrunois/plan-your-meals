import { DayMenu } from '@/api/days/day-menu'
import { DayMenuBuilder } from '@/api/days/day-menu.builder'
import { MenuDate } from '@/api/days/menu-date'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'

dayjs.extend(weekday)

const FORMAT = 'YYYY-MM-DD'

export type CalendarViewMode = 'month' | 'week'

function findDay(days: DayMenu[], date: string): DayMenu | undefined {
  return days.find((d) => d.date.toString() === date)
}

class DaysService {
  public createADay(date: MenuDate): DayMenu {
    return DayMenuBuilder.aMenuDay(date).build()
  }

  public createDays(
    days: DayMenu[],
    beginDate: MenuDate,
    endDate: MenuDate
  ): DayMenu[] {
    let i = dayjs(beginDate.toString(), FORMAT)
    const end = dayjs(endDate.toString(), FORMAT)
    const result: DayMenu[] = []
    while (i.toDate() <= end.toDate()) {
      result.push(
        findDay(days, i.format(FORMAT)) ||
          this.createADay(new MenuDate(i.format(FORMAT)))
      )
      i = i.add(1, 'day')
    }
    return result
  }
  public getNow(): MenuDate {
    return new MenuDate(dayjs().format(FORMAT))
  }
  public getLastDayOfWeek(date: MenuDate): MenuDate {
    return new MenuDate(
      dayjs(date.toString(), FORMAT).weekday(6).format(FORMAT)
    )
  }
  public getFirstDayOfWeek(date: MenuDate): MenuDate {
    return new MenuDate(
      dayjs(date.toString(), FORMAT).weekday(0).format(FORMAT)
    )
  }
  public getPreviousStartDayOfWeek(date: MenuDate): MenuDate {
    return new MenuDate(
      dayjs(date.toString(), FORMAT).weekday(-7).format(FORMAT)
    )
  }
  public getNextStartDayOfWeek(date: MenuDate): MenuDate {
    return new MenuDate(
      dayjs(date.toString(), FORMAT).weekday(7).format(FORMAT)
    )
  }
  /**
   * Days to display for the given view mode: the 7 days starting at `date`
   * in week mode, every whole week touching the month of `date` in month mode.
   */
  public getPeriod(
    date: MenuDate,
    viewMode: CalendarViewMode
  ): { beginDate: MenuDate; endDate: MenuDate } {
    if (viewMode === 'week') {
      return {
        beginDate: date,
        endDate: new MenuDate(
          dayjs(date.toString(), FORMAT).add(6, 'day').format(FORMAT)
        ),
      }
    }
    const day = dayjs(date.toString(), FORMAT)
    return {
      beginDate: this.getFirstDayOfWeek(
        new MenuDate(day.startOf('month').format(FORMAT))
      ),
      endDate: this.getLastDayOfWeek(
        new MenuDate(day.endOf('month').format(FORMAT))
      ),
    }
  }
  /**
   * Move `date` by one period (a week or a month depending on the view mode).
   * Month moves are clamped to the target month's last day (31 Jan -> 28 Feb).
   */
  public shiftPeriod(
    date: MenuDate,
    direction: 1 | -1,
    viewMode: CalendarViewMode
  ): MenuDate {
    return new MenuDate(
      dayjs(date.toString(), FORMAT).add(direction, viewMode).format(FORMAT)
    )
  }
  public getPreviousDay(date: MenuDate): MenuDate {
    return new MenuDate(
      dayjs(date.toString(), FORMAT).add(-1, 'day').format(FORMAT)
    )
  }
  public getNextDay(date: MenuDate): MenuDate {
    return new MenuDate(
      dayjs(date.toString(), FORMAT).add(1, 'day').format(FORMAT)
    )
  }
}

export const daysService = new DaysService()
