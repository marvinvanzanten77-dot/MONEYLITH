type CryptoWithUUID = Crypto & { randomUUID?: () => string };

export function randomId(): string {
  const safeCrypto = typeof crypto !== "undefined" ? (crypto as CryptoWithUUID) : undefined;
  if (safeCrypto?.randomUUID) {
    return safeCrypto.randomUUID();
  }

  return `acc-${Date.now().toString(16)}-${Math.floor(Math.random() * 1e6).toString(16)}`;
}
