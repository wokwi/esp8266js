import { createServer } from 'net';
import { ESP8266 } from '..';
import { LX106Core } from '../core/lx106-core';
import { Simulator } from '../sim/simulator';
import { gdb, gdbBreak, gdbChecksum, gdbSIGINT } from './gdb-protocol';

const DEBUG = false;

export class GDBServer {
  constructor(simulator: Simulator, esp: ESP8266, port = 3333) {
    const server = createServer();
    server.listen(port, '0.0.0.0');
    server.on('connection', (socket) => {
      simulator.stop();
      let buf = '';
      socket.setNoDelay(true);
      socket.on('data', (data) => {
        if (data[0] === 3) {
          console.log('BREAK');
          simulator.stop();
          socket.write(gdbSIGINT);
          data = data.slice(1);
        }

        esp.onBreak = (core: LX106Core) => {
          core.nextPC = core.PC;
          simulator.stop();
          socket.write(gdbBreak(1));
        };

        buf += data.toString('utf-8');
        for (;;) {
          const dolla = buf.indexOf('$');
          const hash = buf.indexOf('#');
          if (dolla < 0 || hash < 0 || hash < dolla || hash + 2 > buf.length) {
            return;
          }
          const cmd = buf.substr(dolla + 1, hash - dolla - 1);
          const cksum = buf.substr(hash + 1, 2);
          buf = buf.substr(hash + 2);
          if (gdbChecksum(cmd) !== cksum) {
            console.warn('Warning: GDB checksum error in message:', cmd);
            socket.write('-');
          } else {
            socket.write('+');
            if (DEBUG) {
              console.log('>', cmd);
            }
            const reply = gdb(simulator, esp, cmd);
            if (reply) {
              if (DEBUG) {
                console.log('<', reply);
              }
              socket.write(reply);
            }
          }
        }
      });
    });
  }
}
