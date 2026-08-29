<template>
  <v-row class="fill-height" align="start">
    <v-col class="pa-0">
      <v-row no-gutters style="background: #fff">
        <v-col cols="12" class="px-2">
          <v-text-field
            ref="inputEmail"
            v-model="email"
            label="Saisissez une adresse e-mail"
            type="text"
            append-inner-icon="mdi-account-plus"
            maxlength="100"
            :rules="[rules.email]"
            @click:append-inner="addSharing"
            @keypress="onAddSharingInputKeyPress"
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-divider />
        </v-col>
        <v-col cols="12">
          <v-list-subheader class="font-weight-bold"
            >Menus partagés avec</v-list-subheader
          >
          <v-list lines="two">
            <template v-for="sharing in sharings" :key="sharing.userEmail">
              <v-list-item>
                <v-list-item-title>{{
                  sharing.userDisplayName
                }}</v-list-item-title>
                <v-list-item-subtitle>{{
                  sharing.userEmail
                }}</v-list-item-subtitle>

                <template #append>
                  <span
                    v-if="sharing.isOwner"
                    class="font-weight-light text-caption"
                    >Propriétaire</span
                  >
                  <v-icon v-else @click="removeSharing(sharing)"
                    >mdi-close-circle-outline</v-icon
                  >
                </template>
              </v-list-item>
            </template>
          </v-list>
          <v-list lines="two">
            <template
              v-for="sharing in pendingSharings"
              :key="sharing.userEmail"
            >
              <v-list-item>
                <v-list-item-title class="font-weight-light font-italic">
                  {{ sharing.userEmail }}
                </v-list-item-title>
                <v-list-item-subtitle>(En attente)</v-list-item-subtitle>

                <template #append>
                  <v-icon @click="removePendingSharing(sharing)"
                    >mdi-close-circle-outline</v-icon
                  >
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
import { Utils } from '../services/utils'

export default {
  name: 'Sharings',
  data: () => {
    return {
      email: '',
      rules: {
        email: (value) => Utils.emailIsValid(value) || 'E-mail invalide',
      },
    }
  },
  computed: {
    sharings() {
      return this.$store.getters['sharings/sharings']
    },
    pendingSharings() {
      return this.$store.getters['sharings/pendingSharings']
    },
  },

  created() {
    this.$store.dispatch('sharings/fetchSharings')
  },
  methods: {
    addSharing() {
      if (Utils.emailIsValid(this.email)) {
        this.$store.dispatch('sharings/addNewSharing', this.email)

        this.email = ''
        this.$refs.inputEmail.resetValidation()
        this.$refs.inputEmail.blur()
      }
    },
    onAddSharingInputKeyPress(event) {
      if (event.key === 'Enter') {
        this.addSharing(event)
      }
    },
    removeSharing(sharing) {
      this.$store.dispatch('sharings/removeSharing', sharing)
    },
    removePendingSharing(sharing) {
      this.$store.dispatch('sharings/removePendingSharing', sharing)
    },
  },
}
</script>
