<template>
  <div class="hidden">
    <!-- Track Manager -->
  </div>
</template>
<script>
import LatLon from 'geodesy/latlon-spherical.js'

class TrackManager {
  constructor({
    onTrackUpdate = false,
    distanceLimitMeters = 500,
    headingLimitDegrees = 5,
    crossTrackLimitMeters = 50,
    accuracyLimit = 1.5,
    accuracyThresholdMeters = 25,
    freshnessLimitMinutes = 1,
  }) {
    this.saved = false
    this.last = false
    this.wasStale = false
    this.timestamp = false

    const doUpdate = (latest, wasStale = false) => {
      this.saved = latest
      if (onTrackUpdate)
        onTrackUpdate({
          ...latest,
          wasStale,
        })
    }

    this.updateLocation = ({ position, accuracy, timestamp, sog, cog }) => {
      let latest = {
        position: new LatLon(position.lat, position.lon),
        accuracy,
        timestamp,
        sog,
        cog,
      }

      if(accuracy && accuracy > accuracyThresholdMeters) return

      const freshness = this.timestamp && timestamp - this.timestamp
      this.timestamp = timestamp

      if (!this.saved)
        return doUpdate({ ...latest, heading: latest.cog, distance: 0 })

      latest.distance = this.saved.position.rhumbDistanceTo(latest.position)
      latest.heading = this.saved.position.rhumbBearingTo(latest.position)

      if (latest.distance < accuracyLimit * accuracy) return

      const wasStale =
        freshness && freshness > freshnessLimitMinutes * 60 * 1000

      if (
        wasStale ||
        latest.distance >= distanceLimitMeters ||
        Math.abs(latest.heading - this.saved.heading) >= headingLimitDegrees ||
        latest.position.crossTrackDistanceTo(
          this.saved.position,
          this.saved.position.rhumbDestinationPoint(
            latest.distance,
            this.saved.heading
          )
        ) >= crossTrackLimitMeters ||
        (this.last &&
          Math.abs(
            this.last.position.rhumbBearingTo(latest.position) -
              this.last.heading
          ) >= 90)
      ) {
        if (this.last) {
          doUpdate(this.last, false)
        }

        if (wasStale) {
          this.last = false
        }

        if (!this.last) {
          doUpdate(latest, wasStale)
          latest = false
        }
      }

      this.last = latest
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
    addToTrack(latest) {
      this.$store.commit('boat/addToTrack', latest)
    },
  },
}
</script>
