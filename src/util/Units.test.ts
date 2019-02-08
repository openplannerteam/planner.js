import "jest";
import { DistanceM, DurationMs, SpeedKmH } from "../interfaces/units";
import Units from "./Units";

test("[Units] toSpeed", () => {

  const distance: DistanceM = 10000;
  const duration: DurationMs = 3600000;
  const speed: SpeedKmH = Units.toSpeed(distance, duration);

  expect(speed).toBeDefined();
  expect(speed).toEqual(10);
});

test("[Units] toDuration", () => {

  const distance: DistanceM = 10000;
  const speed: SpeedKmH = 10;
  const duration: DurationMs = Units.toDuration(distance, speed);

  expect(duration).toBeDefined();
  expect(duration).toEqual(3600000);
});

test("[Units] toDistance", () => {

  const duration: DurationMs = 3600000;
  const speed: SpeedKmH = 10;
  const distance: DistanceM = Units.toDistance(speed, duration);

  expect(distance).toBeDefined();
  expect(distance).toEqual(10000);
});

test("[Units] fromHour", () => {

  const duration: DurationMs = Units.fromHours(1);

  expect(duration).toBeDefined();
  expect(duration).toEqual(3600000);
});

test("[Units] fromSeconds", () => {

  const duration: DurationMs = Units.fromSeconds(2);

  expect(duration).toBeDefined();
  expect(duration).toEqual(2000);
});
