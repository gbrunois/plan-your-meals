import { daysService } from '@/services/days.service'
import { MenuDate } from '@/api/days/menu-date.ts'
import { describe, expect, it } from 'vitest'

describe('Service - DaysService', () => {
  it('build a day', () => {
    const A_DATE = new MenuDate('2018-08-09')
    const expected = {
      date: A_DATE,
      dinner: '',
      lunch: '',
    }
    expect(daysService.createADay(A_DATE)).toEqual(expected)
  })

  it('should return getPreviousStartDayOfWeeky', () => {
    expect(
      daysService.getPreviousStartDayOfWeek(new MenuDate('2018-01-01'))
    ).toEqual(new MenuDate('2017-12-25'))
  })

  it('should return getNextStartDayOfWeek', () => {
    expect(
      daysService.getNextStartDayOfWeek(new MenuDate('2018-01-01'))
    ).toEqual(new MenuDate('2018-01-08'))
  })

  it('should return getLastDayOfWeek', () => {
    expect(daysService.getLastDayOfWeek(new MenuDate('2018-01-01'))).toEqual(
      new MenuDate('2018-01-07')
    )
  })

  it('should return getFirstDayOfWeek', () => {
    expect(daysService.getFirstDayOfWeek(new MenuDate('2018-01-01'))).toEqual(
      new MenuDate('2018-01-01')
    )
  })

  describe('getPeriod', () => {
    it('should return the 7 days starting at the date in week mode', () => {
      expect(daysService.getPeriod(new MenuDate('2018-01-04'), 'week')).toEqual(
        {
          beginDate: new MenuDate('2018-01-04'),
          endDate: new MenuDate('2018-01-10'),
        }
      )
    })

    it('should return every week touching the month in month mode', () => {
      expect(
        daysService.getPeriod(new MenuDate('2025-04-07'), 'month')
      ).toEqual({
        beginDate: new MenuDate('2025-03-31'),
        endDate: new MenuDate('2025-05-04'),
      })
    })
  })

  describe('shiftPeriod', () => {
    it('should move by a week in week mode', () => {
      expect(
        daysService.shiftPeriod(new MenuDate('2018-01-04'), 1, 'week')
      ).toEqual(new MenuDate('2018-01-11'))
      expect(
        daysService.shiftPeriod(new MenuDate('2018-01-04'), -1, 'week')
      ).toEqual(new MenuDate('2017-12-28'))
    })

    it('should move by a month and clamp to its last day', () => {
      expect(
        daysService.shiftPeriod(new MenuDate('2018-01-31'), 1, 'month')
      ).toEqual(new MenuDate('2018-02-28'))
      expect(
        daysService.shiftPeriod(new MenuDate('2018-01-15'), -1, 'month')
      ).toEqual(new MenuDate('2017-12-15'))
    })
  })

  describe('createDays', () => {
    it('without existing days', () => {
      expect(daysService.createDays([], '2018-01-01', '2018-01-03')).toEqual([
        {
          date: new MenuDate('2018-01-01'),
          dinner: '',
          lunch: '',
        },
        {
          date: new MenuDate('2018-01-02'),
          dinner: '',
          lunch: '',
        },
        {
          date: new MenuDate('2018-01-03'),
          dinner: '',
          lunch: '',
        },
      ])
    })

    it('with existing days', () => {
      expect(
        daysService.createDays(
          [
            {
              date: new MenuDate('2018-01-01'),
              dinner: '',
              lunch: '',
              id: '123',
            },
          ],
          '2018-01-01',
          '2018-01-03'
        )
      ).toEqual([
        {
          date: new MenuDate('2018-01-01'),
          dinner: '',
          lunch: '',
          id: '123',
        },
        {
          date: new MenuDate('2018-01-02'),
          dinner: '',
          lunch: '',
        },
        {
          date: new MenuDate('2018-01-03'),
          dinner: '',
          lunch: '',
        },
      ])
    })
  })
})
