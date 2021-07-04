<template>
  <div id="navstation" class="m-0 h-full w-full box-border absolute">
    <ChartTable />
    <Dash />
    <!-- Controls -->
    <ControlZoom fullScreenId="navstation" />
    <ControlLayer />
    <ControlOverlay />
    <ControlOverlayOpacity />
    <ControlRoute />
    <!-- Data Managers -->
    <DataCharts />
    <DataRoutes />
    <Location />
    <LocationTrack />
  </div>
</template>

<script>
export default {}
</script>
