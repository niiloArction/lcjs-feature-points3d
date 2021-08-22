const {
  lightningChart,
  AxisTickStrategies,
  LUT,
  PalettedFill,
  PointStyle3D,
  ColorRGBA,
  PointSeriesTypes3D,
  LegendBoxBuilders,
} = lcjs;

const chart = lightningChart().Chart3D().setTitle("").setPadding(0);

const axes = [
  chart.getDefaultAxisX(),
  chart.getDefaultAxisY(),
  chart.getDefaultAxisZ(),
];
axes.forEach((axis) =>
  axis.setTickStrategy(AxisTickStrategies.Empty).setInterval(0, 1, false, true)
);
axes[1].setInterval(-50, 300, false, true);

const points = chart
  .addPointSeries({
    individualLookupValuesEnabled: true,
    individualPointSizeEnabled: true,
    // individualPointColorEnabled: true,
    // type: PointSeriesTypes3D.Pixelated,
  })
  .setPointStyle(
    new PointStyle3D.Triangulated({
      size: 1,
      shape: "sphere",
      fillStyle: new PalettedFill({
        lookUpProperty: "value",
        lut: new LUT({
          interpolate: true,
          steps: [
            { value: 0.0, label: "ok", color: ColorRGBA(255, 255, 255) },
            { value: 0.5, label: "", color: ColorRGBA(255, 255, 255) },
            { value: 0.75, label: "warning", color: ColorRGBA(255, 255, 0) },
            { value: 1, label: "critical", color: ColorRGBA(255, 0, 0) },
          ],
        }),
      }),
    })
  );

const legend = chart
  .addLegendBox(LegendBoxBuilders.HorizontalLegendBox)
  .add(chart);

const randomPattern = new Array(10000).fill(0).map((_) => Math.random());
const randomPatternLength = randomPattern.length;
let iRandom = 0;
const getRandom = () => {
  const random = randomPattern[iRandom];
  iRandom += 1;
  if (iRandom >= randomPatternLength) {
    iRandom = 0;
  }
  return random;
};

const heightMap = (() => {
  const resolution = 50;
  const map = new Array(resolution)
    .fill(0)
    .map((_, iX) =>
      new Array(resolution)
        .fill(0)
        .map(
          (_, iZ) =>
            100 +
            4 *
              Math.sin((iX / resolution) * 5) *
              (Math.cos((iZ / resolution) * 2.5) * 20)
        )
    );
  return (xNormalized, zNormalized) => {
    const iX = Math.round(xNormalized * (resolution - 1));
    const iZ = Math.round(zNormalized * (resolution - 1));
    return map[iX][iZ];
  };
})();

const srcDataPoints = [];

const Size = (timestamp, now = performance.now()) => {
  const delta = now - timestamp;
  const size = 25 * (1 - delta / 10000);
  return size;
};

const addRandomPoints = (n, updateImmediately = true) => {
  const srcNewDataPoints = [];
  for (let i = 0; i < n; i += 1) {
    const x = getRandom();
    const z = getRandom();
    const yBase = heightMap(x, z);
    const y = yBase + getRandom() * 100;
    const timestamp = performance.now();
    const value = getRandom();
    const dataPoint = { x, y, z, timestamp, value };
    srcNewDataPoints.push(dataPoint);
    srcDataPoints.push(dataPoint);
  }
  if (updateImmediately) {
    for (let i = 0; i < n; i += 1) {
      const dp = srcNewDataPoints[i];
      const size = Size(dp.timestamp, dp.timestamp);
      dp.size = size;
      points.add(dp);
    }
  }
};

const fullUpdate = () => {
  const now = performance.now();
  const data = [];
  const len = srcDataPoints.length;
  for (let i = len - 1; i >= 0; i -= 1) {
    const srcData = srcDataPoints[i];
    const size = Size(srcData.timestamp, now);
    if (size > 0) {
      data.push({
        x: srcData.x,
        y: srcData.y,
        z: srcData.z,
        value: srcData.value,
        size,
      });
    } else {
      // Can assume that rest of data points should be removed (progressive timestamp order).
      srcDataPoints.shift(i);
      break;
    }
  }

  points.clear().add(data);

  const pointsAmount = data.length;
  chart.setTitle(pointsAmount + " points");
};

setInterval(() => addRandomPoints(10), 100);
setInterval(fullUpdate, 1000);
