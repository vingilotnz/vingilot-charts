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
      <symbol id="icon_boat_stale" viewBox="0 0 24 24" fill="none">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          fill="grey"
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
        flex-col
        md:flex-row
        rounded-md
        shadow-lg
        bg-yellow-100
        ring-1 ring-black ring-opacity-5
        divide-y divide-x-0
        md:divide-y-0 md:divide-x
        divide-gray-600
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
        <div v-if="dtw" class="my-auto pr-2">
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
  this.timeout = 6000
  let geoID = false
  let timeoutID = false
  let forceRestart = false

  this.start = (update, error) => {
    if (geoID) {
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

    forceRestart = () => {
      forceRestart = false
      this.start(update, error)
    }

    // Auto restart on mobile devices
    window.addEventListener('pageshow', forceRestart, { once: true })

    if (timeoutID) {
      clearTimeout(timeoutID)
      timeoutID = false
    }

    // timeoutID = setTimeout(() => {
    //   this.ready = false
    //   this.stale = true
    //   if (error) {
    //     error({ code: 4, message: 'Geolocation API may have stopped working!' })
    //   }
    // }, this.timeout + 2000)

    geoID = navigator.geolocation.watchPosition(
      (position) => {
        this.lastUpdate = this.time
        this.time = Date.now()
        const lastPos = this.position || {}

        const lngLat = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        }
        if (this.ready && !this.stale) {
          const lastLngLat = {
            lng: lastPos.coords.longitude,
            lat: lastPos.coords.latitude,
          }
          const deltaD = getDistanceRL(lastLngLat, lngLat)
          const deltaT = (this.time - this.lastUpdate) / 1000
          const speed = deltaD / deltaT
          const heading = getBearingRL(lastLngLat, lngLat)
          this.calculated = {
            speed,
            heading,
          }
        } else {
          this.calculated = {
            speed: NaN,
            heading: NaN,
          }
        }
        this.position = position

        this.lngLat = lngLat

        this.ready = true
        this.stale = false

        if (update) {
          update({
            position,
            lngLat,
            time: this.time,
            lastUpdate: this.lastUpdate,
            lastPos,
            calculated: this.calculated,
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
        timeout: this.timeout,
        maximumAge: 0,
      }
    )
  }

  this.stop = () => {
    if (forceRestart) {
      window.removeEventListener('pageshow', forceRestart)
      forceRestart = false
    }
    if (geoID) {
      navigator.geolocation.clearWatch(geoID)
      geoID = false
      this.ready = false
    }

    if (timeoutID) {
      clearTimeout(timeoutID)
      timeoutID = false
    }
  }
}

function constructCogGeoJSON(lngLat, destLngLat) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          id: 'boat_cog_line',
          type: 'LineString',
          coordinates: [
            [lngLat.lng, lngLat.lat],
            [destLngLat.lng, destLngLat.lat],
          ],
        },
      },
      {
        id: 'boat_cog_dest',
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [destLngLat.lng, destLngLat.lat],
        },
      },
    ],
  }
}

// Position functions from : https://www.movable-type.co.uk/scripts/latlong.html

function getDistanceRL(lngLat1, lngLat2) {
  const φ1 = (lngLat1.lat * Math.PI) / 180
  const λ1 = (lngLat1.lng * Math.PI) / 180
  const φ2 = (lngLat2.lat * Math.PI) / 180
  const λ2 = (lngLat2.lng * Math.PI) / 180
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

  const dist = Math.sqrt(Δφ * Δφ + q * q * Δλ * Δλ) * R

  return dist // in metres
}

/*
  function getDistanceGC(lngLat1, lngLat2) {
    const φ1 = (lngLat1.lat * Math.PI) / 180
    const λ1 = (lngLat1.lng * Math.PI) / 180
    const φ2 = (lngLat2.lat * Math.PI) / 180
    const λ2 = (lngLat2.lng * Math.PI) / 180
    const R = 6371e3 // metres

    const Δλ = λ2 - λ1
    const Δφ = φ2 - φ1

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // in metres
  }
*/

