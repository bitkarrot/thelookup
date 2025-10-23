export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NostrUser {
  pubkey: string;
  signer: {
    signEvent: (event: Partial<NostrEvent>) => Promise<NostrEvent>;
    nip44?: {
      encrypt: (pubkey: string, content: string) => Promise<string>;
      decrypt: (pubkey: string, content: string) => Promise<string>;
    };
  };
}