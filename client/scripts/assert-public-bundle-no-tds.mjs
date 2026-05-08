import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const assetsDir = path.join(projectRoot, 'dist-static', 'assets')
const forbiddenPatterns = [/@toss\/tds-mobile/g, /@toss\/tds-mobile-ait/g, /TDSMobileAITProvider/g]

if (!fs.existsSync(assetsDir)) {
  console.error(`Public bundle assets directory not found: ${assetsDir}`)
  process.exit(1)
}

function collectJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return collectJsFiles(fullPath)
    }

    return entry.isFile() && fullPath.endsWith('.js') ? [fullPath] : []
  })
}

const jsFiles = collectJsFiles(assetsDir)

if (jsFiles.length === 0) {
  console.error(`No JavaScript assets found under: ${assetsDir}`)
  process.exit(1)
}

const failures = []

for (const filePath of jsFiles) {
  const contents = fs.readFileSync(filePath, 'utf8')

  for (const pattern of forbiddenPatterns) {
    pattern.lastIndex = 0

    if (pattern.test(contents)) {
      failures.push(`${path.relative(projectRoot, filePath)} contains ${pattern.source}`)
    }
  }
}

if (failures.length > 0) {
  console.error('Public bundle contains Apps in Toss/TDS-only runtime code:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Public bundle is free of Apps in Toss/TDS-only runtime markers.')
