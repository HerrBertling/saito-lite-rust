'use strict';
const saito = require('./saito');

const SlipType = {
  Normal: 0,
  ATR: 1,
  VipInput: 2,
  VipOutput: 3,
  MinerInput: 4,
  MinerOutput: 5,
  RouterInput: 6,
  RouterOutput: 7,
  StakerOutput: 8,
  StakerDeposit: 9,
  StakerWithdrawalPending: 10,
  StakerWithdrawalStaking: 11,
  Other: 12,
};

class Slip {

  // amount can be a string in NOLAN or a BigInt
  constructor(publickey = "", amount = "0", type = SlipType.Normal, uuid = "", slip_ordinal = 0, payout = 0, lc = 1) {

    //
    // consensus variables
    //
    this.add = publickey;
    this.amt = BigInt(amount);
    this.type = type;
    this.uuid = uuid;
    this.sid = slip_ordinal;

    //
    // non-consensus variables
    //
    this.lc = lc;			// longest-chain
    this.timestamp = 0;			// timestamp
    this.payout = BigInt(payout);	// calculated for staking slips
    this.key = "";			// index in utxoset hashmap

  }

  returnAmount() { return this.amt; }


  //
  // slip comparison is used when inserting slips (staking slips) into the
  // staking tables, as the order of the stakers table needs to be identical
  // regardless of the order in which components are added, lest we get
  // disagreement.
  //
  // 1 = self is bigger
  // 2 = other is bigger
  // 3 = same
  //
  compare(other_slip) {

    let x = BigInt('0x'+this.returnPublicKey());
    let y = BigInt('0x'+other_slip.returnPublicKey());

    if (x > y) { return 1; }
    if (y > x) { return 2; }

    //
    // use the part of the utxoset key that does not include the
    // publickey but includes the amount and slip ordinal, so that
    // testing is happy that manually created slips are somewhat
    // unique for staker-table insertion..
    //
    let a = BigInt(this.returnKey().substring(42, 74));
    let b = BigInt(other_slip.returnKey().substring(42, 74));

    if (a > b) { return 1; }
    if (b > a) { return 2; }

    return 3;

  }

  clone() {
    return new saito.slip(this.add, this.amt.toString(), this.type, this.uuid, this.sid, this.payout, this.lc);
  }

  deserialize(app, buffer) {
    this.add = app.crypto.toBase58(Buffer.from(buffer.slice(0, 33)).toString("hex"));
    this.uuid = Buffer.from(buffer.slice(33, 65)).toString("hex");
    this.amt = app.binary.u64FromBytes(buffer.slice(65, 73)).toString();
    this.sid = app.binary.u8FromByte(buffer[73]);
    this.type = app.binary.u32FromBytes(buffer.slice(74, 78));

    // convert to BigInts
    this.amt = BigInt(this.amt);

  }


  isNonZeroAmount() {
    if (this.amt == BigInt(0)) { return 0; }
    return 1;
  }

  onChainReorganization(app, lc, slip_value) {
    if (this.isNonZeroAmount()) {
      app.utxoset.update(self.returnKey(), slip_value);
    }
  }

  asReadableString() {
    return `         ${this.sid} | ${this.add} | ${this.amt.toString()}`;
  }

  returnAmount() {
    return this.amt;
  }

  returnKey() {
    return this.add + this.uuid + this.amt.toString() + this.sid;
  }

  returnPublicKey() {
    return this.add;
  }

  returnPayout() {
    return this.payout;
  }

  /**
   * Serialize Slip
   * @param {Slip} slip
   * @returns {Uint8Array} raw bytes
   */
  serialize(app, uuid="") {

    if (uuid === "") { uuid = this.uuid; }
    if (uuid === "") { uuid = "0"; }

    let publickey = app.binary.hexToSizedArray(app.crypto.fromBase58(this.add).toString('hex'), 33);
    let uuidx = app.binary.hexToSizedArray(uuid, 32);
     
    let amount = app.binary.u64AsBytes(this.amt.toString());
    let slip_ordinal = app.binary.u8AsByte(this.sid);
    let slip_type = app.binary.u32AsBytes(this.type);

    return new Uint8Array([
        ...publickey,
        ...uuidx,
        ...amount,
        slip_ordinal,
        ...slip_type,
    ]);
  }

  serializeInputForSignature(app) {
    return this.serialize(app, this.uuid);
  }

  serializeOutputForSignature(app) {
    return this.serialize(app, "0");
//(new Array(32).fill(0).toString()));
  }

  setPayout(payout) {
    this.payout = payout;
  }

  validate(app) {
    if (this.amt > 0) {
      if (app.utxoset.isSpendable(this.returnKey())) {
	return true;
      } else {
	return false;
      }
    } else {
      return true;
    }
  }

}

Slip.SlipType = SlipType;

module.exports = Slip;
