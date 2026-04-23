<template>
  <v-row class="fill-height">
    <v-col class="text-center">
      <delete-account-button />
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
