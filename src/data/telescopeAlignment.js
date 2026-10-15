export const TELESCOPE_ALIGNMENT = Object.freeze({
  minAzimuth: -0.9,
  maxAzimuth: 0.9,

  minElevation: -0.35,
  maxElevation: 0.9,

  targetAzimuth: 0.56,
  targetElevation: 0.48,

  initialAzimuth: -0.25,
  initialElevation: -0.18,

  yawSensitivity: 0.005,
  elevationSensitivity: 0.004,
})

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Returns the signed, normalized HUD offset for the current telescope
 * orientation. Shared by the HUD and the alignment lock test so both
 * use precisely the same coordinate mapping.
 */
export function getAlignmentIndicatorError(
  azimuth,
  elevation,
) {
  const horizontalError =
    azimuth < TELESCOPE_ALIGNMENT.targetAzimuth
      ? Math.min(
          1,
          (TELESCOPE_ALIGNMENT.targetAzimuth - azimuth) /
            (TELESCOPE_ALIGNMENT.targetAzimuth -
              TELESCOPE_ALIGNMENT.minAzimuth),
        )
      : -Math.min(
          1,
          (azimuth - TELESCOPE_ALIGNMENT.targetAzimuth) /
            (TELESCOPE_ALIGNMENT.maxAzimuth -
              TELESCOPE_ALIGNMENT.targetAzimuth),
        )

  const verticalError =
    elevation < TELESCOPE_ALIGNMENT.targetElevation
      ? Math.min(
          1,
          (TELESCOPE_ALIGNMENT.targetElevation - elevation) /
            (TELESCOPE_ALIGNMENT.targetElevation -
              TELESCOPE_ALIGNMENT.minElevation),
        )
      : -Math.min(
          1,
          (elevation - TELESCOPE_ALIGNMENT.targetElevation) /
            (TELESCOPE_ALIGNMENT.maxElevation -
              TELESCOPE_ALIGNMENT.targetElevation),
        )

  return {
    horizontalError,
    verticalError,
  }
}

export function getAlignmentProgress(
  azimuth,
  elevation,
) {
  const azimuthRange =
    TELESCOPE_ALIGNMENT.maxAzimuth -
    TELESCOPE_ALIGNMENT.minAzimuth

  const elevationRange =
    TELESCOPE_ALIGNMENT.maxElevation -
    TELESCOPE_ALIGNMENT.minElevation

  const azimuthError =
    Math.abs(
      azimuth -
        TELESCOPE_ALIGNMENT.targetAzimuth,
    ) / azimuthRange

  const elevationError =
    Math.abs(
      elevation -
        TELESCOPE_ALIGNMENT.targetElevation,
    ) / elevationRange

  const distance =
    Math.sqrt(
      azimuthError * azimuthError +
        elevationError * elevationError,
    ) / Math.sqrt(2)

  return clamp(1 - distance, 0, 1)
}