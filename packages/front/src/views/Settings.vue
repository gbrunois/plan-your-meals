<template>
  <v-row class="fill-height align-start" no-gutters>
    <v-col class="pa-0">
      <v-card
        rounded="lg"
        elevation="1"
        class="overflow-hidden pa-4 text-center"
      >
        <delete-account-button />
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import DeleteAccountButton from './components/DeleteAccountButton'

export default {
  name: 'Settings',
  components: {
    deleteAccountButton: DeleteAccountButton,
  },
}
</script>

<style scoped></style>
