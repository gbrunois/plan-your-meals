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
