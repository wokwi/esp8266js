import { ESP8266 } from '../esp8266';
import { BasePeripheral } from './base-peripheral';

const flashIds: Record<number, number> = {
  0.5: 0x1440ef, // Winbond W25Q40
  1: 0x1440ef, // Winbond W25Q80
  2: 0x1540ef, // Winbond W25X16
  4: 0x1640c8, // GigaDevice GD25Q32
};

const MS = 1_000_000; /* nanos */
const SECTOR_ERASE_TIME = 12 * MS;
const BLOCK_ERASE_TIME = 16 * MS;

const SPI_CMD_REG = 0x0;
const CMD_USR = 1 << 18;
const SPI_ADDR_REG = 0x4;

const SPI_RD_STATUS_REG = 0x10;
const SPI_CLOCK_REG = 0x14;
const SPI_USER_REG = 0x18;
const SPI_USER1_REG = 0x1c;
const SPI_USER2_REG = 0x20;
const SPI_MOSI_DLEN_REG = 0x24;
const SPI_MISO_DLEN_REG = 0x28;
const SPI_SLAVE_REG = 0x30;
const SPI_W0_REG = 0x40;
const CLKDIV_PRE_MASK = 0x1fff;

// CLOCK register bits
const SPI_CLK_EQU_SYSCLK = 1 << 31;
const SPI_CLKDIV_PRE_SHIFT = 18;
const SPI_CLKCNT_N_SHIFT = 12;
const SPI_CLKCNT_N_MASK = 0x3f;

// USER register bits
/** read-write Set the bit to enable full duplex communication. 1: enable 0: disable. Can be configured in CONF state. */
const DOUTDIN = 1 << 0;
/** read-write Both for master mode and slave mode. 1: spi controller is in QPI mode. 0: others. Can be configured in CONF state. */
const QPI_MODE = 1 << 3;
/** read-write Just for master mode. 1: spi controller is in OPI mode (all in 8-bit mode). 0: others. Can be configured in CONF state. */
const OPI_MODE = 1 << 4;
/** read-write In the slave mode, this bit can be used to change the polarity of tsck. 0: tsck = spi_ck_i. 1:tsck = !spi_ck_i. */
const TSCK_I_EDGE = 1 << 5;
/** read-write spi cs keep low when spi is in  done  phase. 1: enable 0: disable. Can be configured in CONF state. */
const CS_HOLD = 1 << 6;
/** read-write spi cs is enable when spi is in  prepare  phase. 1: enable 0: disable. Can be configured in CONF state. */
const CS_SETUP = 1 << 7;
/** read-write In the slave mode, this bit can be used to change the polarity of rsck. 0: rsck = !spi_ck_i. 1:rsck = spi_ck_i. */
const RSCK_I_EDGE = 1 << 8;
/** read-write the bit combined with SPI_DOUT_MODE register to set mosi signal delay mode. Can be configured in CONF state. */
const CK_OUT_EDGE = 1 << 9;
/** read-write In read-data (MISO) phase 1: big-endian 0: little_endian. Can be configured in CONF state. */
const RD_BYTE_ORDER = 1 << 10;
/** read-write In command address write-data (MOSI) phases 1: big-endian 0: litte_endian. Can be configured in CONF state. */
const WR_BYTE_ORDER = 1 << 11;
/** read-write In the write operations read-data phase is in 2-bit mode. Can be configured in CONF state. */
const FWRITE_DUAL = 1 << 12;
/** read-write In the write operations read-data phase is in 4-bit mode. Can be configured in CONF state. */
const FWRITE_QUAD = 1 << 13;
/** read-write In the write operations read-data phase is in 8-bit mode. Can be configured in CONF state. */
const FWRITE_OCT = 1 << 14;
/** read-write 1: Enable the DMA CONF phase of next seg-trans operation, which means seg-trans will continue. 0: The seg-trans will end after the current SPI seg-trans or this is not seg-trans mode. Can be configured in CONF state. */
const USR_CONF_NXT = 1 << 15;
/** read-write Set the bit to enable 3-line half duplex communication mosi and miso signals share the same pin. 1: enable 0: disable. Can be configured in CONF state. */
const SIO = 1 << 16;
/** read-write It is combined with hold bits to set the polarity of spi hold line 1: spi will be held when spi hold line is high 0: spi will be held when spi hold line is low. Can be configured in CONF state. */
const USR_HOLD_POL = 1 << 17;
/** read-write spi is hold at data out state the bit are combined with SPI_USR_HOLD_POL bit. Can be configured in CONF state. */
const USR_DOUT_HOLD = 1 << 18;
/** read-write spi is hold at data in state the bit are combined with SPI_USR_HOLD_POL bit. Can be configured in CONF state. */
const USR_DIN_HOLD = 1 << 19;
/** read-write spi is hold at dummy state the bit are combined with SPI_USR_HOLD_POL bit. Can be configured in CONF state. */
const USR_DUMMY_HOLD = 1 << 20;
/** read-write spi is hold at address state the bit are combined with SPI_USR_HOLD_POL bit. Can be configured in CONF state. */
const USR_ADDR_HOLD = 1 << 21;
/** read-write spi is hold at command state the bit are combined with SPI_USR_HOLD_POL bit. Can be configured in CONF state. */
const USR_CMD_HOLD = 1 << 22;
/** read-write spi is hold at prepare state the bit are combined with SPI_USR_HOLD_POL bit. Can be configured in CONF state. */
const USR_PREP_HOLD = 1 << 23;
/** read-write read-data phase only access to high-part of the buffer SPI_BUF8~SPI_BUF17. 1: enable 0: disable. Can be configured in CONF state. */
const USR_MISO_HIGHPART = 1 << 24;
/** read-write write-data phase only access to high-part of the buffer SPI_BUF8~SPI_BUF17. 1: enable 0: disable.  Can be configured in CONF state. */
const USR_MOSI_HIGHPART = 1 << 25;
/** read-write spi clock is disable in dummy phase when the bit is enable. Can be configured in CONF state. */
const USR_DUMMY_IDLE = 1 << 26;
/** read-write This bit enable the write-data phase of an operation. Can be configured in CONF state. */
const USR_MOSI = 1 << 27;
/** read-write This bit enable the read-data phase of an operation. Can be configured in CONF state. */
const USR_MISO = 1 << 28;
/** read-write This bit enable the dummy phase of an operation. Can be configured in CONF state. */
const USR_DUMMY = 1 << 29;
/** read-write This bit enable the address phase of an operation. Can be configured in CONF state. */
const USR_ADDR = 1 << 30;
/** read-write This bit enable the command phase of an operation. Can be configured in CONF state. */
const USR_COMMAND = 1 << 31;

