<template>
  <v-dialog v-model="dialog" persistent>
    <template v-slot:activator="{ on }">
      <v-btn color="error" outlined v-on="on">
        <v-icon left dark>mdi-delete-forever</v-icon>Supprimer mon compte
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="headline">Supprimer mon compte?</v-card-title>
      <v-card-text>
        <v-card color="red lighten-5">
          <v-row align-center pa-1>
            <v-col cols="1">
              <v-icon color="red">mdi-alert</v-icon>
            </v-col>
            <v-col cols="11" class="font-weight-bold red--text pl-1">
              La suppression de votre compte supprime vos données et vos
              partages. Cette action est définitive et irréversible.
            </v-col>
          </v-row>
        </v-card>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey darken-1" text @click="dialog = false"
          >Annuler</v-btn
        >
        <v-btn color="red darken-1 white--text" @click="deleteAccount"
          >Supprimer</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
    }
  },
  methods: {
    deleteAccount() {
      this.dialog = false
      this.$store
        .dispatch('auth/deleteAccount')
        .then(() => this.$router.push('signIn'))
    },
  },
}
</script>

<style scoped></style>
