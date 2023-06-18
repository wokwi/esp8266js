import arg from 'arg';
import chalk from 'chalk';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { ESP8266 } from '../src';
import { GDBServer } from '../src/gdb/gdb-server';
import { Simulator } from '../src/sim/simulator';
import { printBanner } from './banner';
import { cliHelp, cliName } from './cli-help';
import { hex32 } from '../src/utils/hex';

const args = arg(
  {
    '--help': Boolean,
    '--gdb': Number,
    '--pause': Boolean,
    '--quiet': Boolean,
    '--input-raw': Boolean,
    '--exit-on-reset': Boolean,
    '--pid-file': String,
    '--throttle': Number,
    '-a': '--app',
    '-g': '--gdb',
    '-h': '--help',
    '-q': '--quiet',
  },
  { argv: process.argv.slice(2) }
);

if (args['--help']) {
  cliHelp();
  process.exit(0);
}

const gdbPort = args['--gdb'] ?? 0;
const pause = args['--pause'] ?? false;
const quiet = args['--quiet'] ?? false;
const inputRaw = args['--input-raw'] ?? false;
const exitOnReset = args['--exit-on-reset'] ?? false;
const pidFile = args['--pid-file'];
const throttle = args['--throttle'] ?? 0;

if (!quiet) {
  printBanner();
  console.log('');
  console.error(`Simulating ESP8266`);
}

const cpu = new ESP8266();
const simulator = new Simulator(cpu);
if (throttle > 0 && throttle <= 100) {
  simulator.throttle = throttle;
}
cpu.loadROM(readFileSync('rom/esp8266_rom.bin'));

const fileList = args._;

if (!fileList.length) {
  console.error('');
  console.error(
    chalk.red('error'),
    'Missing file list! Please specify a list of .bin files to load. e.g.'
  );
  console.error('');
  console.error(chalk.dim('$') + ` ${chalk.bold(cliName)} 0x1000 hello-world.bin`);
  console.error('');
  console.error(`For more info, run: ${chalk.bold(cliName)} --help`);
  process.exit(2);
}

for (let i = 0; i < fileList.length; i += 2) {
  const offset = parseInt(fileList[i]);
  const filename = fileList[i + 1];
  if (!quiet) {
    console.log(`Loading ${filename} at 0x${offset.toString(16)}`);
  }
  const app = readFileSync(filename);
  cpu.flash.set(app, offset);
}

cpu.cores[0].unknownInstruction = (opcode) => {
  console.error(`${hex32(cpu.cores[0].PC)}: ${opcode.toString(16)} UNKNOWN INSTRUCTION`);
  process.exit(65);
};

// GDB
if (gdbPort) {
  const server = new GDBServer(simulator, cpu, gdbPort);
}

console.error('');

function serialInput(byte: number) {
  cpu.uart[0].feedByte(byte);
}

/* Attach UART to stdin / stderr */
if (inputRaw) {
  process.stdin.setRawMode(true);
}
process.stdin.on('data', (data) => {
  if (inputRaw && data[0] === 0x1d) {
    // 0x1d is Ctrl+]
    process.exit(0);
  }
  for (const c of data) {
    serialInput(c);
  }
});
cpu.uart[0].onTX = (value) => {
  process.stderr.write(String.fromCharCode(value));
  cpu.uart[0].txComplete();
};

let startTime = 0;
if (exitOnReset) {
  cpu.onReset = () => {
    console.log('Time:', new Date().getTime() - startTime);
    process.exit(0);
  };
  for (const core of cpu.cores) {
    core.reset = () => {
      console.log('Time:', new Date().getTime() - startTime);
      process.exit(0);
    };
  }
}

if (pidFile) {
  writeFileSync(pidFile, `${process.pid}\n`, { encoding: 'utf-8' });
  process.on('exit', () => {
    try {
      unlinkSync(pidFile);
    } catch {
      /* pass */
    }
  });
}

process.on('SIGINT', () => process.exit(0));

async function start() {
  if (gdbPort && !quiet) {
    console.log('To connect with GDB:');
    console.log('');
    console.log(`  xtensa-lx106-elf-gdb -ex "target remote localhost:${gdbPort}"`);
    console.log('');
  }
  if (!pause || !gdbPort) {
    startTime = new Date().getTime();
    simulator.execute();
  } else if (!quiet) {
    console.log('Waiting for debugger...');
  }
}

start().catch(console.error);