// USER1 register bits
/** read-write The length in spi_clk cycles of dummy phase. The register value shall be (cycle_num-1). Can be configured in CONF state. */
const USR_DUMMY_CYCLELEN_SHIFT = 0;
const USR_DUMMY_CYCLELEN_MASK = 0xff;
/** read-write The length in bits of address phase. The register value shall be (bit_num-1). Can be configured in CONF state. */
const USR_ADDR_BITLEN_SHIFT = 27;
const USR_ADDR_BITLEN_MASK = 0x1f;

// USER 2 register bits
/** read-write The value of  command. Can be configured in CONF state. */
const USR_COMMAND_VALUE_SHIFT = 0;
const USR_COMMAND_VALUE_MASK = 0xffff;
/** read-write The length in bits of command phase. The register value shall be (bit_num-1). Can be configured in CONF state. */
const USR_COMMAND_BITLEN_SHIFT = 28;
const USR_COMMAND_BITLEN_MASK = 0xf;

// PIN register bits
const SPI_CS0_DIS_M = 1 << 0;

const SPI_TRANS_DONE = 1 << 4;
const SPI_TRANS_INTEN = 1 << 9;

const SPI_FLASH_HPM = 1 << 19;
const SPI_FLASH_RES = 1 << 20;
const SPI_FLASH_DP = 1 << 21;
const SPI_FLASH_CE = 1 << 22;
const SPI_FLASH_BE = 1 << 23;
const SPI_FLASH_SE = 1 << 24;
const SPI_FLASH_PP = 1 << 25;
const SPI_FLASH_WRSR = 1 << 26;
const SPI_FLASH_RDSR = 1 << 27;
const SPI_FLASH_RDID = 1 << 28;
const SPI_FLASH_WRDI = 1 << 29;
const SPI_FLASH_WREN = 1 << 30;
const SPI_FLASH_READ = 1 << 31;

const STATUS_BUSY = 1 << 0;
const STATUS_WREN = 1 << 1;

/** Look for register offsets in esptool_py/esptool/flasher_stub/include/soc_support.h */
export interface ISPIConfig {
  /** Whether this SPI interface is wired to the SPI Flash */
  flash: boolean;
  irq: number;
}

export class ESP8266SPI extends BasePeripheral {
  private statusReg = 0;
  private transactionBuffer: Uint8Array | null;
  private transactionActive = false;

