<template>
  <div class="absolute z-10 inline-block text-left bottom-0 left-0 m-3">
    <!-- Symbols -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden">
      <symbol id="icon_boat" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </symbol>
      <symbol id="icon_boat_solid" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          fill="green"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </symbol>
      <symbol id="icon_boat_error" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          fill="red"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </symbol>
      <symbol id="icon_cursor" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        />
      </symbol>
    </svg>

    <div
      class="
        absolute
        left-0
        bottom-0
        flex
        w-max
        flex-row
        rounded-md
        shadow-lg
        bg-yellow-100
        ring-1 ring-black ring-opacity-5
        divide-x divide-gray-600
        focus:outline-none
      "
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <div class="flex flex-row p-2">
        <button class="pr-2" role="none" @click="boatHandler()">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use v-if="locationError" xlink:href="#icon_boat_error" />
            <use v-else-if="lockOnBoat" xlink:href="#icon_boat_solid" />
            <use v-else xlink:href="#icon_boat" />
          </svg>
        </button>
        <div v-if="location" class="my-auto pr-2">
          {{ latLongToString(location) }}
        </div>
        <div v-if="sog || cog" class="my-auto pr-2">|</div>
        <div v-if="sog" class="my-auto pr-2">{{ toDisplaySpeed(sog) }}</div>
        <div v-if="cog" class="my-auto pr-2">{{ toDisplayHeading(cog) }}</div>
      </div>
      <div v-if="cursorPosition" class="flex flex-row p-2">
        <button class="pr-2" role="none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="m-auto h-5 w-5"
            stroke="currentColor"
          >
            <use xlink:href="#icon_cursor" />
          </svg>
        </button>
        <div class="my-auto pr-2">{{ latLongToString(cursorPosition) }}</div>
        <div v-if="dtw || btw" class="my-auto pr-2">|</div>
        <div v-if="dtw" class="my-auto pr-2 hidden">
          {{ toDisplayDistance(dtw) }}
        </div>
        <div v-if="btw" class="my-auto pr-2">{{ toDisplayHeading(btw) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
function LocationManager() {
  this.available = !navigator.geolocation
  this.ready = false
  this.stale = true
  this.lastUpdate = Date.UTC()

  this.start = (update, error) => {
    if (!navigator.geolocation) {
      if (error) {
        error({
          code: 0,
          message: 'Geolocation not available',
        })
      }
      return
    }
    navigator.geolocation.watchPosition(
      (position) => {
        this.ready = true
        this.stale = false
        const lastPos = this.position
        this.position = position
        const lngLat = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        }
        this.lngLat = lngLat
        const lastUpdate = this.lastUpdate
        this.lastUpdate = Date.UTC()
        if (update) {
          update({
            position,
            lngLat,
            time: this.lastUpdate,
            lastUpdate,
            lastPos,
          })
        }
      },
      ({ code, message }) => {
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
        timeout: 6000,
        maximumAge: 0,
      }
    )
  }
}

function getDistance(lngLat1, lngLat2) {
  const φ1 = lngLat1.lat
  const λ1 = lngLat1.lng
  const φ2 = lngLat2.lat
  const λ2 = lngLat2.lng
  const R = 6371e3 // metres

  let Δλ = λ2 - λ1
  const Δφ = φ2 - φ1
  const Δψ = Math.log(
    Math.tan(Math.PI / 4 + φ2 / 2) / Math.tan(Math.PI / 4 + φ1 / 2)
  )
  const q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1) // E-W course becomes ill-conditioned with 0/0

  // if dLon over 180° take shorter rhumb line across the anti-meridian:
  if (Math.abs(Δλ) > Math.PI)
    Δλ = Δλ > 0 ? -(2 * Math.PI - Δλ) : 2 * Math.PI + Δλ

  return Math.sqrt(Δφ * Δφ + q * q * Δλ * Δλ) * R
}

function getBearing(lngLat1, lngLat2) {
  const φ1 = lngLat1.lat
  const λ1 = lngLat1.lng
  const φ2 = lngLat2.lat
  const λ2 = lngLat2.lng

  let Δλ = λ2 - λ1
  const Δψ = Math.log(
    Math.tan(Math.PI / 4 + φ2 / 2) / Math.tan(Math.PI / 4 + φ1 / 2)
  )

  // if dLon over 180° take shorter rhumb line across the anti-meridian:
  if (Math.abs(Δλ) > Math.PI)
    Δλ = Δλ > 0 ? -(2 * Math.PI - Δλ) : 2 * Math.PI + Δλ

  return (Math.atan2(Δλ, Δψ) * 180) / Math.PI
}

