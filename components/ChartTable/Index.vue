<template>
  <div class="m-0 h-full box-border w-full absolute">
    <div :id="map_id" class="m-0 h-full box-border select-none">
      <!-- chart here -->
    </div>
    <ChartTableBoat :map="map" />
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'

import maplibregl from 'maplibre-gl'

const style = {
  line: 'rgba(55, 165, 228, 0.6)',
  circle: 'rgba(255, 255, 255, 0.6)',
}

const preventDefaultTouchBehaviour = () => {
  // document.addEventListener(
  //   'wheel',
  //   (e) => {
  //     e.preventDefault()
  //   },
  //   { passive: false }
  // )

  document.addEventListener(
    'dblclick',
    (e) => {
      e.preventDefault()
    },
    { passive: false }
  )

  // document.addEventListener(
  //   'touchmove',
  //   (e) => {
  //     e._dontCancel || e.preventDefault()
  //   },
  //   { passive: false }
  // )
}

// Prepare this multiline string for correct display when the track covers the 180 meridien
function fixMultiLineString(parts) {
  const fixed = []

  parts.length &&
    parts[0].length &&
    parts.forEach((part) => {
      fixed.push([part[0]])
      for (let i = 1; i < part.length; i++) {
        const current = fixed[fixed.length - 1]
        const prev = part[i - 1]
        const next = part[i]
        if (next[0] - prev[0] > 180 || prev[0] - next[0] > 180) {
          const fixedLng = next[0] + (next[0] < prev[0] ? 360 : -360)
          current.push([fixedLng, next[1]])
          fixed.push([next])
        } else {
          current.push(next)
        }
      }
    })

  return fixed
}