  readonly flashId; /* Little endian byte order */

  onTransmit: (buffer: Uint8Array) => void = () => this.completeTransmit();

  constructor(esp: ESP8266, baseAddr: number, name: string, readonly config: ISPIConfig) {
    super(esp, baseAddr, name);

    const flashMB = esp.flash.length >> 20;
    this.flashId = flashIds[flashMB] ?? flashIds[4];
  }

  get clockNanos(): number {
    const clockValue = this.readRegister(SPI_CLOCK_REG);
    if (clockValue & SPI_CLK_EQU_SYSCLK) {
      return this.esp.apbNanos;
    } else {
      const clkDiv = (clockValue >> SPI_CLKDIV_PRE_SHIFT) & CLKDIV_PRE_MASK;
      const clkCnt = (clockValue >> SPI_CLKCNT_N_SHIFT) & SPI_CLKCNT_N_MASK;
      return this.esp.apbNanos * (clkDiv + 1) * (clkCnt + 1);
    }
  }

  readUint32(addr: number): number {
    const offset = addr - this.baseAddr;
    switch (offset) {
      case SPI_CMD_REG:
        return this.transactionActive ? CMD_USR : 0;
      case SPI_RD_STATUS_REG:
        return this.statusReg;
    }
    return super.readUint32(addr);
  }

  writeUint32(addr: number, value: number) {
    const offset = addr - this.baseAddr;
    switch (offset) {
      case SPI_CMD_REG:
        if (value & CMD_USR) {
          this.startTransaction();
        } else if (this.config.flash) {
          this.flashCmdWrite(value);
        }
        break;
      case SPI_SLAVE_REG:
        super.writeUint32(addr, value);
        this.updateInterrupt();
        break;
      default:
        super.writeUint32(addr, value);
    }
  }

  flashCmdWrite(cmd: number) {
    if (cmd & SPI_FLASH_WREN) {
      this.statusReg |= STATUS_WREN;
    } else if (cmd & SPI_FLASH_WRDI) {
      this.statusReg &= ~STATUS_WREN;
    } else if (cmd & SPI_FLASH_SE) {
      const addr = this.readRegister(SPI_ADDR_REG) & 0x00fff000;
      this.esp.flash.fill(0xff, addr, addr + 0x1000);
    } else if (cmd & SPI_FLASH_PP) {
      const addr = this.readRegister(SPI_ADDR_REG) & 0x00ffffff;
      const length = Math.min(this.readRegister(SPI_ADDR_REG) >>> 24, 16 * 4);
      this.esp.flash.set(this.memory.subarray(SPI_W0_REG, SPI_W0_REG + length), addr);
    } else if (cmd & SPI_FLASH_RDID) {
      this.writeRegister(SPI_W0_REG, this.flashId);
    } else if (cmd & SPI_FLASH_WREN) {
      this.statusReg |= STATUS_WREN;
    } else if (cmd & SPI_FLASH_WRDI) {
      this.statusReg &= ~STATUS_WREN;
    } else if (cmd & SPI_FLASH_RDSR) {
      // This is actually handled by RD_STATUS_REG
    } else if (cmd & SPI_FLASH_READ) {
      const addr = this.readRegister(SPI_ADDR_REG) & 0x00ffffff;
      const count = this.readRegister(SPI_ADDR_REG) >> 24;
      this.memory.set(this.esp.flash.subarray(addr, addr + count), SPI_W0_REG);
    } else if (cmd) {
      console.warn('Unknown SPI Flash command:', cmd.toString(16));
    }
  }

