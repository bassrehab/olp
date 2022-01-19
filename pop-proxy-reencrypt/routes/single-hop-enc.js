const assert = require("assert");
const Recrypt = require("@ironcorelabs/recrypt-node-binding");

//Create a new Recrypt API instance
const Api256 = new Recrypt.Api256();

//Generate both a user key pair and a signing key pair
const userKeys = Api256.generateKeyPair();
const signingKeys = Api256.generateEd25519KeyPair();

//Generate a plaintext to encrypt
const plaintext = Api256.generatePlaintext();

//Encrypt the data to the user public key
const encryptedValue = Api256.encrypt(plaintext, userKeys.publicKey, signingKeys.privateKey);

//Generate a second public/private key pair as the target of the transform. This will allow the encrypted data to be
//transformed to this second key pair and allow it to be decrypted.
const deviceKeys = Api256.generateKeyPair();

//Generate a transform key from the user private key to the device public key
const userToDeviceTransformKey = Api256.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, signingKeys.privateKey);

//Transform the encrypted data (without decrypting it!) so that it can be decrypted with the second key pair
const transformedEncryptedValue = Api256.transform(encryptedValue, userToDeviceTransformKey, signingKeys.privateKey);

//Decrypt the data using the second private key
const decryptedValue = Api256.decrypt(transformedEncryptedValue, deviceKeys.privateKey);

assert.equal(decryptedValue, plaintext);