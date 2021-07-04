import LatLon from 'geodesy/latlon-spherical.js'

export default class LocationManager {
  constructor() {
    this.available = !navigator.geolocation
    this.ready = false
    this.stale = true
    this.lastUpdate = Date.UTC()
    this.timeout = 6000
    this.geoID = false
    this.timeoutID = false
    this.forceRestart = false

    this.start = (update, error) => {
      if (this.geoID) {
        this.stop()
      }

      if (!navigator.geolocation) {
        if (error) {
          error({
            code: 0,
            message: 'Geolocation not available',
          })
        }
        return
      }

      this.forceRestart = () => {
        this.forceRestart = false
        this.start(update, error)
      }

      // Auto restart on mobile devices
      // window.addEventListener('pageshow', this.forceRestart, { once: true })

      const resetTimeout = () => {
        if (this.timeoutID) {
          clearTimeout(this.timeoutID)
          this.timeoutID = false
        }

        this.timeoutID = setTimeout(() => {
          this.ready = false
          this.stale = true
        }, this.timeout * 2)
      }

      resetTimeout()

      this.geoID = navigator.geolocation.watchPosition(
        (position) => {
          resetTimeout()
          this.position = position
          this.latLon = new LatLon(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.altitude || 0
          )
          this.ready = true
          this.stale = false

          if (update) {
            update({
              position,
              latLon: this.latLon,
            })
          }
        },
        ({ code, message }) => {
          if (this.timeoutID) {
            clearTimeout(this.timeoutID)
            this.timeoutID = false
          }
          this.stale = true
          if (code === 1) {
            this.available = false
          }
          if (error) {
            error({ code, message })
          }
        },
        {
          enableHighAccuracy: true,
          timeout: this.timeout,
          maximumAge: 0,
        }
      )
    }

    this.stop = () => {
      if (this.forceRestart) {
        window.removeEventListener('pageshow', this.forceRestart)
        this.forceRestart = false
      }
      if (this.geoID) {
        navigator.geolocation.clearWatch(this.geoID)
        this.geoID = false
        this.ready = false
      }

      if (this.timeoutID) {
        clearTimeout(this.timeoutID)
        this.timeoutID = false
      }
    }
  }
}
