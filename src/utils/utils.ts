import { ethers } from 'ethers';
import { SIGN_MESSAGE } from 'src/config/message';

export function verifyMessage(
  userAddress: string,
  nonce: string,
  sign: string,
) {
  try {
    const address = ethers.utils.verifyMessage(
      decodeTemplate(SIGN_MESSAGE, { address: userAddress, nonce }),
      sign,
    );
    return userAddress === address;
  } catch (error) {
    return false;
  }
}

export function decodeTemplate(template: string, data: object) {
  const vars = template.match(/\{.*\}/g);
  for (const vari of vars) {
    const name = vari.replace(/\{(.*)\}/, '$1');
    template = template.replace(vari, data[name] || '');
  }
  return template;
}
