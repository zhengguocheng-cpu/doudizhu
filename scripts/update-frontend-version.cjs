const fs = require('fs')
const path = require('path')

function pad(value) {
  return value.toString().padStart(2, '0')
}

const now = new Date()
const version = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

const envFilePath = path.join(__dirname, '..', 'frontend-spa', '.env.local')

let existing = ''
if (fs.existsSync(envFilePath)) {
  const content = fs.readFileSync(envFilePath, 'utf8')
  const filteredLines = content
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('VITE_APP_BUILD_VERSION='))
  if (filteredLines.length > 0) {
    existing = filteredLines.join('\n') + '\n'
  }
}

const newContent = `${existing}VITE_APP_BUILD_VERSION=${version}\n`

fs.writeFileSync(envFilePath, newContent, 'utf8')

console.log(`VITE_APP_BUILD_VERSION=${version}`)
