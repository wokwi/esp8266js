import chalk from 'chalk';
import { printBanner } from './banner';

export const cliName = 'wokwi-esp8266';

export function cliHelp() {
  printBanner();

  console.log(chalk`
  {bold USAGE}

      {dim $} {bold wokwi-esp8266} [options] {cyan <address>} <filename> [{cyan <address>} <filename> ...] 
      {dim $} {bold wokwi-esp8266} [options] {cyan uf2} <filename.uf2>

  {bold OPTIONS}
      {green -h} {green --help}                   Shows this help message and exit
      {green --gdb} <PORT>, {green -g} <PORT>     Start a GDB Server on the given TCP port (e.g. 3333)
      {green --pause}                     Start the CPU paused, waiting for GDB to connect
      {green --input-raw}                 Raw input mode, pass Ctrl+C to simulated program. 
                                  Useful with MicroPython. Exit with Ctrl+].
      {green --throttle} <THROTTLE>       Throttle the CPU to the given percentage (1-100). Default: 0 (no throttle)
      {green --exit-on-reset}             Exit when the simulated program resets (exit code 42)
      {green --pid-file} filename.pid     Write the process id to the given file
      {green --quiet}, {green -q}                 Do not print logo, version, etc.
`);
}
