import {
  QuadraticBezierCurve3,
  Vector3,
} from 'three'

/*
 * ===============================================================
 * HERO / CONSTELLATION STARS
 * ===============================================================
 *
 * The sky camera looks almost vertically along +Y.
 *
 * Therefore:
 *
 *   X = visible horizontal axis
 *   Z = visible vertical axis
 *   Y = celestial depth
 * ===============================================================
 */

export const HERO_STARS = Object.freeze([
  /*
   * 0 — left principal light
   */
  Object.freeze([
    -3.8,
    25.6,
    0.0,
  ]),

  /*
   * 1 — upper-left orbital point
   */
  Object.freeze([
    -2.65,
    25.25,
    -2.05,
  ]),

  /*
   * 2 — upper shared point
   */
  Object.freeze([
    0.0,
    26.0,
    -2.8,
  ]),

  /*
   * 3 — upper-right orbital point
   */
  Object.freeze([
    2.65,
    25.3,
    -2.0,
  ]),

  /*
   * 4 — right principal light
   */
  Object.freeze([
    3.8,
    25.7,
    0.0,
  ]),

  /*
   * 5 — lower-right orbital point
   */
  Object.freeze([
    2.7,
    24.9,
    2.05,
  ]),

  /*
   * 6 — lower-left orbital point
   */
  Object.freeze([
    -2.65,
    25.0,
    1.95,
  ]),
])

export const PRIMARY_STAR_INDICES =
  Object.freeze([
    0,
    4,
  ])

export const HERO_REVEAL_ORDER =
  Object.freeze([
    0,
    4,
    1,
    3,
    6,
    5,
    2,
  ])

/*
 * ===============================================================
 * HERO REVEAL TIMING
 * ===============================================================
 */

export const HERO_FIRST_DELAY =
  0.78

export const HERO_REVEAL_DELAY =
  0.48

export const HERO_REVEAL_DURATION =
  0.62

/*
 * ===============================================================
 * CONSTELLATION CONNECTIONS
 * ===============================================================
 *
 * Connections 0–6 form the shared orbital path.
 *
 * Connection 7 is the final direct bridge between
 * the two principal lights.
 * ===============================================================
 */

export const CONSTELLATION_CONNECTIONS =
  Object.freeze([
    Object.freeze({
      from: 0,
      to: 1,
      bend: 0.32,
    }),

    Object.freeze({
      from: 1,
      to: 2,
      bend: -0.3,
    }),

    Object.freeze({
      from: 2,
      to: 3,
      bend: 0.3,
    }),

    Object.freeze({
      from: 3,
      to: 4,
      bend: 0.32,
    }),

    Object.freeze({
      from: 4,
      to: 5,
      bend: -0.28,
    }),

    Object.freeze({
      from: 5,
      to: 6,
      bend: 0.26,
    }),

    Object.freeze({
      from: 6,
      to: 0,
      bend: -0.3,
    }),

    /*
     * Final emotional bridge.
     */
    Object.freeze({
      from: 0,
      to: 4,
      bend: 0.22,
    }),
  ])

export const ORBIT_CONNECTION_COUNT =
  7

export const FINAL_CONNECTION_INDEX =
  CONSTELLATION_CONNECTIONS.length -
  1

/*
 * ===============================================================
 * CONNECTION REVEAL TIMING
 * ===============================================================
 */

export const CONNECTIONS_START =
  HERO_FIRST_DELAY +
  (
    HERO_REVEAL_ORDER.length -
    1
  ) *
    HERO_REVEAL_DELAY +
  HERO_REVEAL_DURATION +
  0.42

export const CONNECTION_REVEAL_DELAY =
  0.34

export const CONNECTION_REVEAL_DURATION =
  0.62

export const CONSTELLATION_COMPLETE_TIME =
  CONNECTIONS_START +
  (
    CONSTELLATION_CONNECTIONS.length -
    1
  ) *
    CONNECTION_REVEAL_DELAY +
  CONNECTION_REVEAL_DURATION

/*
 * ===============================================================
 * SHARED CURVE CONSTRUCTION
 * ===============================================================
 *
 * ObservatorySky and DiscoveryResonance both use this
 * exact same mathematical curve definition.
 *
 * That guarantees that the visible constellation and
 * the interaction path are identical.
 * ===============================================================
 */

export function createConnectionCurve(
  fromPosition,
  toPosition,
  bend,
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
   * Bend only inside the visible X/Z plane.
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
   * Tiny Y separation prevents the line from
   * intersecting exactly with the star geometry.
   */
  midpoint.y += 0.08

  return new QuadraticBezierCurve3(
    start,
    midpoint,
    end,
  )
}
