const saito = require('./saito');
const fs = require("fs-extra");
const blake3 = require("blake3");

test("write_read_empty_block_to_file", async () => {
    let mockApp = {};
    let networkApi = new saito.networkApi(mockApp);
    let crypto = new saito.crypto(mockApp);
    let binary = new saito.binary(mockApp);
    mockApp.networkApi = networkApi;
    mockApp.crypto = crypto;
    mockApp.binary = binary;
    mockApp.hash = (data) => {
        return blake3.hash(data).toString('hex');
    };

    let block = new saito.block(mockApp);
    block.generateMetadata();

    let buffer = block.serialize();

    let block2 = new saito.block(mockApp);
    block2.deserialize(buffer);
    block2.generateMetadata();

    expect(block2).toBeTruthy();
    expect(block2.block.id).toEqual(block.block.id);
    expect(block2.hash).toEqual(block.hash);
    expect(block2.prehash).toEqual(block.prehash);
});

test("write_read_block_with_data_to_file", async () => {
    let mockApp = {};
    let networkApi = new saito.networkApi(mockApp);
    let crypto = new saito.crypto(mockApp);
    let binary = new saito.binary(mockApp);
    let wallet = new saito.wallet(mockApp);
    mockApp.networkApi = networkApi;
    mockApp.crypto = crypto;
    mockApp.binary = binary;
    mockApp.wallet = wallet;
    wallet.wallet.privatekey = "854702489d49c7fb2334005b903580c7a48fe81121ff16ee6d1a528ad32f235d";
    wallet.wallet.publickey = "02af1a4714cfc7ae33d3f6e860c23191ddea07bcb1bfa6c85bc124151ad8d4ce74";

    mockApp.hash = (data) => {
        return blake3.hash(data).toString('hex');
    };

    let block = new saito.block(mockApp);
    block.block.id = 10;
    block.block.timestamp = 1637034582666;
    block.block.previous_block_hash = "bcf6cceb74717f98c3f7239459bb36fdcd8f350eedbfccfbebf7c0b0161fcd8b";
    block.block.merkle = "ccf6cceb74717f98c3f7239459bb36fdcd8f350eedbfccfbebf7c0b0161fcd8b";
    block.block.creator = crypto.toBase58("dcf6cceb74717f98c3f7239459bb36fdcd8f350eedbfccfbebf7c0b0161fcd8bcc");
    block.block.burnfee = BigInt(50000000);
    block.block.difficulty = 0;
    block.block.treasury = BigInt(0);
    block.block.staking_treasury = BigInt(0);
    block.block.signature = "c9a6c2d0bf884be6933878577171a3c8094c2bf6e0bc1b4ec3535a4a55224d186d4d891e254736cae6c0d2002c8dfc0ddfc7fcdbe4bc583f96fa5b273b9d63f4";

    let tx = new saito.transaction();
    tx.transaction.ts = "1637034582666";
    tx.transaction.type = saito.transaction.TransactionType.ATR;
    tx.transaction.sig = "c9a6c2d0bf884be6933878577171a3c8094c2bf6e0bc1b4ec3535a4a55224d186d4d891e254736cae6c0d2002c8dfc0ddfc7fcdbe4bc583f96fa5b273b9d63f4";
    block.transactions.push(tx);

    block.generateMetadata();

    let buffer = block.serialize();

    let block2 = new saito.block(mockApp);
    block2.deserialize(buffer);
    block2.generateMetadata();

    expect(block2).toBeTruthy();
    expect(block2.block.id).toEqual(block.block.id);
    expect(block2.block.timestamp).toEqual(block.block.timestamp);
    expect(block2.block.previous_block_hash).toEqual(block.block.previous_block_hash);
    expect(block2.block.merkle).toEqual(block.block.merkle);
    expect(block2.block.creator).toEqual(block.block.creator);
    expect(block2.block.burnfee).toEqual(block.block.burnfee);
    expect(block2.block.difficulty).toEqual(block.block.difficulty);
    expect(block2.block.treasury).toEqual(block.block.treasury);
    expect(block2.block.staking_treasury).toEqual(block.block.staking_treasury);
    expect(block2.block.signature).toEqual(block.block.signature);
    expect(block2.block.burnfee).toEqual(block.block.burnfee);
    expect(block2.hash).toEqual(block.hash);
    expect(block2.prehash).toEqual(block.prehash);

    expect(block2.transactions.length).toEqual(block.transactions.length);

    let tx2 = block2.transactions[0];
    expect(tx2.transaction.ts).toEqual(tx.transaction.ts);
    expect(tx2.transaction.type).toEqual(tx.transaction.type);
    expect(tx2.transaction.sig).toEqual(tx.transaction.sig);
});

