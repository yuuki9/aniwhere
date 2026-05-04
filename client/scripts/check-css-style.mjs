import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const cssRoot = join(process.cwd(), 'src')
const cssFiles = []

function collectCssFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      collectCssFiles(path)
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.css')) {
      cssFiles.push(path)
    }
  }
}

collectCssFiles(cssRoot)

const failures = []

for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8')
  const lines = source.split(/\r?\n/)

  lines.forEach((line, index) => {
    const column = line.indexOf('currentColor')

    if (column !== -1) {
      failures.push(`${relative(process.cwd(), file)}:${index + 1}:${column + 1} uses currentColor; use currentcolor in CSS`)
    }
  })
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