function getBearingRL(lngLat1, lngLat2) {
  const φ1 = (lngLat1.lat * Math.PI) / 180
  const λ1 = (lngLat1.lng * Math.PI) / 180
  const φ2 = (lngLat2.lat * Math.PI) / 180
  const λ2 = (lngLat2.lng * Math.PI) / 180

  let Δλ = λ2 - λ1

  const Δψ = Math.log(
    Math.tan(Math.PI / 4 + φ2 / 2) / Math.tan(Math.PI / 4 + φ1 / 2)
  )

  // if dLon over 180° take shorter rhumb line across the anti-meridian:
  if (Math.abs(Δλ) > Math.PI)
    Δλ = Δλ > 0 ? -(2 * Math.PI - Δλ) : 2 * Math.PI + Δλ

  const brng = (Math.atan2(Δλ, Δψ) * 180) / Math.PI

  return brng
}

function destinationRL(startLngLat, heading, distance) {
  const λ1 = (startLngLat.lng * Math.PI) / 180
  const φ1 = (startLngLat.lat * Math.PI) / 180
  const θ = (heading * Math.PI) / 180
  const d = distance
  const R = 6371e3 // metres
  const δ = d / R
  const Δφ = δ * Math.cos(θ)
  let φ2 = φ1 + Δφ

  const Δψ = Math.log(
    Math.tan(φ2 / 2 + Math.PI / 4) / Math.tan(φ1 / 2 + Math.PI / 4)
  )
  const q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1) // E-W course becomes ill-conditioned with 0/0

  const Δλ = (δ * Math.sin(θ)) / q
  const λ2 = λ1 + Δλ

  // check for some daft bugger going past the pole, normalise latitude if so
  if (Math.abs(φ2) > Math.PI / 2) φ2 = φ2 > 0 ? Math.PI - φ2 : -Math.PI - φ2

  return {
    lng: (λ2 * 180) / Math.PI,
    lat: (φ2 * 180) / Math.PI,
  }
}

function drawRealCircleGeoJSON(centerLngLat, radius, steps = 100) {
  const points = []
  for (let i = 0; i <= steps; ++i) {
    const angle = (i * 360) / steps
    const { lng, lat } = destinationRL(centerLngLat, angle, radius)
    points.push([lng, lat])
  }
  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [points],
    },
  }
  return geojson
}