  startTransaction() {
    const user = this.readRegister(SPI_USER_REG);
    const user1 = this.readRegister(SPI_USER1_REG);
    const user2 = this.readRegister(SPI_USER2_REG);
    const cmdBits = (user2 >>> 28) + 1;
    const cmd = user2 & ((1 << cmdBits) - 1);
    const addrBits = 32;
    const addr = this.readRegister(SPI_ADDR_REG) >>> (32 - addrBits);
    const sendBytes = user & USR_MOSI ? (this.readRegister(SPI_MOSI_DLEN_REG) + 1) >> 3 : 0;
    const recvBytes = user & USR_MISO ? (this.readRegister(SPI_MISO_DLEN_REG) + 1) >> 3 : 0;

    if (this.config.flash) {
      this.flashCommand(cmd, addr, sendBytes, recvBytes);
    } else {
      this.transactionActive = true;
      const cmdBytes = user & USR_COMMAND ? cmdBits >> 3 : 0;
      const addrBytes = user & USR_ADDR ? addrBits >> 3 : 0;
      const dummyBytes =
        user & USR_DUMMY ? ((user1 >> USR_DUMMY_CYCLELEN_SHIFT) & USR_DUMMY_CYCLELEN_MASK) >> 3 : 0;
      const fullDuplex = !!(user & DOUTDIN);
      const dataBytes = fullDuplex ? Math.max(sendBytes, recvBytes) : sendBytes + recvBytes;
      const totalLen = cmdBytes + addrBytes + dummyBytes + dataBytes;
      const buffer = new Uint8Array(totalLen);
      let bufferIndex = 0;
      /* CMD stage */
      let value = cmd;
      for (let i = 0; i < cmdBytes; i++) {
        buffer[bufferIndex++] = value;
        value >>= 8;
      }
      /* ADDR stage */
      value = addr;
      for (let i = 0; i < addrBytes; i++) {
        buffer[bufferIndex++] = value;
        value >>= 8;
      }
      /* DUMMY stage */
      bufferIndex += dummyBytes;
      /* DATA stage */
      if (sendBytes) {
        for (let i = 0; i < sendBytes; i++) {
          buffer[bufferIndex + i] = this.memory[SPI_W0_REG + (i % 64)];
        }
      }
      const readFrom = fullDuplex ? bufferIndex : bufferIndex + sendBytes;
      this.transactionBuffer = buffer.subarray(readFrom, readFrom + recvBytes);
      this.onTransmit(buffer);
    }
  }

  completeTransmit() {
    const { transactionBuffer } = this;
    if (transactionBuffer == null) {
      return;
    }

    for (let i = 0; i < transactionBuffer.length; i++) {
      this.memory[SPI_W0_REG + (i % 64)] = transactionBuffer[i];
    }

    this.setRegisterBits(SPI_SLAVE_REG, SPI_TRANS_DONE);

    this.updateInterrupt();
    this.transactionActive = false;
    this.transactionBuffer = null;
  }

  private eraseFlash(offset: number, size: number, durationNanos: number) {
    this.esp.flash.fill(0xff, offset, offset + size);
    this.statusReg |= STATUS_BUSY;
    this.esp.clock.schedule(() => {
      this.statusReg &= ~STATUS_BUSY;
    }, durationNanos);
  }

  flashCommand(cmd: number, addr: number, sendBytes: number, recvBytes: number) {
    switch (cmd) {
      case 0x1: // WRSR - Write Status Register
        this.statusReg = (this.statusReg & 0xff01) | this.readRegister(SPI_W0_REG);
        break;

      case 0x31: // Write status high (WRSR2)
        this.statusReg = (this.statusReg & 0x00ff) | (this.readRegister(SPI_W0_REG) << 8);
        break;

      case 0x2: // Page program
        this.esp.flash.set(this.memory.subarray(SPI_W0_REG, SPI_W0_REG + sendBytes), addr);
        break;

      case 0x4: // Write disable
        this.statusReg &= ~STATUS_WREN;
        break;

      case 0x5: // Read status
        this.writeRegister(SPI_W0_REG, this.statusReg & 0xff);
        break;

      case 0x35: // Read status high (RDSR2)
        this.writeRegister(SPI_W0_REG, this.statusReg >> 8);
        break;

      case 0x6: // Write enable
        this.statusReg |= STATUS_WREN;
        break;

      case 0x20: // Sector erase (4kb)
        this.eraseFlash(addr & 0xfffff000, 0x1000, SECTOR_ERASE_TIME);
        break;

      case 0x52: // Block erase (32kb)
        this.eraseFlash(addr & 0xffff8000, 0x8000, BLOCK_ERASE_TIME);
        break;

      case 0xd8: // Block erase (64kb)
        this.eraseFlash(addr & 0xffff0000, 0x10000, BLOCK_ERASE_TIME);
        break;

      case 0x9f: // Read chip ID
        this.writeRegister(SPI_W0_REG, this.flashId);
        break;

      case 0x03: // Read sequential
      case 0x0b:
      case 0x3b:
      case 0x6b:
      case 0xbb:
      case 0xeb:
        this.memory.set(this.esp.flash.subarray(addr, addr + recvBytes), SPI_W0_REG);
        break;
    }
  }

  updateInterrupt() {
    const intBits = SPI_TRANS_DONE | SPI_TRANS_INTEN;
    const intStatus = (this.readRegister(SPI_SLAVE_REG) & intBits) === intBits;
    this.esp.interrupt(this.config.irq, intStatus);
  }

  reset() {
    super.reset();
  }
}
