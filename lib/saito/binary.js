const saito = require('./saito');
const { set } = require('numeral');


/**
 * This class provides functions for importing and exporting binary-data.
 * It is used heavily in our serialization and deserialization functions
 * and is included in this class mostly as it does not fall cleanly into
 * the crypto class.
 */
class Binary {

    constructor(app) {
        this.app = app;
    }


    /**
     * Converts from big-endian binary encoded u64(from the wire)
     * into a BigInt
     * @param {Array} bytes - array of bytes
     * @returns BigInt
     */
    hexToSizedArray(value, size) {
      let value_buffer;
      if (value.toString() !== "0") {
        value_buffer = Buffer.from(value.toString(), "hex");
      } else {
        value_buffer = Buffer.from("");
      }
      let new_buffer = Buffer.alloc(size);
      console.assert(size >= value_buffer.length, "unhandled value ranges found");
      value_buffer.copy(new_buffer, size - value_buffer.length);
      return new_buffer;
    }


    /**
     * Converts from big-endian binary encoded u64(from the wire)
     * into a BigInt
     * @param {Array} bytes - array of bytes
     * @returns BigInt
     */
    u64FromBytes(bytes) {
        let top = BigInt(this.u32FromBytes(bytes.slice(0,4)));
        let bottom = BigInt(this.u32FromBytes(bytes.slice(4,8)));
        let max_u32 = BigInt(4294967296);
        return ((top * max_u32) + bottom);
    }
    /**
     * Converts from a JS Number, treated as an integery, into
     * a big-endian binary encoded u32(for the wire)
     * @param {BigInt} bigValue - BigInt
     * @returns array of bytes
     */
    u64AsBytes(bigValue) {
        bigValue = BigInt(bigValue); // force into Big
        let max_u32 = BigInt(4294967296);
        let top = bigValue / max_u32;
        let bottom = bigValue - (max_u32 * top);
        let top_bytes = this.u32AsBytes(Number(top));
        let bottom_bytes = this.u32AsBytes(Number(bottom));
        return Buffer.concat([
            new Buffer(new Uint8Array(top_bytes)),
            new Buffer(new Uint8Array(bottom_bytes)),
        ]);
    }
    /**
     * Converts from big-endian binary encoded u64(from the wire)
     * into a JS Number(as an integer).
     * @param {array} bytes - array of 4 bytes
     * @returns number
     */
    u32FromBytes(bytes) {
        var val = 0;
        for (var i = 0; i < bytes.length; ++i) {
            val += bytes[i];
            if (i < bytes.length-1) {
                val = val << 8;
            }
        }
        return val;
    }

    /**
     * Converts from a JS Number, treated as an integer, into
     * a big-endian binary encoded u32(for the wire)
     * @param {number} val
     * @returns array of 4 bytes
     */
    u32AsBytes(val){
        var bytes = [];
        var i = 4;
        do {
            bytes[--i] = val & (255);
            val = val>>8;
        } while ( i )
        return bytes;
    }
    /**
     * Converts from a u8 byte(from the wire)
     * into a JS Number(as an integer).
     * @param {Uint8} byte
     * @returns number
     */
    u8FromByte(byte) {
        return 0 + byte;
    }

    /**
     * Converts from a JS Number into big-endian binary encoded
     * u8(for the wire)
     * @param {number} val
     * @returns byte
     */
    u8AsByte(val){
        return val & (255);
    }
}

module.exports = Binary;

