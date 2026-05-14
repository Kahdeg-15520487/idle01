import { Item } from '../types';

export const ITEMS: Record<string, Item> = {
  // ─── Shén Vessels ─────────────────────────────
  qi_crystal: {
    id: 'qi_crystal',
    name: 'Qi Crystal',
    type: 'shen_vessel',
    description: 'A faintly glowing crystal of condensed qi. Contains 0.5 shén.',
    value: 5,
    stackable: true,
    quantity: 1,
    shenContained: 0.5,
  },
  beast_core_low: {
    id: 'beast_core_low',
    name: 'Beast Core (Low)',
    type: 'shen_vessel',
    description: 'The core of a weak spirit beast. Contains 0.2 shén of raw primal energy.',
    value: 3,
    stackable: true,
    quantity: 1,
    shenContained: 0.2,
  },
  spirit_herb: {
    id: 'spirit_herb',
    name: 'Spirit Herb',
    type: 'herb',
    description: 'A common herb infused with ambient qi. Can be eaten raw for a small shén boost.',
    value: 2,
    stackable: true,
    quantity: 1,
    shenContained: 0.1,
  },
  spirit_herb_moondew: {
    id: 'spirit_herb_moondew',
    name: 'Moondew Bloom',
    type: 'herb',
    description: 'A pale blue flower glowing with moonlight. Valuable for healing and cultivation.',
    value: 15,
    stackable: false,
    quantity: 1,
    shenContained: 0.5,
  },

  // ─── Containers ─────────────────────────────
  storage_jade_small: {
    id: 'storage_jade_small',
    name: 'Storage Jade (Small)',
    type: 'container',
    description: 'A small jade pendant that can hold 5 shén of excess energy.',
    value: 20,
    stackable: false,
    quantity: 1,
  },

  // ─── Weapons ────────────────────────────────
  rusty_iron_sword: {
    id: 'rusty_iron_sword',
    name: 'Rusty Iron Sword',
    type: 'weapon',
    description: 'A worn sword that has seen better decades.',
    value: 5,
    stackable: false,
    quantity: 1,
    statBonus: { attack: 2 },
  },
  iron_saber: {
    id: 'iron_saber',
    name: 'Iron Saber',
    type: 'weapon',
    description: 'A serviceable blade.',
    value: 15,
    stackable: false,
    quantity: 1,
    statBonus: { attack: 4 },
  },
  shadow_fang_dagger: {
    id: 'shadow_fang_dagger',
    name: 'Shadow Fang Dagger',
    type: 'weapon',
    description: 'A dagger forged from a shadow wolf\'s fang. It drinks light.',
    value: 40,
    stackable: false,
    quantity: 1,
    statBonus: { attack: 6, speed: 2 },
  },

  // ─── Key Items ──────────────────────────────
  jade_token: {
    id: 'jade_token',
    name: 'Cloud Sect Jade Token',
    type: 'key_item',
    description: 'A jade token bearing the Cloud Soaring Sect insignia. Proof of a debt owed.',
    value: 0,
    stackable: false,
    quantity: 1,
  },
};
