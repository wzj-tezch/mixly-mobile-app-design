/** Replace Blockly field values when a component/screen is renamed in the designer. */
export function renameInBlocksXml(xml: string, oldName: string, newName: string): string {
  if (!xml?.trim() || !oldName || oldName === newName) return xml
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = (field: string) =>
    new RegExp(`(<field\\s+name="${field}">)${esc(oldName)}(</field>)`, 'g')
  return xml.replace(re('COMPONENT'), `$1${newName}$2`).replace(re('SCREEN'), `$1${newName}$2`)
}
