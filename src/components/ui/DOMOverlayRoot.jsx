import {
  useEffect,
  useRef,
} from 'react'
import { createRoot } from 'react-dom/client'

function DOMOverlayRoot({ children }) {
  const rootRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const container =
      document.createElement('div')

    container.id =
      'observatory-ui-root'

    Object.assign(container.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      margin: '0',
      padding: '0',
      pointerEvents: 'none',
      zIndex: '2000',
    })

    document.body.appendChild(
      container,
    )

    const root =
      createRoot(container)

    rootRef.current = root
    containerRef.current =
      container

    root.render(children)

    return () => {
      /*
       * Clear our refs immediately so subsequent
       * renders cannot target this old root.
       */
      if (
        rootRef.current === root
      ) {
        rootRef.current = null
      }

      if (
        containerRef.current ===
        container
      ) {
        containerRef.current =
          null
      }

      /*
       * React 19 can execute effect cleanup while
       * another root is still committing.
       *
       * Deferring the unmount until the current
       * React work has completed avoids:
       *
       * "Attempted to synchronously unmount a root
       * while React was already rendering."
       */
      queueMicrotask(() => {
        try {
          root.unmount()
        } finally {
          container.remove()
        }
      })
    }
  }, [])

  useEffect(() => {
    const root =
      rootRef.current

    if (!root) {
      return
    }

    root.render(children)
  }, [children])

  return null
}

export default DOMOverlayRoot
