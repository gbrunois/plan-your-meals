import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/src/stylus/app.styl'

import { Touch } from 'vuetify/es5/directives'

Vue.use(Vuetify, {
  iconfont: 'mdi',
  theme: {
    primary: '#26a69a',
    secondary: '#006064',
  },
  directives: {
    Touch,
  },
})
