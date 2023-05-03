const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';   // Obtener key de AWS KMS
const iv = new Buffer.from('F5502320F8429037');

const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
    return encrypted.toString('hex')
};

const decrypt = (encryptedData) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(encryptedData, 'hex')), decipher.final()]);

    return decrpyted.toString();
};

module.exports = {
    encrypt,
    decrypt
};

/*
salt="92AE31A79FEEB2A3"
key="770A8A65DA156D24EE2A093277530142"
iv="F5502320F8429037B8DAEF761B189D12"
*/ 