import * as utils from "./oracle.utils";


export async function generateAirnodeAddress() {
    let mne = await utils.generateMnemonic();
    let addr = await utils.derive(mne);
    return [mne, addr] as const;
}