function fixFeatureCollection(geojson) {
  if (geojson.type !== 'FeatureCollection') return geojson

  const features = []

  geojson.features.forEach((feature) => {
    if (feature.type !== 'Feature') return
    const fixed = {
      type: 'Feature',
      properties: feature.properties,
      geometry: {
        type: 'MultiLineString',
      },
    }
    if (feature.geometry.type === 'LineString') {
      fixed.geometry.coordinates = fixMultiLineString([
        feature.geometry.coordinates,
      ])
    } else if (feature.geometry.type === 'MultiLineString') {
      fixed.geometry.coordinates = fixMultiLineString(
        feature.geometry.coordinates
      )
    } else {
      fixed.geometry.coordinates = feature.geometry.coordinates
    }
    features.push(fixed)
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}

export default {
  data() {
    return {
      map_id: uuidv4(),
      map: {},
      moving: false,
      followBoat: false,
      boatPosition: false,
    }
  },
  watch: {
    '$store.state.charts.layers': {
      deep: true,
      immediate: true,
      handler(val, oldVal) {
        val.forEach(this.updateChartLayer)
      },
    },
    '$store.state.charts.overlays': {
      deep: true,
      immediate: true,
      handler(val, oldVal) {
        val.forEach(this.updateChartOverlay)
      },
    },
    '$store.state.routes.routes': {
      deep: true,
      immediate: true,
      handler(val, oldVal) {
        val.forEach(this.updateRouteLayer)
      },
    },
    '$store.state.chartTable.targetZoom': {
      immediate: true,
      handler(zoom) {
        if (!this.mapReady()) return
        if (this.$store.state.chartTable.zoom === zoom) return
        this.map.zoomTo(zoom)
      },
    },
    '$store.state.chartTable.targetOrientation': {
      immediate: true,
      handler(orientation) {
        if (!this.mapReady()) return
        if (this.$store.state.chartTable.orientation === orientation) return
        this.map.rotateTo(orientation, {}, { origin: 'non-user' })
      },
    },
    '$store.state.chartTable.followBoat': {
      immediate: true,
      handler(followBoat) {
        this.followBoat = followBoat
        if (followBoat) this.goTo(this.$store.state.boat.position)
      },
    },
    '$store.state.boat.position': {
      immediate: true,
      handler(position) {
        this.boatPosition = position
        if (this.$store.state.chartTable.followBoat) this.goTo(position)
      },
    },
  },
  mounted() {
    preventDefaultTouchBehaviour()

    const host = window.location.host
    const protocol = window.location.protocol

    maplibregl.baseApiUrl = protocol + '//' + host

    const map = new maplibregl.Map({
      container: this.map_id,
      maxTileCacheSize: 10000,
      light: {
        anchor: 'viewport',
        color: 'white',
        position: [1.15, 210, 30],
        intensity: 0.2,
      },
      style: {
        version: 8,
        sources: {},
        glyphs: `${protocol}//${host}/fonts/{fontstack}/{range}.pbf`,
        layers: [
          {
            id: '_charts',
            type: 'background',
            layout: { visibility: 'none' },
          },
          {
            id: '_overlays',
            type: 'background',
            layout: { visibility: 'none' },
          },
          {
            id: '_routes',
            type: 'background',
            layout: { visibility: 'none' },
          },
          {
            id: '_boat',
            type: 'background',
            layout: { visibility: 'none' },
          },
        ],
      },
      center: [0, 0],
      zoom: this.$store.state.chartTable.targetZoom,
      maxPitch: 0,
      pitchWithRotate: false,
      touchPitch: false,
      logoPosition: 'bottom-right',
      logoEnabled: false,
    })
    map.on('load', () => {
      this.initaliseMap(map)
    })
  },
  methods: {
    initaliseMap(map) {
      this.map = map

      map.addControl(
        new maplibregl.ScaleControl({
          maxWidth: 200,
          unit: 'nautical',
        }),
        'bottom-left'
      )

      map.addControl(
        new maplibregl.ScaleControl({
          maxWidth: 200,
          unit: 'metric',
        }),
        'bottom-left'
      )

      this.$store.state.charts.layers.forEach(this.updateChartLayer)
      map.on('rotate', ({ target }) => {
        this.$store.commit('chartTable/setOrientation', target.getBearing())
      })
      map.on('rotateend', ({ target }) => {
        this.$store.commit('chartTable/setOrientation', target.getBearing())
        this.$store.commit('chartTable/orientTo', target.getBearing())
      })
      map.on('zoom', ({ target }) => {
        this.$store.commit('chartTable/setZoom', map.getZoom())
      })
      map.on('zoomend', ({ target }) => {
        this.$store.commit('chartTable/setZoom', map.getZoom())
        this.$store.commit('chartTable/zoomTo', map.getZoom())
      })
      map.on('movestart', ({ origin }) => {
        this.moving = true
        if (origin !== 'non-user') {
          // this.$store.commit('chartTable/followBoat', false)
        }
      })
      map.on('moveend', ({ origin }) => {
        this.moving = false
        if (origin !== 'non-user') {
          // this.$store.commit('chartTable/followBoat', false)
          if (this.followBoat && this.boatPosition) {
            this.goTo(this.boatPosition)
          }
        }
      })
      map.on('zoomstart', ({ origin }) => {
        this.moving = true
      })
      map.on('zoomend', ({ origin }) => {
        this.moving = false
        if (origin !== 'non-user') {
          if (this.followBoat && this.boatPosition) {
            this.goTo(this.boatPosition)
          }
        }
      })
    },
    mapReady() {
      return this.map && this.map.loaded
    },
    updateChartLayer(layer) {
      if (!this.mapReady()) return false
      if (this.addChartLayer(layer)) return true

      const id = 'tile_' + layer.id

      if (this.map.getLayer(id) === undefined) return false

      // const mbLayer = this.map.getLayer(id)

      this.map.setLayoutProperty(
        id,
        'visibility',
        layer.visible ? 'visible' : 'none'
      )
      this.map.setPaintProperty(id, 'raster-opacity', layer.opacity || 1)
      this.map.setPaintProperty(id, 'raster-contrast', layer.contrast || 0)

      return true
    },
    addChartLayer(layer) {
      if (!this.map) return false
      const id = 'tile_' + layer.id
      if (this.map.getSource(id) === undefined) {
        const source = {
          name: layer.name,
          type: layer.type,
          url: layer.tileJsonUrl,
          tileSize: layer.tileSize,
        }
        this.map.addSource(id, source)
      }
      if (this.map.getLayer(id) === undefined) {
        const mbLayer = {
          id,
          type: layer.type,
          source: id,
          layout: {
            visibility: layer.visible ? 'visible' : 'none',
          },
          paint: {
            'raster-opacity': layer.opacity || 1,
            'raster-contrast': layer.contrast || 0,
          },
        }
        this.map.addLayer(mbLayer, '_charts')
        return true
      }
      return false
    },
    updateChartOverlay(overlay) {
      if (!this.mapReady()) return false
      if (this.addChartOverlay(overlay)) return true

      const id = 'overlay_' + overlay.id

      if (this.map.getLayer(id) === undefined) return false

      // const mbLayer = this.map.getLayer(id)

      this.map.setLayoutProperty(
        id,
        'visibility',
        overlay.visible ? 'visible' : 'none'
      )
      this.map.setPaintProperty(id, 'raster-opacity', overlay.opacity || 1)
      this.map.setPaintProperty(id, 'raster-contrast', overlay.contrast || 0)

      return true
    },
    addChartOverlay(overlay) {
      if (!this.map) return false
      const id = 'overlay_' + overlay.id
      if (this.map.getSource(id) === undefined) {
        const source = {
          name: overlay.name,
          type: overlay.type,
          url: overlay.tileJsonUrl,
          tileSize: overlay.tileSize,
        }
        this.map.addSource(id, source)
      }
      if (this.map.getLayer(id) === undefined) {
        const mbLayer = {
          id,
          type: overlay.type,
          source: id,
          layout: {
            visibility: overlay.visible ? 'visible' : 'none',
          },
          paint: {
            'raster-opacity': overlay.opacity || 1,
            'raster-contrast': overlay.contrast || 0,
          },
        }
        this.map.addLayer(mbLayer, '_overlays')
        return true
      }
      return false
    },
    updateRouteLayer(route) {
      if (!this.mapReady()) return false
      if (this.addRouteLayer(route)) return true

      const id = 'route_' + route.id

      if (this.map.getLayer(`${id}_line`) === undefined) return false

      this.map.setLayoutProperty(
        `${id}_line`,
        'visibility',
        route.visible ? 'visible' : 'none'
      )

      this.map.setLayoutProperty(
        `${id}_points`,
        'visibility',
        route.visible ? 'visible' : 'none'
      )

      this.map.setLayoutProperty(
        `${id}_label`,
        'visibility',
        route.visible ? 'visible' : 'none'
      )

      return true
    },
    addRouteLayer(route) {
      if (!this.map) return false
      const id = 'route_' + route.id
      if (this.map.getSource(id) === undefined) {
        const source = {
          type: route.type,
          data: fixFeatureCollection(route.data),
        }
        this.map.addSource(id, source)
      }
      if (this.map.getLayer(`${id}_line`) === undefined) {
        const mbLayerLine = {
          id: `${id}_line`,
          type: 'line',
          source: id,
          layout: {
            visibility: route.visible ? 'visible' : 'none',
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': style.line,
            'line-width': 6,
          },
        }

        const mbLayerPoints = {
          id: `${id}_points`,
          type: 'circle',
          source: id,
          layout: {
            visibility: route.visible ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': 6,
            'circle-color': style.line,
            'circle-stroke-width': 2,
            'circle-stroke-color': style.circle,
          },
        }

        this.map.addLayer(mbLayerPoints, '_routes')
        this.map.addLayer(mbLayerLine, '_routes')

        const mbLayerLabel = {
          id: `${id}_label`,
          type: 'symbol',
          source: id,
          layout: {
            visibility: route.visible ? 'visible' : 'none',
            // 'text-transform': 'uppercase',
            'text-letter-spacing': 0.1,
            'text-max-width': 20,
            'symbol-placement': 'line-center',
            'text-field': ['get', 'name'],
            'text-font': ['Roboto Regular'],
            'text-padding': 2,
            'text-size': ['interpolate', ['linear'], ['zoom'], 1, 10, 10, 18],
            'symbol-avoid-edges': true,
            'icon-padding': 5,
          },
          paint: {
            'text-color': 'rgba(12, 74, 106, 1)',
            'text-halo-width': 1,
            'text-halo-color': 'hsl(84, 24%, 96%)',
            'text-halo-blur': 1,
          },
        }
        this.map.addLayer(mbLayerLabel, '_routes')

        return true
      }
      return false
    },
    goTo(point) {
      if (!this.mapReady()) return
      if (this.moving) return
      this.map.panTo([point.lon, point.lat], {}, { origin: 'non-user' })
    },
  },
}
</script>

<style>
.mapboxgl-ctrl-bottom-left {
  bottom: 50px !important;
}
</style>
