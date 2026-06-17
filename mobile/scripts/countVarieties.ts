import { DURIAN_REGISTRY } from '../src/data/durianRegistry';
console.log('Total named varieties:', DURIAN_REGISTRY.length);
DURIAN_REGISTRY.forEach((v, i) => console.log(`${i + 1}. ${v.clone} ${v.commonName}`));
