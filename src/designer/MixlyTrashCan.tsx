import { useState } from 'react'
import { useProjectStore } from '@/project/store'

/** Mixly Blockly trashcan (sprites.svg, 47×60, lid animation). */
export function MixlyTrashCan() {
  const [open, setOpen] = useState(false)
  const deleteComponent = useProjectStore((s) => s.deleteComponent)

  return (
    <button
      type="button"
      className={`mix-trash${open ? ' mix-trash-open' : ''}`}
      title="拖入此处删除组件"
      aria-label="垃圾桶：将组件拖入即可删除"
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
        setOpen(true)
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        setOpen(true)
      }}
      onDragLeave={() => setOpen(false)}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        const id = e.dataTransfer.getData('componentId')
        if (id) deleteComponent(id)
      }}
    >
      <svg className="mix-trash-svg" width="47" height="60" viewBox="0 32 47 60" aria-hidden>
        <g className="mix-trash-lid" fill="#888">
          <path d="M 2,41 v 6 h 42 v -6 h -10.5 l -3,-3 h -15 l -3,3 z" />
        </g>
        <g className="mix-trash-body" fill="#888">
          <rect width="36" height="42" x="5" y="50" rx="4" ry="4" />
        </g>
      </svg>
    </button>
  )
}
