import { DayMenu } from './day-menu'
import { MenuDate } from './menu-date'
import type { IDayResponse } from './day-response.type'

export class DayMenuBuilder {
  public static aMenuDay(date: MenuDate): DayMenuBuilder {
    return new DayMenuBuilder(date)
  }

  public static fromDatabase(response: IDayResponse) {
    const dayMenu = new DayMenu(new MenuDate(response.date))
    dayMenu.lunch = response.lunch
    dayMenu.dinner = response.dinner
    return dayMenu
  }
  private dayMenu: DayMenu

  private constructor(date: MenuDate) {
    this.dayMenu = new DayMenu(date)
  }

  public build() {
    return this.dayMenu
  }
}
