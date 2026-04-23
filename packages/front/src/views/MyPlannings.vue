<template>
  <v-row class="fill-height" align="start">
    <v-col class="pa-0">
      <v-row no-gutters style="background: #fff">
        <v-col cols="12">
          <v-list lines="two">
            <template v-for="planning in myPlannings" :key="planning.id">
              <v-list-item @click="setAsPrimary(planning)">
                <v-list-item-title>{{ planning.ownerName }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ planning.isOwner ? 'Propriétaire' : 'Partagé' }}
                </v-list-item-subtitle>
                <template #append>
                  <v-icon
                    v-if="planning.primary === false"
                    color="grey-lighten-1"
                    >mdi-star-outline</v-icon
                  >
                  <v-icon v-else color="yellow-darken-2">mdi-star</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-list>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'MyPlannings',
  computed: {
    myPlannings() {
      return this.$store.getters['plannings/myPlannings']
    },
  },
  created() {
    this.$store.dispatch('plannings/fetchMyPlannings')
  },
  methods: {
    setAsPrimary(planning) {
      this.$store.dispatch('plannings/setAsPrimary', planning)
    },
  },
}
</script>
