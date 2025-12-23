import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { createPeer, PeerInstance, Signal } from '../p2p/simplePeer';
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  exportPubKeyBase64,
  importPubKeyBase64,
  KeyPair
} from '../p2p/crypto';

export const Chat = () => {
  // P2P и crypto state
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [signalText, setSignalText] = useState('');
  const [remoteSignal, setRemoteSignal] = useState('');
  const [initiator, setInitiator] = useState(true);
  const [remotePubKeyB64, setRemotePubKeyB64] = useState('');
  const [showQR, setShowQR] = useState(false);
  
  // Генерируем ключи при монтировании
  const keyPair = useRef<KeyPair>(generateKeyPair());
  const peerRef = useRef<PeerInstance | null>(null);

  // Старт нового peer соединения
  const startPeer = () => {
    if (peerRef.current) peerRef.current.destroy();
    setMessages([]);
    setConnected(false);
    setSignalText('');
    peerRef.current = createPeer(
      initiator,
      (signal) => setSignalText(JSON.stringify({
        signal,
        pubkey: exportPubKeyBase64(keyPair.current.publicKey),
      })),
      () => setConnected(true),
      (data) => {
        try {
          const { box, nonce, pubkey } = JSON.parse(data as string);
          const senderPubKey = importPubKeyBase64(pubkey);
          const decrypted = decryptMessage(box, nonce, senderPubKey, keyPair.current);
          setMessages(prev => [...prev, `[Remote] ${decrypted || '[decrypt error]'}`]);
        } catch {
          setMessages(prev => [...prev, '[Remote/RAW] ' + data]);
        }
      }
    );
  };

  // Подключить сигнал второго участника
  const connectSignal = () => {
    try {
      let raw = remoteSignal.trim();

      // Если пользователь вставил JSON как строку в кавычках — распакуем дважды
      if (raw.startsWith('"') && raw.endsWith('"')) {
        raw = JSON.parse(raw);
      }

      const { signal, pubkey } = JSON.parse(raw);
      setRemotePubKeyB64(pubkey);
      peerRef.current?.signal(signal);
    } catch (e) {
      console.error('Signal parse error', e);
      alert('Ошибка парсинга сигнала. Убедитесь, что скопирован весь JSON без лишних кавычек и символов.');
    }
  };

  // Отправить (ЗАШИФРОВАННОЕ) сообщение
  const handleSend = () => {
    if (!connected || input.trim() === '' || !remotePubKeyB64) return;
    const enc = encryptMessage(input, importPubKeyBase64(remotePubKeyB64), keyPair.current);
    peerRef.current?.send(
      JSON.stringify({
        ...enc,
        pubkey: exportPubKeyBase64(keyPair.current.publicKey)
      })
    );
    setMessages(prev => [...prev, '[Me] ' + input]);
    setInput('');
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label>
          <input
            type="checkbox"
            checked={initiator}
            onChange={() => setInitiator(i => !i)}
          />
          Я инициатор соединения
        </label>
        <button style={{ marginLeft: 8 }} onClick={startPeer}>
          Старт
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <b>Ваш public key (E2EE):</b>
        <div style={{ fontSize: '0.97em', wordBreak: 'break-all', background: '#f1f3f4', padding: 4 }}>{exportPubKeyBase64(keyPair.current.publicKey)}</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div>
          <div>Ваш SIGNAL:</div>
          <textarea
            readOnly
            value={signalText}
            style={{ width: 230, height: 100 }}
          />
          <button onClick={() => setShowQR(q => !q)} style={{ marginTop: 6 }}>
            {showQR ? 'Скрыть QR' : 'Показать QR'}
          </button>
          {showQR && signalText && (
            <div style={{ marginTop: 8, padding: 8, background: '#fff', border: '1px solid #e9ecef', borderRadius: 6 }}>
              <QRCode value={signalText} size={150} />
            </div>
          )}
        </div>
        <div>
          <div>Вставьте remote SIGNAL:</div>
          <textarea
            value={remoteSignal}
            onChange={e => setRemoteSignal(e.target.value)}
            style={{ width: 230, height: 100 }}
          />
          <button onClick={connectSignal} style={{ marginTop: 5 }}>Подключить</button>
        </div>
      </div>

      <div style={{ minHeight: 200, marginBottom: 16, border: '1px solid #ccc', padding: 8, borderRadius: 6, background: '#fafaff' }}>
        {messages.length === 0 && <div style={{ color: '#adb5bd' }}>Нет сообщений</div>}
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 8 }}>{msg}</div>
        ))}
      </div>

      <div>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ width: '70%', padding: 8 }}
          placeholder={connected ? "Введите сообщение..." : "Нет соединения"}
          disabled={!connected}
        />
        <button onClick={handleSend} style={{ padding: 8, marginLeft: 8 }} disabled={!connected}>
          Отправить
        </button>
      </div>
    </div>
  );
};
