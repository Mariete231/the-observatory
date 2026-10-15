import {
  QuadraticBezierCurve3,
  Vector3,
} from 'three'

export const CYGNUS_STARS = Object.freeze([
  Object.freeze({
    id: 'deneb',
    position: Object.freeze([
      0.15,
      27.8,
      3.35,
    ]),
    primary: true,
  }),

  Object.freeze({
    id: 'sadr',
    position: Object.freeze([
      0,
      27.5,
      0.35,
    ]),
    primary: false,
  }),

  Object.freeze({
    id: 'gienah',
    position: Object.freeze([
      -3.55,
      27.15,
      0.4,
    ]),
    primary: false,
  }),

  Object.freeze({
    id: 'delta',
    position: Object.freeze([
      3.55,
      27.15,
      0.4,
    ]),
    primary: false,
  }),

  Object.freeze({
    id: 'albireo',
    position: Object.freeze([
      0.15,
      27.05,
      -2.65,
    ]),
    primary: true,
  }),

  Object.freeze({
    id: 'zeta',
    position: Object.freeze([
      -1.7,
      27.25,
      -0.95,
    ]),
    primary: false,
  }),

  Object.freeze({
    id: 'epsilon',
    position: Object.freeze([
      1.8,
      27.25,
      -0.95,
    ]),
    primary: false,
  }),
])

export const CYGNUS_VISIBLE_CONNECTIONS =
  Object.freeze([
    Object.freeze({
      from: 0,
      to: 1,
      bend: 0.06,
    }),

    Object.freeze({
      from: 1,
      to: 4,
      bend: 0.06,
    }),

    Object.freeze({
      from: 1,
      to: 2,
      bend: 0.06,
    }),

    Object.freeze({
      from: 1,
      to: 3,
      bend: 0.06,
    }),

    Object.freeze({
      from: 1,
      to: 5,
      bend: 0.06,
    }),

    Object.freeze({
      from: 1,
      to: 6,
      bend: 0.06,
    }),
  ])

export const CYGNUS_REVEAL_ORDER =
  Object.freeze([
    0,
    1,
    2,
    3,
    4,
    5,
    6,
  ])

export const CYGNUS_FIRST_DELAY =
  0.28

export const CYGNUS_REVEAL_DELAY =
  0.22

export const CYGNUS_REVEAL_DURATION =
  0.52

export const CYGNUS_CONNECTION_START =
  CYGNUS_FIRST_DELAY +
  (
    CYGNUS_REVEAL_ORDER.length - 1
  ) *
    CYGNUS_REVEAL_DELAY +
  CYGNUS_REVEAL_DURATION +
  0.3

export const CYGNUS_CONNECTION_REVEAL_DELAY =
  0.18

export const CYGNUS_CONNECTION_REVEAL_DURATION =
  0.65

export const CYGNUS_COMPLETE_TIME =
  CYGNUS_CONNECTION_START +
  (
    CYGNUS_VISIBLE_CONNECTIONS.length - 1
  ) *
    CYGNUS_CONNECTION_REVEAL_DELAY +
  CYGNUS_CONNECTION_REVEAL_DURATION

export const CYGNUS_RESONANCE_UNLOCK_DELAY =
  0.72

/*
 * The interactive resonance route is deliberately open:
 *
 * Deneb → Sadr → Albireo
 *
 * Connection 0 = Deneb → Sadr
 * Connection 1 = Sadr → Albireo
 */
export const CYGNUS_RESONANCE_CONNECTIONS =
  Object.freeze([
    0,
    1,
  ])

function createConnectionCurve(
  fromPosition,
  toPosition,
  bend = 0,
) {
  const start =
    new Vector3(
      ...fromPosition,
    )

  const end =
    new Vector3(
      ...toPosition,
    )

  const midpoint =
    new Vector3()
      .addVectors(
        start,
        end,
      )
      .multiplyScalar(
        0.5,
      )

  const direction =
    new Vector3()
      .subVectors(
        end,
        start,
      )

  /*
   * The bend exists only inside
   * the visible X/Z plane.
   */
  const perpendicular =
    new Vector3(
      -direction.z,
      0,
      direction.x,
    )

  if (
    perpendicular.lengthSq() >
    0
  ) {
    perpendicular.normalize()

    midpoint.addScaledVector(
      perpendicular,
      bend,
    )
  }

  /*
   * Tiny depth separation between
   * curve and star geometry.
   */
  midpoint.y += 0.08

  return new QuadraticBezierCurve3(
    start,
    midpoint,
    end,
  )
}

export function createCygnusConnectionCurve(
  connectionIndex,
) {
  const connection =
    CYGNUS_VISIBLE_CONNECTIONS[
      connectionIndex
    ]

  if (!connection) {
    return null
  }

  const fromStar =
    CYGNUS_STARS[
      connection.from
    ]

  const toStar =
    CYGNUS_STARS[
      connection.to
    ]

  if (
    !fromStar ||
    !toStar
  ) {
    return null
  }

  return createConnectionCurve(
    fromStar.position,
    toStar.position,
    connection.bend,
  )
}