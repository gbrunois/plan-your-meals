import { MenuDate } from '@/api/days/menu-date'
import { WEEK_PAGE_NAME } from '@/router-names'
import { daysService } from './days.service'

export function getDateFromUrlParamsOrToday(params: {
  year: string
  month: string
  day: string
}): MenuDate {
  const { year, month, day } = params
  if (!year) {
    return daysService.getNow()
  } else {
    return new MenuDate(`${year}-${month}-${day}`)
  }
}

export function toCalendarRoute(date: MenuDate) {
  const [year, month, day] = date.toString().split('-')
  return { name: WEEK_PAGE_NAME, params: { year, month, day } }
}
