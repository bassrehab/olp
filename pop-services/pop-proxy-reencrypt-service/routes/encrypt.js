const assert = require("assert");
const Recrypt = require("@ironcorelabs/recrypt-node-binding");

//Create a new Recrypt API instance
const Api256 = new Recrypt.Api256();

//Generate both a user key pair and a signing key pair
const keys = Api256.generateKeyPair();
const signingKeys = Api256.generateEd25519KeyPair();

//Generate a plaintext to encrypt
const plaintext = Api256.generatePlaintext();

//Encrypt the data to the public key and then attempt to decrypt with the private key
const encryptedValue = Api256.encrypt(plaintext, keys.publicKey, signingKeys.privateKey);
const decryptedValue = Api256.decrypt(encryptedValue, keys.privateKey);

assert.equal(decryptedValue, plaintext);