const Network = require('../network');

class HandshakeNode {
    ip_address = [];
    public_key = [];
    sig = [];

    constructor(ip_address, public_key, sig = "") {
        this.ip_address = ip_address;
        this.public_key = public_key;
        this.sig = sig;
    }
}

class HandshakeChallengeMessage {
    challenger_node = {};
    opponent_node = {};
    timestamp = BigInt(0);
    app = {};

    constructor(challenger_ip_address, challenger_public_key, opponent_ip_address, opponent_public_key, app) {
        this.challenger_node = new HandshakeNode(challenger_ip_address, challenger_public_key);
        this.opponent_node = new HandshakeNode(opponent_ip_address, opponent_public_key);
        this.timestamp = Date.now();
        this.app = app;
    }

    static deserialize(bytes, app) {
        let challenger_octet = bytes.slice(0, 4);
        let opponent_octet = bytes.slice(4, 8);

        let challenger_pubkey = bytes.slice(8, 41);
        let opponent_pubkey = bytes.slice(41, 74);
        let timestamp = app.binary.u64FromBytes(bytes.slice(74, Network.ChallengeSize));

        let handshake_challenge = new HandshakeChallengeMessage(challenger_octet, challenger_pubkey, opponent_pubkey, opponent_octet);
        handshake_challenge.timestamp = timestamp;

        if (bytes.length > Network.ChallengeSize) {
            handshake_challenge.challenger_node.sig = bytes.slice(Network.ChallengeSize, Network.ChallengeSize + 64);
        }
        if (bytes.length > Network.ChallengeSize) {
            handshake_challenge.opponent_node.sig = bytes.slice(Network.ChallengeSize + 64, Network.ChallengeSize + 128);
        }

        return handshake_challenge;
    }

    serialize() {
        return Buffer.concat([this.challenger_node.ip_address, this.opponent_node.ip_address,
            this.challenger_node.public_key, this.opponent_node.public_key, this.app.binary.u64AsBytes(this.timestamp)]);
    }

    serializeWithSig(privateKey) {
        return this.app.crypto.signBuffer(this.serialize(), privateKey);
    }
}

module.exports = HandshakeChallengeMessage;
