<template>
  <div v-if="viewMode === 'week'" class="calendar-list">
    <button
      v-for="day in days"
      :key="day.date.toString()"
      type="button"
      class="calendar-list__item"
      :class="{ 'calendar-list__item--selected': isSelected(day) }"
      @click="$emit('select', day.date)"
    >
      <span
        class="calendar-list__badge"
        :class="{ 'calendar-list__badge--today': isToday(day) }"
      >
        <span class="calendar-list__weekday">{{ weekdayLabel(day) }}</span>
        <span class="calendar-list__number">{{ dayOfMonth(day) }}</span>
      </span>
      <span class="calendar-list__meals">
        <span class="calendar-list__meal calendar-list__meal--lunch">
          <span class="calendar-list__label">Midi</span> {{ day.lunch }}
        </span>
        <span class="calendar-list__meal calendar-list__meal--dinner">
          <span class="calendar-list__label">Soir</span> {{ day.dinner }}
        </span>
      </span>
    </button>
  </div>
  <div v-else class="calendar-grid">
    <div class="calendar-grid__row calendar-grid__header">
      <div v-for="label in weekdayLabels" :key="label">{{ label }}</div>
    </div>
    <div v-for="week in weeks" :key="week[0].date.toString()">
      <div class="calendar-grid__row">
        <button
          v-for="day in week"
          :key="day.date.toString()"
          type="button"
          class="calendar-grid__cell"
          :class="{
            'calendar-grid__cell--outside': isOutsideMonth(day),
            'calendar-grid__cell--selected': isSelected(day),
          }"
          @click="$emit('select', day.date)"
        >
          <span
            class="calendar-grid__number"
            :class="{ 'calendar-grid__number--today': isToday(day) }"
            >{{ dayOfMonth(day) }}</span
          >
          <span
            v-if="day.lunch"
            class="calendar-grid__meal calendar-grid__meal--lunch"
            >{{ day.lunch }}</span
          >
          <span
            v-if="day.dinner"
            class="calendar-grid__meal calendar-grid__meal--dinner"
            >{{ day.dinner }}</span
          >
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { daysService } from '@/services/days.service'

export default {
  name: 'CalendarGrid',
  props: {
    days: {
      type: Array,
      required: true,
    },
    // month displayed in month mode: days of other months are greyed
    referenceDate: {
      type: Object,
      required: true,
    },
    selectedDate: {
      type: Object,
      default: null,
    },
    viewMode: {
      type: String,
      required: true,
    },
  },
  emits: ['select'],
  computed: {
    weeks() {
      const weeks = []
      for (let i = 0; i < this.days.length; i += 7) {
        weeks.push(this.days.slice(i, i + 7))
      }
      return weeks
    },
    weekdayLabels() {
      return this.days
        .slice(0, 7)
        .map((day) => dayjs(day.date.toString()).format('ddd'))
    },
    today() {
      return daysService.getNow().toString()
    },
  },
  methods: {
    weekdayLabel(day) {
      return dayjs(day.date.toString()).format('ddd')
    },
    dayOfMonth(day) {
      return dayjs(day.date.toString()).date()
    },
    isToday(day) {
      return day.date.toString() === this.today
    },
    isSelected(day) {
      return (
        this.selectedDate !== null &&
        day.date.toString() === this.selectedDate.toString()
      )
    },
    isOutsideMonth(day) {
      return (
        day.date.toString().slice(0, 7) !==
        this.referenceDate.toString().slice(0, 7)
      )
    },
  },
}
</script>

<style scoped>
.calendar-list__item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-width: 0;
  padding: 10px 16px;
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
  text-align: left;
  transition: background 0.15s;
}
.calendar-list__item:hover,
.calendar-list__item--selected {
  background: rgba(var(--v-theme-primary), 0.08);
}
.calendar-list__badge {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  line-height: 1.1;
}
.calendar-list__badge--today {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.calendar-list__weekday {
  font-size: 0.7rem;
  text-transform: uppercase;
  opacity: 0.8;
}
.calendar-list__number {
  font-size: 1.25rem;
  font-weight: 600;
}
.calendar-list__meals {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.calendar-list__meal {
  padding-left: 8px;
  overflow: hidden;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.calendar-list__meal--lunch {
  border-left: 3px solid #ffb74d;
}
.calendar-list__meal--dinner {
  border-left: 3px solid #4fc3f7;
}
.calendar-list__label {
  color: rgba(var(--v-theme-on-surface), 0.5);
  font-weight: 600;
}
.calendar-grid {
  background: rgb(var(--v-theme-surface));
}
.calendar-grid__row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.calendar-grid__header {
  text-align: center;
  text-transform: capitalize;
  font-size: 0.8rem;
  padding: 8px 0;
}
.calendar-grid__cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-height: 84px;
  padding: 2px;
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
  border-left: 1px solid rgba(var(--v-border-color), 0.12);
  text-align: left;
  overflow: hidden;
}
.calendar-grid__cell:nth-child(7n + 1) {
  border-left: none;
}
.calendar-grid__cell--outside {
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.calendar-grid__cell--selected {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
.calendar-grid__number {
  align-self: flex-end;
  min-width: 24px;
  padding: 0 4px;
  border-radius: 12px;
  text-align: center;
  font-size: 0.85rem;
}
.calendar-grid__number--today {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.calendar-grid__meal {
  padding: 0 4px;
  border-radius: 4px;
  font-size: 0.7rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.calendar-grid__meal--lunch {
  background: #ffe0b2;
  color: #000;
}
.calendar-grid__meal--dinner {
  background: #b3e5fc;
  color: #000;
}
</style>
