import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.locale('fr')
dayjs.extend(advancedFormat)

const FORMAT = 'YYYY-MM-DD'

export class MenuDate {
  constructor(private dateString: string) {}

  public toString() {
    return this.dateString
  }

  public toLongFormat(): string {
    return dayjs(this.dateString, FORMAT).format('dddd Do MMMM')
  }

  public toMonthFormat(): string {
    return dayjs(this.dateString, FORMAT).format('MMMM YYYY')
  }

  public toShortFormat(): string {
    return dayjs(this.dateString, FORMAT).format('Do MMMM')
  }
}
