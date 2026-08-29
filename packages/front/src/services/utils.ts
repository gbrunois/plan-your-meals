export class Utils {
  public static toLocaleStringDateFormat(date: Date) {
    return new Date(
      Date.parse(date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))
    )
      .toISOString()
      .substring(0, 10)
  }

  public static emailIsValid(value: string) {
    const pattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value)
  }
}
