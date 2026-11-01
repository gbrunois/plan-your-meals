<template>
  <v-textarea
    :model-value="day[meal]"
    variant="filled"
    :label="label"
    no-resize
    :disabled="disabled"
    @update:model-value="onUpdate($event)"
  ></v-textarea>
</template>

<script>
export default {
  name: 'Meal',
  props: {
    label: {
      type: String,
      required: true,
    },
    day: {
      type: Object,
      required: true,
    },
    meal: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      timer: null,
      pendingValue: '',
    }
  },
  unmounted() {
    // flush the pending edit rather than dropping it: the opened day is
    // still this meal's day while the detail closes
    if (this.timer) {
      clearTimeout(this.timer)
      this.updateStore(this.pendingValue)
    }
  },
  methods: {
    onUpdate(event) {
      // defer
      if (this.timer) {
        clearTimeout(this.timer)
      }
      this.pendingValue = event
      this.timer = setTimeout(() => {
        this.timer = null
        this.updateStore(event)
      }, 500)
    },
    updateStore(event) {
      this.$store.dispatch('days/update', {
        date: this.day.date,
        meal: this.meal,
        value: event,
      })
    },
  },
}
</script>
