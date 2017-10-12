import Vue from 'vue'
import Router from 'vue-router'
import MPC from '@/components/MPC'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'MPC',
      component: MPC
    }
  ]
})
