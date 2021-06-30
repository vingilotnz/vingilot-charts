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

const preventDefaultTouchBehaviour = () => {
  document.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
    },
    { passive: false }
  )

  document.addEventListener(
    'dblclick',
    (e) => {
      e.preventDefault()
    },
    { passive: false }
  )

  document.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault()
    },
    { passive: false }
  )
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
    '$store.state.chartTable.targetZoom'(zoom) {
      if (!this.mapReady()) return
      if (this.$store.state.chartTable.zoom === zoom) return
      this.map.zoomTo(zoom)
    },
    '$store.state.chartTable.targetOrientation'(orientation) {
      if (!this.mapReady()) return
      if (this.$store.state.chartTable.orientation === orientation) return
      this.map.rotateTo(orientation, {}, { origin: 'non-user' })
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

    const map = new maplibregl.Map({
      container: this.map_id,
      light: {
        anchor: 'viewport',
        color: 'white',
        position: [1.15, 210, 30],
        intensity: 0.2,
      },
      style: {
        version: 8,
        sources: {},
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
            id: '_boat',
            type: 'background',
            layout: { visibility: 'none' },
          },
        ],
      },
      center: [0, 0],
      zoom: 1,
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
