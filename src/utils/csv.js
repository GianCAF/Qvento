function parseLine(line) {
  const cells = []; let value = ''; let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { cells.push(value.trim()); value = '' }
    else value += char
  }
  cells.push(value.trim()); return cells
}

export function parseGuestsCsv(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) throw new Error('El CSV no contiene invitados.')
  const headers = parseLine(lines[0]).map((header) => header.toLowerCase())
  if (!headers.includes('full_name')) throw new Error('El CSV debe incluir la columna full_name.')
  return lines.slice(1).map(parseLine).map((cells, row) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() || null]))
    if (!record.full_name) throw new Error(`Falta el nombre en la fila ${row + 2}.`)
    const partySize = record.party_size == null ? 1 : Number(record.party_size)
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 99) throw new Error(`La cantidad de personas de la fila ${row + 2} debe estar entre 1 y 99.`)
    return { full_name: record.full_name, email: record.email, phone: record.phone, party_size: partySize }
  })
}
