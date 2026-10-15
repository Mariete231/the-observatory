import { Vector3 } from 'three'
import {
  CYGNUS_RESONANCE_CONNECTIONS,
  CYGNUS_STARS,
  createCygnusConnectionCurve,
} from './cygnusData'

export const DISCOVERY_RESONANCE =
  Object.freeze({
    startRadius: 0.14,

    corridorRadius: 0.115,

    backtrackTolerance: 0.025,

    completionThreshold: 0.985,

    completionHold: 2.2,

    samplesPerConnection: 32,

    guideCyclesPerSecond: 0.055,
  })

function buildResonancePath() {
  const points = []

  CYGNUS_RESONANCE_CONNECTIONS.forEach(
    (
      connectionIndex,
      routeIndex,
    ) => {
      const curve =
        createCygnusConnectionCurve(
          connectionIndex,
        )

      if (
        !curve
      ) {
        return
      }

      const curvePoints =
        curve.getPoints(
          DISCOVERY_RESONANCE
            .samplesPerConnection,
        )

      const pointsToAdd =
        routeIndex <
        CYGNUS_RESONANCE_CONNECTIONS.length -
          1
          ? curvePoints.slice(
              0,
              -1,
            )
          : curvePoints

      points.push(
        ...pointsToAdd,
      )
    },
  )

  return points.map(
    (
      point,
    ) =>
      new Vector3(
        point.x,
        point.y,
        point.z,
      ),
  )
}

export const ORBIT_PATH =
  Object.freeze(
    buildResonancePath(),
  )

export const ORBIT_START =
  Object.freeze([
    ...CYGNUS_STARS[0]
      .position,
  ])

export const ORBIT_END =
  Object.freeze([
    ...CYGNUS_STARS[4]
      .position,
  ])