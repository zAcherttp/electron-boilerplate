import pretty from 'pino-pretty'

export function createDevelopmentLogDestination(destination: number | string) {
  return pretty({
    colorize: destination === 1 && pretty.isColorSupported,
    colorizeObjects: true,
    customColors: 'trace:gray,debug:cyan,info:green,warn:yellow,error:red,fatal:bgRed',
    destination,
    ignore: 'hostname,appVersion,component',
    messageFormat: '[Electron] [{component}] {msg}',
    singleLine: true,
    sync: true,
    translateTime: 'SYS:mm/dd/yyyy, h:MM:ss TT',
  })
}
