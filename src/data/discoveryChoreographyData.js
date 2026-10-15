export const DISCOVERY_ROUTE = Object.freeze([
  Object.freeze({
    id: 'deneb-to-sadr',
    from: 'deneb',
    to: 'sadr',
    connectionIndex: 0,
    duration: 4.5,
    hold: 1.8,
    text: 'Every story has a first light.',
  }),

  Object.freeze({
    id: 'sadr-to-gienah',
    from: 'sadr',
    to: 'gienah',
    connectionIndex: 2,
    duration: 4.2,
    hold: 1.6,
    text: 'Then, somehow, we found each other.',
  }),

  Object.freeze({
    id: 'gienah-to-sadr',
    from: 'gienah',
    to: 'sadr',
    connectionIndex: 2,
    duration: 3.4,
    hold: 0.8,
    text: 'Some things are worth returning to.',
  }),

  Object.freeze({
    id: 'sadr-to-delta',
    from: 'sadr',
    to: 'delta',
    connectionIndex: 3,
    duration: 4.2,
    hold: 1.6,
    text: 'The little moments became memories.',
  }),

  Object.freeze({
    id: 'delta-to-sadr',
    from: 'delta',
    to: 'sadr',
    connectionIndex: 3,
    duration: 3.4,
    hold: 0.8,
    text: 'And the memories stayed.',
  }),

  Object.freeze({
    id: 'sadr-to-zeta',
    from: 'sadr',
    to: 'zeta',
    connectionIndex: 4,
    duration: 4.2,
    hold: 1.6,
    text: 'Even from far away, the same sky remained.',
  }),

  Object.freeze({
    id: 'zeta-to-sadr',
    from: 'zeta',
    to: 'sadr',
    connectionIndex: 4,
    duration: 3.4,
    hold: 0.8,
    text: 'There was always a way back.',
  }),

  Object.freeze({
    id: 'sadr-to-epsilon',
    from: 'sadr',
    to: 'epsilon',
    connectionIndex: 5,
    duration: 4.2,
    hold: 1.6,
    text: 'There was always another moment to keep.',
  }),

  Object.freeze({
    id: 'epsilon-to-sadr',
    from: 'epsilon',
    to: 'sadr',
    connectionIndex: 5,
    duration: 3.4,
    hold: 0.8,
    text: 'Another reason to stay.',
  }),

  Object.freeze({
    id: 'sadr-to-albireo',
    from: 'sadr',
    to: 'albireo',
    connectionIndex: 1,
    duration: 4.8,
    hold: 2.6,
    text: 'And somehow, it all connected.',
  }),
])

const INITIAL_HOLD = 2.2
const FINAL_BRIDGE_DURATION = 4.6
const FINAL_PULSE_DURATION = 2.8
const FINAL_HOLD_DURATION = 4.8
const TEXT_REVEAL_OFFSET = 0.8

function buildTimeline() {
  let cursor = INITIAL_HOLD

  const stages = DISCOVERY_ROUTE.map(
    (stage) => {
      const start = cursor

      const travelEnd =
        start +
        stage.duration

      const end =
        travelEnd +
        stage.hold

      cursor = end

      return Object.freeze({
        ...stage,
        start,
        travelEnd,
        end,
      })
    },
  )

  const finalBridgeStart =
    cursor

  const finalBridgeEnd =
    finalBridgeStart +
    FINAL_BRIDGE_DURATION

  const finalPulseStart =
    finalBridgeEnd

  const finalPulseEnd =
    finalPulseStart +
    FINAL_PULSE_DURATION

  const textRevealStart =
    finalPulseEnd +
    TEXT_REVEAL_OFFSET

  const end =
    finalPulseEnd +
    FINAL_HOLD_DURATION

  return Object.freeze({
    initialHold: INITIAL_HOLD,
    stages: Object.freeze(stages),
    finalBridgeStart,
    finalBridgeEnd,
    finalPulseStart,
    finalPulseEnd,
    textRevealStart,
    end,
  })
}

export const DISCOVERY_TIMELINE =
  buildTimeline()