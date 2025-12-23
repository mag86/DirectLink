// Используем browser-сборку simple-peer, чтобы не тянуть node-стримы в браузер/Electron-рендерер
// см. https://github.com/feross/simple-peer#in-the-browser
// eslint-disable-next-line import/default
import Peer from 'simple-peer/simplepeer.min.js';
import type { SignalData } from 'simple-peer';

export type PeerInstance = Peer.Instance;
export type Signal = SignalData;

/**
 * Создает new Peer для WebRTC соединения
 * @param initiator true для инициатора, иначе false
 * @param onSignal callback для signal (offer/answer)
 * @param onConnect callback, когда соединение установлено
 * @param onData callback при получении данных
 */
export function createPeer(
  initiator: boolean,
  onSignal: (signal: Signal) => void,
  onConnect: () => void,
  onData: (data: string) => void
): PeerInstance {
  const peer = new Peer({
    initiator,
    trickle: false, // проще обмен, один сигнал (no ICE candidates individually)
  });

  peer.on('signal', data => onSignal(data));
  peer.on('connect', () => onConnect());
  peer.on('data', data => onData(typeof data === 'string' ? data : String(data)));

  peer.on('error', err => {
    // eslint-disable-next-line no-console
    console.error('Peer error:', err);
  });

  return peer;
}

