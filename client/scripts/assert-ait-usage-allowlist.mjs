import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const srcDir = path.join(projectRoot, 'src')

const allowedAitImportFiles = new Set([
  'src/pages/ExplorePage.tsx',
  'src/pages/PostDetailPage.tsx',
  'src/pages/SearchPage.tsx',
  'src/pages/ShopPage.tsx',
  'src/pages/admin/AdminAccessGate.tsx',
  'src/pages/admin/AdminShopLocationPage.tsx',
  'src/pages/admin/AdminShopManagePage.tsx',
  'src/pages/admin/AdminShopsPage.tsx',
  'src/shared/ui/MainLayout.tsx',
])

const aitImportPattern = /from\s+['"][^'"]*(?:shared\/ui\/ait|shared\\ui\\ait|\/ait|\\ait)['"]/g

function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath)
    }

    return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : []
  })
}

function toProjectPath(filePath) {
  return path.relative(projectRoot, filePath).replaceAll(path.sep, '/')
}

const violations = []

for (const filePath of collectSourceFiles(srcDir)) {
  const projectPath = toProjectPath(filePath)

  if (projectPath.startsWith('src/shared/ui/ait/')) {
    continue
  }

  const contents = fs.readFileSync(filePath, 'utf8')
  aitImportPattern.lastIndex = 0

  if (aitImportPattern.test(contents) && !allowedAitImportFiles.has(projectPath)) {
    violations.push(projectPath)
  }
}

if (violations.length > 0) {
  console.error('New Ait* imports are not allowed without an explicit launch/TDS review.')
  console.error('Use @aniwhere/tds-mobile first when an official TDS component exists.')
  console.error('If this is a public fallback or official TDS has no matching component, update this allowlist with PR rationale.')

  for (const violation of violations) {
    console.error(`- ${violation}`)
  }

  process.exit(1)
}

console.log('Ait* usage is limited to the reviewed allowlist.')
