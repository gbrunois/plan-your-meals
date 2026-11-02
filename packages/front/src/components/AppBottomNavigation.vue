<template>
  <v-bottom-navigation v-if="user && showBottomNav" color="primary" grow>
    <v-btn
      v-for="item in items"
      :key="item.name"
      :value="item.name"
      :active="item.name === activeName"
      @click="navigate(item)"
    >
      <v-icon>{{ item.icon }}</v-icon>
      <span>{{ item.title }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script>
import {
  DEFAULT_MAIN_PAGE_PATH,
  SHOPPING_LIST_PAGE_NAME,
  RECIPES_PAGE_NAME,
} from '@/router-names'

export default {
  name: 'AppBottomNavigation',
  data: () => ({
    items: [
      { name: 'planning', title: 'Planning', icon: 'mdi-calendar-week' },
      {
        name: SHOPPING_LIST_PAGE_NAME,
        title: 'Courses',
        icon: 'mdi-cart-outline',
      },
      {
        name: RECIPES_PAGE_NAME,
        title: 'Recettes',
        icon: 'mdi-book-open-variant',
      },
    ],
  }),
  computed: {
    user() {
      return this.$store.getters['auth/user']
    },
    showBottomNav() {
      return this.$route.meta.showBottomNav === true
    },
    activeName() {
      return this.$route.meta.isCalendar ? 'planning' : this.$route.name
    },
  },
  methods: {
    navigate(item) {
      if (item.name === 'planning') {
        this.$router.push({
          path: this.$store.getters.currentWeekPage || DEFAULT_MAIN_PAGE_PATH,
        })
      } else if (this.$route.name !== item.name) {
        this.$router.push({ name: item.name })
      }
    },
  },
}
</script>
