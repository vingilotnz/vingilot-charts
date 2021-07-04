<template>
  <div class="hidden">
    <!-- Track Manager -->
  </div>
</template>
<script>
import LatLon from 'geodesy/latlon-ellipsoidal-vincenty.js'

class TrackManager {
  constructor({
    onTrackUpdate = false,
    distanceLimitMeters = 500,
    headingLimitDegrees = 5,
  }) {
    this.last = false
    this.lastAngle = false

    const doUpdate = ({ position, accuracy, timestamp, sog, cog }) => {
      this.last = {
        position,
        accuracy,
        timestamp,
        sog,
        cog,
      }
      if (onTrackUpdate)
        onTrackUpdate({ position, accuracy, sog, cog, timestamp })
    }

    this.updateLocation = ({ position, accuracy, timestamp, sog, cog }) => {
      const pos = new LatLon(position.lat, position.lon)
      if (!this.last)
        return doUpdate({ position: pos, accuracy, timestamp, sog, cog })

      const distance = this.last.position.distanceTo(pos)
      if (distance >= distanceLimitMeters)
        return doUpdate({ position: pos, accuracy, timestamp, sog, cog })

      if (distance < accuracy) return

      const angle = this.last.position.initialBearingTo(pos)
      if (Math.abs(angle - this.last.cog) >= headingLimitDegrees)
        return doUpdate({ position: pos, accuracy, timestamp, sog, cog })

      // Ignore
    }
  }
}

export default {
  data() {
    return {
      track: true,
      trackManager: false,
    }
  },
  watch: {
    '$store.state.boat.updated'(updated) {
      if (!this.trackManager) return
      if (!updated) return
      const { position, accuracy, sog, cog } = this.$store.state.boat
      this.trackManager.updateLocation({
        position,
        accuracy,
        timestamp: updated,
        sog,
        cog,
      })
    },
  },
  mounted() {
    this.trackManager = new TrackManager({ onTrackUpdate: this.addToTrack })
  },
  beforeDestroy() {},
  methods: {
    addToTrack({ position, accuracy, sog, cog, timestamp }) {
      this.$store.commit('boat/addToTrack', {
        position,
        accuracy,
        sog,
        cog,
        timestamp,
      })
    },
  },
}
</script>
