import { app } from 'electron'
import { startApplication } from './start-application'

app.setName('Electron Boilerplate')
if (process.platform === 'win32') app.setAppUserModelId('dev.electron.boilerplate')
app.setAppLogsPath()
startApplication()
