<template>
  <div class="hidden">
    <!-- Location Manager -->
  </div>
</template>
<script>
import LocationManager from './locationManager.js'

export default {
  data() {
    return {
      geo: false,
    }
  },
  mounted() {
    this.geo = new LocationManager()
    this.geo.start(this.updateLocation, this.locationErrorHandler)
  },
  beforeDestroy() {
    this.geo && this.geo.stop()
  },
  methods: {
    updateLocation({ position, latLon }) {
      // console.log(position)
      this.$store.dispatch('boat/updateLocation', {
        position: latLon,
        accuracy: position.coords.accuracy,
        cog: position.coords.heading || false,
        sog: position.coords.speed || false,
      })
    },
    locationErrorHandler({ code, message }) {
      console.log(message)
      this.$store.commit('boat/recordFailedAttempt')
      setTimeout(() => {
        this.geo.start(this.updateLocation, this.locationErrorHandler)
      }, 1000)
    },
  },
}
</script>