function normalizeDegrees(angle) {
  while (angle <= -180) angle += 360
  while (angle > 180) angle -= 360
  return angle
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
      const boatPath = new Path2D('M12 19l9 2-9-18-9 18 9-2zm0 0v-8')
      const context = this.context
      const heading = (geo.ready && geo.position.coords.heading) || 0

      // Draw the outer circle.
      context.clearRect(0, 0, this.width, this.height)
      if (geo.ready) {
        context.translate(this.width / 2, this.height / 2)
        context.rotate(heading * (Math.PI / 180))
        context.translate(-this.width / 2, -this.height / 2)
      }
      context.strokeStyle = 'red'
      context.lineWidth = 1
      context.fillStyle =
        !geo.ready || geo.stale ? 'grey' : 'rgba(255, 100, 100, 1)'
      context.fill(boatPath)
      context.stroke(boatPath)
      context.translate(this.width / 2, this.height / 2)
      context.rotate(-heading * (Math.PI / 180))
      context.translate(-this.width / 2, -this.height / 2)

      // Update this image's data with data from the canvas.
      this.data = context.getImageData(0, 0, this.width, this.height).data

      // Continuously repaint the map, resulting
      // in the smooth animation of the dot.
      // map.triggerRepaint()

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
    getDegrees(decDegrees) {
      decDegrees = normalizeDegrees(decDegrees)
      const degrees =
        Math.floor(Math.abs(decDegrees)) * (decDegrees < 0 ? -1 : 1)
      const decMinutes = (Math.abs(decDegrees) - Math.abs(degrees)) * 60
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
      const n = (s / 1.852 / 1000).toFixed(2)
      const m = (s / 1000).toFixed(s > 2000 ? 1 : s > 1000 ? 2 : 3)
      return `${n} Nm (${m} Km)`
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
        this.dtw = getDistanceRL(location, cursor)
        this.btw = getBearingRL(location, cursor)
      }
    },
    updateLocation({ position, lngLat, calculated }) {
      const cog = position.coords.heading
      const sog = position.coords.speed
      const accuracy = position.coords.accuracy || 0
      this.location = lngLat
      this.locationError = false
      this.cog = cog // || calculated.heading
      this.sog = sog // || calculated.speed
      // console.log(position)
      // console.log(calculated)

      if (this.cursorPosition) {
        this.updateBearing(lngLat, this.cursorPosition)
      }

      if (!this.map.getSource('boatIcon')) return

      this.map.getSource('boatIcon').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [lngLat.lng, lngLat.lat], // icon position [lng, lat]
        },
      })
      const dst = sog * 60 * 60 // meters per hour
      const dstLngLat = cog && sog ? destinationRL(lngLat, cog, dst) : lngLat
      this.map
        .getSource('boat_cog')
        .setData(constructCogGeoJSON(lngLat, dstLngLat))
      if (this.lockOnBoat) {
        this.map.panTo([lngLat.lng, lngLat.lat])
      }

      this.map
        .getSource('boat_accuracy')
        .setData(drawRealCircleGeoJSON(lngLat, accuracy))

      this.map.setLayoutProperty('boat_cog_line', 'visibility', 'visible')
      this.map.setLayoutProperty('boat_cog_dest', 'visibility', 'visible')
      this.map.setLayoutProperty('boatIcon', 'visibility', 'visible')
    },
    locationErrorHandler({ code, message }) {
      this.locationError = true
      setTimeout(() => {
        this.geo.start(this.updateLocation, this.locationErrorHandler)
      }, 1000)
    },
  },
  mounted() {
    this.geo = new LocationManager()
  },
  watch: {
    map: {
      handler(map, oldValue) {
        const geo = this.geo
        geo.start(this.updateLocation, this.locationErrorHandler)

        map.on('click', ({ lngLat }) => {
          lngLat.lng = normalizeDegrees(lngLat.lng)
          lngLat.lat = normalizeDegrees(lngLat.lat)
          this.cursorPosition = lngLat
          if (this.location) {
            this.updateBearing(this.location, lngLat)
          }
        })

        map.on('dragstart', () => {
          this.lockOnBoat = false
        })

        // Add Boat Source
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
            'icon-allow-overlap': true,
            'icon-rotation-alignment': 'map',
            visibility: 'none',
          },
        })

        // Add COG Source
        map.addSource('boat_cog', {
          type: 'geojson',
          data: constructCogGeoJSON({ lng: 0, lat: 0 }, 0, 0),
        })

        map.addLayer(
          {
            id: 'boat_cog_line',
            type: 'line',
            source: 'boat_cog',
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
              visibility: 'none',
            },
            paint: {
              'line-color': 'red',
              'line-width': 2,
            },
            filter: ['in', '$type', 'LineString'],
          },
          'boatIcon'
        )
        map.addLayer(
          {
            id: 'boat_cog_dest',
            type: 'circle',
            source: 'boat_cog',
            layout: {
              visibility: 'none',
            },
            paint: {
              'circle-radius': 5,
              'circle-color': 'red',
            },
            filter: ['in', '$type', 'Point'],
          },
          'boatIcon'
        )

        // Add Accuracy Circle
        map.addSource('boat_accuracy', {
          type: 'geojson',
          data: drawRealCircleGeoJSON({ lng: 0, lat: 0 }, 0),
        })
        map.addLayer(
          {
            id: 'boat_accuracy_fill',
            type: 'fill',
            source: 'boat_accuracy',
            layout: {
              visibility: 'visible',
            },
            paint: {
              'fill-color': 'red',
              'fill-opacity': 0.1,
            },
          },
          'boatIcon'
        )
        map.addLayer(
          {
            id: 'boat_accuracy_line',
            type: 'line',
            source: 'boat_accuracy',
            layout: {
              visibility: 'visible',
            },
            paint: {
              'line-color': 'red',
              'line-opacity': 0.8,
              'line-width': 1,
            },
          },
          'boatIcon'
        )
      },
    },
  },
}
</script>
