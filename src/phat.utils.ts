export class TxQueue {
  private nonceTracker: any;
  private api: any;
  constructor(api: any) {
    this.nonceTracker = {};
    this.api = api;
  }
  async nextNonce(address: string) {
    const byCache = this.nonceTracker[address] || 0;
    const byRpc = (
      await this.api.rpc.system.accountNextIndex(address)
    ).toNumber();
    return Math.max(byCache, byRpc);
  }
  markNonceFailed(address: string, nonce: number) {
    if (!this.nonceTracker[address]) {
      return;
    }
    if (nonce < this.nonceTracker[address]) {
      this.nonceTracker[address] = nonce;
    }
  }
  async submit(txBuilder: any, signer: any, waitForFinalization = false) {
    const address = signer.address;
    const nonce = await this.nextNonce(address);
    this.nonceTracker[address] = nonce + 1;
    let hash;
    return new Promise(async (resolve, reject) => {
      const unsub = await txBuilder.signAndSend(signer, { nonce }, (result) => {
        if (result.status.isInBlock) {
          for (const e of result.events) {
            const {
              event: { data, method, section },
            } = e;
            if (section === 'system' && method === 'ExtrinsicFailed') {
              unsub();
              reject(data[0].toHuman());
            }
          }
          if (!waitForFinalization) {
            unsub();
            resolve({
              hash: result.status.asInBlock,
              events: result.events,
            });
          } else {
            hash = result.status.asInBlock;
          }
        } else if (result.status.isFinalized) {
          resolve({
            hash,
            events: result.events,
          });
        } else if (result.status.isInvalid) {
          unsub();
          this.markNonceFailed(address, nonce);
          reject('Invalid transaction');
        }
      });
    });
  }
}

export async function sleep(t: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}

export async function checkUntil(async_fn: Function, timeout: number) {
  const t0 = new Date().getTime();
  while (true) {
    if (await async_fn()) {
      return;
    }
    const t = new Date().getTime();
    if (t - t0 >= timeout) {
      throw new Error('timeout');
    }
    await sleep(100);
  }
}

export async function checkUntilEq(
  async_fn: Function,
  expected,
  timeout: number,
  verbose = true,
) {
  const t0 = new Date().getTime();
  let lastActual = undefined;
  while (true) {
    const actual = await async_fn();
    if (actual == expected) {
      return;
    }
    if (actual != lastActual && verbose) {
      console.log(`Waiting... (current = ${actual}, expected = ${expected})`);
      lastActual = actual;
    }
    const t = new Date().getTime();
    if (t - t0 >= timeout) {
      throw new Error('timeout');
    }
    await sleep(100);
  }
}

export async function blockBarrier(
  api: any,
  prpc: any,
  finalized = false,
  timeout = 4 * 6000,
) {
  const head = await (finalized
    ? api.rpc.chain.getFinalizedHead()
    : api.rpc.chain.getHeader());
  let chainHeight = head.number.toNumber();
  await checkUntil(
    async () => (await prpc.getInfo({})).blocknum > chainHeight,
    timeout,
  );
}

export function hex(b: any) {
  if (typeof b !== 'string') {
    b = Buffer.from(b).toString('hex');
  }
  if (!b.startsWith('0x')) {
    return `0x${b}`;
  }
  return b;
}
