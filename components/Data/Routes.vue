<template>
  <div class="hidden">
    <!-- Geodata Info -->
  </div>
</template>
<script>
export default {
  mounted() {
    const host = window.location.host
    const protocol = window.location.protocol
    this.$http.$get(protocol + '//' + host + '/routes').then(async (routes) => {
      let count = 0
      for (const id in routes) {
        let route = routes[id]
        const routeJson = await this.$http.$get(
          protocol + '//' + host + '/' + route.url
        )
        route = {
          ...route,
          id,
          data: routeJson,
          visible: false,
          order: count++,
        }

        // Add as Route
        const existingRoutes = this.$store.getters['routes/getRouteById'](id)
        if (existingRoutes.length) {
          existingRoutes.forEach((r) => {
            // Todo : Update the properties with the latest data
            this.$store.commit('routes/remove', r)
          })
        }
        this.$store.commit('routes/add', route)
      }
    })
  },
}
</script>