describe('serializeForSignature', function () {
    test("empty block", () => {
        let mockApp = {};
        let networkApi = new saito.networkApi(mockApp);
        let crypto = new saito.crypto(mockApp);
        let binary = new saito.binary(mockApp);
        mockApp.networkApi = networkApi;
        mockApp.crypto = crypto;
        mockApp.binary = binary;
        mockApp.hash = (data) => {
            return blake3.hash(data).toString('hex');
        };

        let block = new saito.block(mockApp);

        let buffer = block.serializeForSignature();
        expect(buffer).toEqual(Uint8Array.from(Buffer.alloc(145)));
    });

    test("block with data", () => {
        let mockApp = {};
        let networkApi = new saito.networkApi(mockApp);
        let crypto = new saito.crypto(mockApp);
        let binary = new saito.binary(mockApp);
        mockApp.networkApi = networkApi;
        mockApp.crypto = crypto;
        mockApp.binary = binary;
        mockApp.hash = (data) => {
            return blake3.hash(data).toString('hex');
        };

        let block = new saito.block(mockApp);
        block.block.id = 10;
        block.block.timestamp = 1637034582666;
        block.block.previous_block_hash = "bcf6cceb74717f98c3f7239459bb36fdcd8f350eedbfccfbebf7c0b0161fcd8b";
        block.block.merkle = "ccf6cceb74717f98c3f7239459bb36fdcd8f350eedbfccfbebf7c0b0161fcd8b";
        block.block.creator = crypto.toBase58("dcf6cceb74717f98c3f7239459bb36fdcd8f350eedbfccfbebf7c0b0161fcd8bcc");
        block.block.burnfee = 50000000;
        block.block.difficulty = 0;
        block.block.treasury = BigInt(0);
        block.block.staking_treasury = BigInt(0);
        block.block.signature = "c9a6c2d0bf884be6933878577171a3c8094c2bf6e0bc1b4ec3535a4a55224d186d4d891e254736cae6c0d2002c8dfc0ddfc7fcdbe4bc583f96fa5b273b9d63f4";

        let buffer = block.serializeForSignature();

	// TODO -- check with block creator as base58
        //expect(buffer).toEqual(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 1, 125, 38, 221, 98, 138, 188, 246, 204, 235, 116, 113, 127, 152, 195, 247, 35, 148, 89, 187, 54, 253, 205, 143, 53, 14, 237, 191, 204, 251, 235, 247, 192, 176, 22, 31, 205, 139, 220, 246, 204, 235, 116, 113, 127, 152, 195, 247, 35, 148, 89, 187, 54, 253, 205, 143, 53, 14, 237, 191, 204, 251, 235, 247, 192, 176, 22, 31, 205, 139, 204, 204, 246, 204, 235, 116, 113, 127, 152, 195, 247, 35, 148, 89, 187, 54, 253, 205, 143, 53, 14, 237, 191, 204, 251, 235, 247, 192, 176, 22, 31, 205, 139, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 250, 240, 128, 0, 0, 0, 0, 0, 0, 0, 0]));

        //block.sign("dcf6cceb74717f98c3f7239459bb36fdcd8f350eedbfccfbebf7c0b0161fcd8bcc","854702489d49c7fb2334005b903580c7a48fe81121ff16ee6d1a528ad32f235d");
        //expect(block.block.signature.toUpperCase()).toEqual( "EB4C09C0A335F50329198CE74295DAE88242A25B0CF6BC3A292A45C0FA51A1575E916C73C8BAF2CCDD649A4B23A227E0744CFCD01B206E50C78B8D867DF6069B");
    });
});
