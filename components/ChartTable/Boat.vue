<template>
  <div class="hidden">
    <!-- Boat Manager -->
  </div>
</template>

<script>
import LatLon from 'geodesy/latlon-spherical.js'
import maplibregl from 'maplibre-gl'

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

function drawRealCircleGeoJSON(centerLatLon, radius, steps = 32) {
  const points = []
  for (let i = 0; i <= steps; ++i) {
    const angle = (i * 360) / steps
    const { lng, lat } = destinationRL(
      { lng: centerLatLon.lon, lat: centerLatLon.lat },
      angle,
      radius
    )
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

const boatIcon = () => {
  const el = document.createElement('div')
  el.className = 'boatIcon hidden h-5 w-5'
  el.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="m-auto h-full w-full"
      stroke="red"
      fill="rgba(255, 100, 100, 1)"
      viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
    </svg>`
  return new maplibregl.Marker({
    element: el,
    rotationAlignment: 'map',
  }).setLngLat([0, 0])
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
      location: false,
      stale: true,
      locationError: true,
      hasMap: false,
      boatIcon: false,
    }
  },
  methods: {
    getLocation() {
      return this.location
    },
    updateLocation({ position, accuracy, sog, cog, stale }) {
      const pos = new LatLon(position.lat, position.lon)
      this.location = { position: pos, accuracy, sog, cog, stale }

      const destination = sog
        ? pos.destinationPoint((sog || 0) * 60 * 60, cog || 0)
        : pos

      // console.log(destination)

      if (!this.hasMap) return

      this.boatIcon.setLngLat([pos.lon, pos.lat]) // icon position [lng, lat]
      const boatIconEl = this.boatIcon.getElement()
      boatIconEl.classList.remove('hidden')
      this.boatIcon.setRotation(cog || 0)
      boatIconEl.firstElementChild.setAttribute(
        'fill',
        stale ? 'grey' : 'rgba(255, 100, 100, 1)'
      )

      this.map
        .getSource('boat_cog')
        .setData(
          this.constructCogGeoJSON(
            { lng: pos.lon, lat: pos.lat },
            { lng: destination.lon, lat: destination.lat }
          )
        )

      this.map.setLayoutProperty(
        'boat_cog_line',
        'visibility',
        cog || cog === 0 ? 'visible' : 'none'
      )
      this.map.setLayoutProperty(
        'boat_cog_dest',
        'visibility',
        sog || sog === 0 ? 'visible' : 'none'
      )

      this.map
        .getSource('boat_accuracy')
        .setData(drawRealCircleGeoJSON(pos, accuracy))

      if (this.map.getLayer('boat_accuracy_fill')) {
        this.map.setLayoutProperty(
          'boat_accuracy_fill',
          'visibility',
          'visible'
        )
      }

      this.map
        .getSource('boat_track')
        .setData(this.constructTrackJSON(this.$store.state.boat.track, pos))
      this.map
        .getSource('boat_track_end')
        .setData(this.constructTrackEndJSON(this.$store.state.boat.track, pos))
    },
    constructTrackJSON(track = []) {
      const parts = []
      let part = []
      if (track.length) {
        part = [[track[0].position.lon, track[0].position.lat]]
      }
      for (let i = 1; i < track.length; i++) {
        const prev = track[i - 1]
        const next = track[i]
        const staleness = Math.abs(next.timestamp - prev.timestamp)
        if (next.wasStale || staleness > 5 * 60 * 1000) {
          parts.push(part)
          part = []
        }
        part.push([next.position.lon, next.position.lat])
      }
      parts.push(part)

      const features = []

      parts.forEach((part) => {
        features.push({
          type: 'Feature',
          properties: {
            type: 'track',
          },
          geometry: {
            type: 'LineString',
            coordinates: part,
          },
        })
      })

      for (let i = 1; i < parts.length; i++) {
        const pP = parts[i - 1]
        const nP = parts[i]

        if (!(pP.length && nP.length)) continue

        features.push({
          type: 'Feature',
          properties: {
            type: 'join',
          },
          geometry: {
            type: 'LineString',
            coordinates: [pP[pP.length - 1], nP[0]],
          },
        })
      }

      return {
        type: 'FeatureCollection',
        features,
      }
    },
    constructTrackEndJSON(track = [], position = { lng: 0, lat: 0 }) {
      let trackLast = []
      if (track.length) {
        const last = track[track.length - 1].position
        trackLast = [
          [last.lon, last.lat],
          [position.lon, position.lat],
        ]
      }
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: trackLast,
            },
          },
        ],
      }
    },
    constructCogGeoJSON(lngLat, destLngLat) {
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
    },
    connectToMap() {
      this.disconnectMap()

      this.boatIcon = boatIcon()

      this.boatIcon.addTo(this.map)

      console.log('Adding boat sources')

      // Add Track Source
      this.map.addSource('boat_track', {
        type: 'geojson',
        data: this.constructTrackJSON(),
      })
      this.map.addSource('boat_track_end', {
        type: 'geojson',
        data: this.constructTrackEndJSON(),
      })
      this.map.addLayer(
        {
          id: 'boat_track_line',
          type: 'line',
          source: 'boat_track',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            visibility: 'visible',
          },
          paint: {
            'line-color': 'rgba(255, 255, 0, 0.6)',
            'line-width': 2,
          },
          filter: ['in', 'type', 'track'],
        },
        '_boat'
      )
      this.map.addLayer(
        {
          id: 'boat_track_join',
          type: 'line',
          source: 'boat_track',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            visibility: 'visible',
          },
          paint: {
            'line-color': 'rgba(255, 255, 0, 0.6)',
            'line-width': 2,
            'line-dasharray': [4, 4],
          },
          filter: ['in', 'type', 'join'],
        },
        '_boat'
      )
      this.map.addLayer(
        {
          id: 'boat_track_end',
          type: 'line',
          source: 'boat_track_end',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
            visibility: 'visible',
          },
          paint: {
            'line-color': 'rgba(255, 255, 0, 0.6)',
            'line-width': 2,
            'line-dasharray': [4, 4],
          },
          filter: ['in', '$type', 'LineString'],
        },
        '_boat'
      )

      // Add COG Source
      this.map.addSource('boat_cog', {
        type: 'geojson',
        data: this.constructCogGeoJSON({ lng: 0, lat: 0 }, { lng: 0, lat: 0 }),
      })
      this.map.addLayer(
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
        '_boat'
      )
      this.map.addLayer(
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
        '_boat'
      )
      // Add Accuracy Circle
      this.map.addSource('boat_accuracy', {
        type: 'geojson',
        data: drawRealCircleGeoJSON(new LatLon(0, 0), 0),
      })
      this.map.addLayer(
        {
          id: 'boat_accuracy_fill',
          type: 'fill',
          source: 'boat_accuracy',
          paint: {
            'fill-color': 'red',
            'fill-opacity': 0.1,
          },
        },
        '_boat'
      )
      this.map.addLayer(
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
        '_boat'
      )
      this.hasMap = true
    },
    destroyLayer(layerID) {
      this.hasMap && this.map.getLayer(layerID) && this.map.removeLayer(layerID)
    },
    destroySource(sourceID) {
      this.hasMap &&
        this.map.getSource(sourceID) &&
        this.map.removeSource(sourceID)
    },
    disconnectMap() {
      this.destroyLayer('boat_accuracy_fill')
      this.destroyLayer('boat_accuracy_line')
      this.destroyLayer('boat_cog_line')
      this.destroyLayer('boat_cog_dest')
      this.destroyLayer('boat_track_line')
      this.destroyLayer('boat_track_join')
      this.destroyLayer('boat_track_end')

      this.destroySource('boat_accuracy')
      this.destroySource('boat_cog')
      this.destroySource('boat_track')
      this.destroySource('boat_track_end')
      this.hasMap = false
    },
    beforeDestroy() {
      this.disconnectMap()
    },
  },
  watch: {
    '$store.state.boat.updated'() {
      this.updateLocation(this.$store.state.boat)
    },
    '$store.state.boat.stale'() {
      this.updateLocation(this.$store.state.boat)
    },
    map: {
      immediate: true,
      handler(map) {
        if (!map.loaded) return
        this.connectToMap()
      },
    },
  },
}
</script>
