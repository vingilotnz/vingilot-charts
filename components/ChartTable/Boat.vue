<template>
  <div class="hidden">
    <!-- Boat Manager -->
  </div>
</template>

<script>
import LatLon from 'geodesy/latlon-ellipsoidal-vincenty.js'

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

function drawRealCircleGeoJSON(centerLatLon, radius, steps = 100) {
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

const boatIcon = (getLocation) => {
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
      const location = getLocation()
      const heading = (location && location.cog) || 0

      // Draw the outer circle.
      context.clearRect(0, 0, this.width, this.height)
      if (heading) {
        context.translate(this.width / 2, this.height / 2)
        context.rotate(heading * (Math.PI / 180))
        context.translate(-this.width / 2, -this.height / 2)
      }
      context.strokeStyle = 'red'
      context.lineWidth = 1
      context.fillStyle =
        !location || location.stale ? 'grey' : 'rgba(255, 100, 100, 1)'
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
      location: false,
      stale: true,
      locationError: true,
      hasMap: false,
    }
  },
  methods: {
    getLocation() {
      return this.location
    },
    updateLocation({ position, accuracy, sog, cog }) {
      const pos = new LatLon(position.lat, position.lon)
      this.location = { pos, accuracy, sog, cog }

      const destination = sog
        ? pos.destinationPoint(sog * 60 * 60, cog || 0)
        : pos

      // console.log(destination)

      if (!this.hasMap) return

      this.map.getSource('boat_icon').setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [pos.lon, pos.lat], // icon position [lng, lat]
        },
      })

      this.map.setLayoutProperty('boat_icon', 'visibility', 'visible')

      this.map
        .getSource('boat_cog')
        .setData(
          this.constructCogGeoJSON(
            { lng: pos.lon, lat: pos.lat },
            { lng: destination.lon, lat: destination.lat }
          )
        )

      this.map.setLayoutProperty('boat_cog_line', 'visibility', 'visible')
      this.map.setLayoutProperty('boat_cog_dest', 'visibility', 'visible')

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
      if (this.hasMap) this.disconnectMap()

      console.log('Adding boat sources')
      // Add Boat Source
      this.map.addImage('boat_icon', boatIcon(this.getLocation), {
        pixelRatio: 1,
      })
      this.map.addSource('boat_icon', {
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
      this.map.addLayer(
        {
          id: 'boat_icon',
          type: 'symbol',
          source: 'boat_icon',
          layout: {
            'icon-image': 'boat_icon',
            'icon-allow-overlap': true,
            'icon-rotation-alignment': 'map',
            visibility: 'none',
          },
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
        'boat_icon'
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
        'boat_icon'
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
        'boat_icon'
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
        'boat_icon'
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
      this.destroyLayer('boat_icon')
      this.destroyLayer('boat_accuracy_fill')
      this.destroyLayer('boat_accuracy_line')
      this.destroyLayer('boat_cog_line')
      this.destroyLayer('boat_cog_dest')

      this.destroySource('boat_icon')
      this.destroySource('boat_accuracy')
      this.destroySource('boat_cog')
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
