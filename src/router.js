import Vue from "vue";
import Router from "vue-router";
import Weeks from "./views/Weeks.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "weeks",
      component: Weeks
    }
  ]
});
