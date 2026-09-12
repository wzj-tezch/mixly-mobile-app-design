type IconName =
  | 'ccw'
  | 'cw'
  | 'floppy'
  | 'upload'
  | 'window'
  | 'puzzle'
  | 'cube'
  | 'code'
  | 'doc'
  | 'doc-new'
  | 'folder'
  | 'cog'
  | 'down'
  | 'panel'
  | 'plus'
  | 'book'
  | 'comment'
  | 'play'
  | 'minus'

const PATHS: Record<IconName, string> = {
  ccw: 'M7.2 3.2A6 6 0 1 0 13 9h-1.6A4.4 4.4 0 1 1 7.4 4.6L9 6.2H4V1.2l3.2 2z',
  cw: 'M8.8 3.2A6 6 0 1 1 3 9h1.6A4.4 4.4 0 1 0 8.6 4.6L7 6.2H12V1.2L8.8 3.2z',
  floppy: 'M3 2.5h7.2L13 5.3V13.5H3zm1.5 0v4h6v-4zm0 6v3.5h7V8.5z',
  upload: 'M8 2.2 4.6 5.6h2.2V11h2.4V5.6h2.2zm-4.5 9.3v1.5h9V11.5z',
  window: 'M2.5 3.5h11v9h-11zm1.4 2.2v5.4h8.2V5.7z',
  puzzle: 'M6.2 2.4c.8 0 1.3.6 1.3 1.3H9.4c.7 0 1.2.5 1.2 1.2v1.6h1.5c.8 0 1.4.6 1.4 1.4 0 .8-.6 1.3-1.4 1.3H10.6v1.8c0 .7-.5 1.2-1.2 1.2H7.5c0 .8-.6 1.4-1.3 1.4S4.8 12.4 4.8 11.6H3.2c-.7 0-1.2-.5-1.2-1.2V8.6h1.6c.8 0 1.3-.5 1.3-1.3S4.4 6 3.6 6H2V4.9c0-.7.5-1.2 1.2-1.2h1.6c0-.7.6-1.3 1.4-1.3z',
  cube: 'M8 1.8 13.4 4.6v6.8L8 14.2 2.6 11.4V4.6zm0 1.8L4.4 5.4 8 7.2l3.6-1.8zm4.1 2.4L8.8 8.1v4.4l3.3-1.7zM7.2 12.5V8.1L3.9 6z',
  code: 'M6.2 3.2 2.4 8l3.8 4.8 1.2-.9L4.4 8l3-3.9zm3.6 0-1.2.9L11.6 8l-3 3.9 1.2.9L13.6 8z',
  doc: 'M4 2.2h5.2L12 5v8.8H4zm5 .8v2.6h2.6z',
  'doc-new': 'M4 2.2h5.2L12 5v8.8H4zm5 .8v2.6h2.6zM7.2 8v2.2H5V11h2.2v2.2h.8V11H10v-.8H8.2V8z',
  folder: 'M2.4 3.4h4.2l1.2 1.4H13.6v7.8H2.4z',
  cog: 'M7.1 1.8h1.8l.3 1.6 1.3.6 1.4-.8 1.3 1.3-.8 1.4.6 1.3 1.6.3v1.8l-1.6.3-.6 1.3.8 1.4-1.3 1.3-1.4-.8-1.3.6-.3 1.6H7.1l-.3-1.6-1.3-.6-1.4.8-1.3-1.3.8-1.4-.6-1.3L1.8 8.9V7.1l1.6-.3.6-1.3-.8-1.4L4.5 2.8l1.4.8 1.3-.6zM8 10.1A2.1 2.1 0 1 0 8 5.9a2.1 2.1 0 0 0 0 4.2z',
  down: 'M4 6.2 8 10.2 12 6.2',
  panel: 'M2.4 3.2h11.2v9.6H2.4zm1.4 1.4v6.8h8.4V4.6zm1.2 5.1h6v1.4h-6z',
  plus: 'M7.2 2.8h1.6v4.4H13.2v1.6H8.8v4.4H7.2V8.8H2.8V7.2h4.4z',
  book: 'M3 2.4h4.4c.8 0 1.4.4 1.6 1 .2-.6.8-1 1.6-1H15v10.4H10.6c-.7 0-1.3.3-1.6.8-.3-.5-.9-.8-1.6-.8H3zm1.4 1.4v7.2h3.2c.4 0 .8.1 1.1.4V4.6c-.3-.2-.7-.4-1.1-.4zm7.2 0c-.4 0-.8.1-1.1.4v6.8c.3-.2.7-.4 1.1-.4h3.2V3.8z',
  comment: 'M2.6 3.2h10.8v7.2H8.2L5 13.2V10.4H2.6z',
  play: 'M4.2 2.6v10.8L13.4 8z',
  minus: 'M3 7.2h10v1.6H3z',
}

export function MixlyIcon({ name, className = '' }: { name: IconName; className?: string }) {
  const isStroke = name === 'down'
  return (
    <svg
      className={`mixly-ico ${className}`.trim()}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      {isStroke ? (
        <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={PATHS[name]} fill="currentColor" />
      )}
    </svg>
  )
}
