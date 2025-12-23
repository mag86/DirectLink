import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

function stringToUint8(str: string): Uint8Array {
  return naclUtil.decodeUTF8(str);
}

function uint8ToString(bytes: Uint8Array): string {
  return naclUtil.encodeUTF8(bytes);
}

function uint8ToBase64(bytes: Uint8Array): string {
  return naclUtil.encodeBase64(bytes);
}

function base64ToUint8(str: string): Uint8Array {
  return naclUtil.decodeBase64(str);
}

export function generateKeyPair(): KeyPair {
  return nacl.box.keyPair();
}

// Шифруем сообщение 'msg' для публичного ключа recipient
export function encryptMessage(msg: string, recipientPub: Uint8Array, senderKey: KeyPair): { box: string, nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const box = nacl.box(
    stringToUint8(msg), // сообщение
    nonce,
    recipientPub, // публичный ключ получателя
    senderKey.secretKey // приватный ключ отправителя
  );
  return {
    box: uint8ToBase64(box),
    nonce: uint8ToBase64(nonce),
  };
}

// Расшивровываем ciphertext для себя
export function decryptMessage(box64: string, nonce64: string, senderPub: Uint8Array, recipientKey: KeyPair): string | null {
  const msgBytes = nacl.box.open(
    base64ToUint8(box64),
    base64ToUint8(nonce64),
    senderPub,
    recipientKey.secretKey
  );
  return msgBytes ? uint8ToString(msgBytes) : null;
}

export function exportPubKeyBase64(key: Uint8Array): string {
  return uint8ToBase64(key);
}
export function importPubKeyBase64(key64: string): Uint8Array {
  return base64ToUint8(key64);
}

