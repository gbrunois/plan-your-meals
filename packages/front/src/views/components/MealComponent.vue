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
    }
  },
  unmounted() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  },
  methods: {
    onUpdate(event) {
      // defer
      if (this.timer) {
        clearTimeout(this.timer)
      }
      this.timer = setTimeout(() => {
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
