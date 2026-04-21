<template>
  <v-textarea
    @update:model-value="onUpdate($event)"
    v-model="day[meal]"
    variant="filled"
    :label="label"
    no-resize
    :disabled="disabled"
  ></v-textarea>
</template>

<script>
export default {
  name: 'meal',
  data() {
    return {
      timer: null,
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
  unmounted() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  },
  props: ['label', 'day', 'meal', 'disabled'],
}
</script>
