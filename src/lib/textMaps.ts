export function parseKeyValueLines(value: string): Record<string, string> {
  const params: Record<string, string> = {}

  for (const line of value.split('\n')) {
    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const parsedValue = line.slice(separatorIndex + 1).trim()
    if (!key) {
      continue
    }

    params[key] = parsedValue
  }

  return params
}

export function formatKeyValueLines(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

export function parseListValueLines(value: string): Record<string, string[]> {
  const matrix: Record<string, string[]> = {}

  for (const line of value.split('\n')) {
    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    if (!key) {
      continue
    }

    const values = line
      .slice(separatorIndex + 1)
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    if (values.length === 0) {
      continue
    }

    matrix[key] = values
  }

  return matrix
}

export function formatListValueLines(params: Record<string, string[]>): string {
  return Object.entries(params)
    .map(([key, values]) => `${key}=${values.join(', ')}`)
    .join('\n')
}
