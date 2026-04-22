import store from '@/store'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouteLocationNormalized } from 'vue-router'
import DayPage from './views/DayPage.vue'
import MyPlanningsPage from './views/MyPlannings.vue'
import PrivacyPolicyPage from './views/PrivacyPolicy.vue'
import SettingsPage from './views/Settings.vue'
import SharingsPage from './views/Sharings.vue'
import SignInPage from './views/SignIn.vue'
import TermsOfServicePage from './views/TermsOfService.vue'
import WeekPage from './views/WeekPage.vue'

import {
  SIGNIN_PAGE_NAME,
  WEEK_PAGE_NAME,
  DEFAULT_MAIN_PAGE_PATH,
  DEFAULT_MAIN_PAGE_NAME,
} from './router-names'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/index.html',
    component: WeekPage,
    redirect: DEFAULT_MAIN_PAGE_PATH,
  },
  {
    path: '/',
    component: WeekPage,
    redirect: DEFAULT_MAIN_PAGE_PATH,
  },
  {
    name: SIGNIN_PAGE_NAME,
    path: '/signIn',
    component: SignInPage,
  },
  {
    path: DEFAULT_MAIN_PAGE_PATH,
    name: DEFAULT_MAIN_PAGE_NAME,
    component: WeekPage,
    meta: {
      title: 'Plan your meals',
      authRequired: true,
      showToolbarExtension: true,
      navigationComponent: 'week-navigation',
    },
  },
  {
    path: '/week/:year/:month/:day',
    name: WEEK_PAGE_NAME,
    component: WeekPage,
    meta: {
      title: 'Plan your meals',
      authRequired: true,
      showToolbarExtension: true,
      navigationComponent: 'week-navigation',
    },
  },
  {
    path: '/day/:year/:month/:day',
    name: 'day',
    component: DayPage,
    meta: {
      title: 'Plan your meals',
      authRequired: true,
      showBackButton: true,
      showToolbarExtension: true,
      navigationComponent: 'day-navigation',
    },
  },
  {
    path: '/sharings',
    name: 'sharings',
    component: SharingsPage,
    meta: {
      title: 'Mes partages',
      showBackButton: true,
      authRequired: true,
      storeName: 'sharings',
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
    meta: {
      title: 'Paramètres',
      showBackButton: true,
      authRequired: true,
    },
  },
  {
    path: '/my-plannings',
    name: 'my-plannings',
    component: MyPlanningsPage,
    meta: {
      title: 'Mes plannings',
      showBackButton: true,
      authRequired: true,
      storeName: 'plannings',
    },
  },
  {
    path: '/terms-of-service',
    name: 'terms-of-service',
    component: TermsOfServicePage,
    meta: {
      title: "Conditions d'utilisation",
      showBackButton: true,
    },
  },
  {
    path: '/privacy-policy',
    name: 'privacy-policy',
    component: PrivacyPolicyPage,
    meta: {
      title: 'Politique de confidentialité',
      showBackButton: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.authRequired)) {
    if (!store.getters['auth/isLoggedIn']) {
      next({
        path: '/signIn',
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

router.afterEach(async (to, from) => {
  if (isAWeekPage(to)) {
    store.commit('setCurrentWeekPage', to.path)
  }
})

/**
 * Return true if the route is a week page
 * @param route Route
 */
function isAWeekPage(route: any) {
  return route.name === WEEK_PAGE_NAME || route.name === DEFAULT_MAIN_PAGE_NAME
}

export default router