const boatIcon = (map, geo) => {
  const size = 24
  return {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    // When the layer is added to the map,
    // get the rendering context for the map canvas.
    onAdd() {
      const canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = this.height
      this.context = canvas.getContext('2d')
    },

    // Call once before every frame where the icon will be used.
    render() {
      const boatPath = new Path2D(
        'M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'
      )
      const context = this.context

      // Draw the outer circle.
      context.clearRect(0, 0, this.width, this.height)
      if (geo.ready) {
        context.rotate(geo.position.heading * (Math.PI / 180))
      }
      context.strokeStyle = 'red'
      context.lineWidth = 1
      context.fillStyle = 'rgba(255, 100, 100, 1)'
      context.fill(boatPath)
      context.stroke(boatPath)

      // Update this image's data with data from the canvas.
      this.data = context.getImageData(0, 0, this.width, this.height).data

      // Continuously repaint the map, resulting
      // in the smooth animation of the dot.
      map.triggerRepaint()

      // Return `true` to let the map know that the image was updated.
      return true
    },
  }
}

export default {
  props: {
    map: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      show: false,
      cog: NaN,
      sog: NaN,
      location: false,
      locationError: true,
      cursorPosition: 0,
      lockOnBoat: false,
      dtw: 0,
      btw: 0,
    }
  },
  methods: {
    normalizeAngle(angle) {
      while (angle <= -180) angle += 360
      while (angle > 180) angle -= 360
      return angle
    },
    getDegrees(decDegrees) {
      decDegrees = this.normalizeAngle(decDegrees)
      const degrees = Math.floor(decDegrees)
      const decMinutes = (decDegrees - degrees) * 60
      const minutes = decMinutes % 60
      const seconds = (decMinutes - minutes) * 60
      return { decDegrees, degrees, decMinutes, minutes, seconds }
    },
    toDisplayDegrees(d) {
      d = this.getDegrees(d)
      return `${d.degrees.toFixed(0)}° ${d.decMinutes.toFixed(3)}'`
    },
    toDisplaySpeed(s) {
      if (isNaN(s)) return `? Kts`
      s = (s * 1.94384).toFixed(2)
      return `${s} Kts`
    },
    toDisplayDistance(s) {
      if (isNaN(s)) return `? Nm`
      s = (s / 1.852 / 1000 / 45).toFixed(2)
      return `${s} Nm`
    },
    toDisplayHeading(h) {
      if (isNaN(h)) return `? T`
      if (h < 0) {
        h = h + 360
      }
      h = h.toFixed(2)
      return `${h}° T`
    },
    latLongToString(pos) {
      if (!pos || !pos.lng || !pos.lat) {
        return `Lat: -, Lng: -`
      }
      const lat = this.toDisplayDegrees(pos.lat)
      const lng = this.toDisplayDegrees(pos.lng)
      return `Lat: ${lat}, Lng: ${lng}`
    },
    goToBoat() {
      if (this.geo.ready) {
        this.map.flyTo({
          center: [this.geo.lngLat.lng, this.geo.lngLat.lat],
        })
      }
    },
    boatHandler() {
      if (!this.geo.ready) {
        return
      }
      this.lockOnBoat = !this.lockOnBoat
      if (this.lockOnBoat) {
        this.goToBoat()
      }
    },
    updateBearing(location, cursor) {
      if (this.cursorPosition) {
        // const offset = !isNaN(this.cog) ? this.cog : 0
        this.dtw = getDistance(location, cursor)
        this.btw = getBearing(location, cursor)
      }
    },
    updateLocation({ position, lngLat }) {
      this.location = lngLat
      this.locationError = false
      this.cog = position.heading
      this.sog = position.speed

      if (this.cursorPosition) {
        this.updateBearing(lngLat, this.cursorPosition)
      }

      this.map.getSource('boatIcon').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [lngLat.lng, lngLat.lat], // icon position [lng, lat]
        },
      })
      if (this.lockOnBoat) {
        this.map.flyTo({
          center: [this.geo.lngLat.lng, this.geo.lngLat.lat],
        })
      }
    },
    locationErrorHandler({ code, message }) {
      console.log(message)
      switch (code) {
        case 0:
        case 1:
          this.locationError = true
          break
        default:
          break
      }
    },
  },
  mounted() {
    this.geo = new LocationManager()
  },
  watch: {
    map: {
      handler(map, oldValue) {
        map.on('click', ({ lngLat }) => {
          this.cursorPosition = lngLat
          if (this.location) {
            this.updateBearing(this.location, lngLat)
          }
        })

        map.on('dragstart', () => {
          this.lockOnBoat = false
        })

        map.addImage('boatIcon', boatIcon(map, this.geo), { pixelRatio: 1 })
        map.addSource('boatIcon', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [0, 0], // icon position [lng, lat]
            },
          },
        })
        map.addLayer({
          id: 'boatIcon',
          type: 'symbol',
          source: 'boatIcon',
          layout: {
            'icon-image': 'boatIcon',
          },
        })

        this.geo.start(this.updateLocation, this.locationErrorHandler)
      },
    },
  },
}
</script>
