<template>
  <v-row class="ma-2 fill-height">
    <v-col>
      <!-- eslint-disable-next-line vue/no-v-html -- content is our own static policy HTML fetched from public/policies/, not user input -->
      <div v-html="content"></div>
    </v-col>
  </v-row>
</template>
<script>
import axios from 'axios'
export default {
  name: 'TermsOfService',
  data: () => {
    return {
      content: '<p></p>',
    }
  },
  async mounted() {
    const response = await axios.get('/policies/terms-of-service.fr.html')
    const parser = new DOMParser()
    this.content = parser.parseFromString(
      response.data,
      'text/html'
    ).body.innerHTML
  },
}
</script>

<style scoped></style>
