// Shared, original content catalog. Rules, art, and the world use the same IDs.
export const HAIRSTYLES = [
  { id: 'hat', name: 'Trail hat' }, { id: 'swoop', name: 'Side swoop' },
  { id: 'curls', name: 'Cloud curls' }, { id: 'spikes', name: 'Star spikes' }, { id: 'ponytail', name: 'Comet tail' },
];
export const HAIR_COLORS = [
  { id: 'brown', name: 'Chestnut', color: '#655044' }, { id: 'black', name: 'Midnight', color: '#303749' },
  { id: 'gold', name: 'Sunshine', color: '#dbad54' }, { id: 'violet', name: 'Cosmic violet', color: '#9c70c4' },
];
export const OUTFITS = [
  { id: 'explorer', name: 'Trail explorer' }, { id: 'mage', name: 'Star mage' },
  { id: 'armor', name: 'Dino knight' }, { id: 'space', name: 'Space ranger' },
];
export const CLOTH_COLORS = [
  { id: 'teal', name: 'Lagoon', color: '#558f87' }, { id: 'rust', name: 'Ember', color: '#bc7959' },
  { id: 'plum', name: 'Nebula', color: '#9283a5' }, { id: 'gold', name: 'Starlight', color: '#cca55e' },
  { id: 'blue', name: 'Orbit', color: '#759ab7' },
];
export const DEFAULT_LOOK = Object.freeze({ hair: 'hat', hairColor: 'brown', outfit: 'explorer', color: 'teal' });
export const WEAPONS = Object.freeze([
  { id: 'staff', name: 'Wayfinder Staff', level: 1, icon: '✦', elements: null, signatures: [], description: 'Your original staff. Explore all seven elements and keep every regular explorer spell.' },
  { id: 'flameblade', name: 'Ember Saber', level: 2, icon: '⚔', elements: ['fire', 'sun'], signatures: ['saber-comet', 'phoenix-cut'], description: 'Fire and Sun spells, plus blazing saber strikes. Strong against Leaf and Stone.' },
  { id: 'tidewand', name: 'Tidecaller Wand', level: 2, icon: '♆', elements: ['water', 'leaf'], signatures: ['tide-heart', 'coral-wave'], description: 'Water and Leaf spells, plus powerful healing and a coral wave.' },
  { id: 'stormbow', name: 'Stormstring Bow', level: 4, icon: '➶', elements: ['air', 'sun'], signatures: ['thunder-arrow', 'meteor-volley'], description: 'Air and Sun spells, plus a focused thunder arrow and a volley that hits every foe.' },
  { id: 'moonhammer', name: 'Moonstone Hammer', level: 6, icon: '◆', elements: ['stone', 'leaf'], signatures: ['lunar-aegis', 'crater-crash'], description: 'Stone and Leaf spells, plus a giant shield and a mighty hammer smash.' },
]);
export const NEW_DINOS = Object.freeze([
  { id: 'nova', name: 'Nova', species: 'Velociraptor', element: 'air', planet: 'luna', unlockHabitat: null, description: 'A quick moon raptor with comet feathers. Air magic sweeps across the enemy team.', shape: 'raptor', skin: '#859bdc', shade: '#5d6eaf', light: '#cfddff', accent: '#ffe49b' },
  { id: 'mochi', name: 'Mochi', species: 'Pachycephalosaurus', element: 'stone', planet: 'luna', unlockHabitat: 'luna', description: 'A sturdy dome-headed dinosaur. Lunar stone spells protect friends and crack armor.', shape: 'dome', skin: '#b9a5cd', shade: '#8877a7', light: '#ede1f5', accent: '#86e5dc' },
  { id: 'flare', name: 'Flare', species: 'Spinosaurus', element: 'fire', planet: 'cinder', unlockHabitat: 'cinder', description: 'A sail-backed explorer of lava rivers. Fire spells leave warming embers behind.', shape: 'sail', skin: '#e39876', shade: '#b15e61', light: '#ffdbb7', accent: '#ffd16d' },
  { id: 'aurora', name: 'Aurora', species: 'Dilophosaurus', element: 'water', planet: 'cinder', unlockHabitat: null, description: 'A twin-crested dinosaur living beside warm geysers. Water magic heals the team.', shape: 'crest', skin: '#68bbc6', shade: '#468499', light: '#b5f1df', accent: '#df96c5' },
  { id: 'fernix', name: 'Fernix', species: 'Therizinosaurus', element: 'leaf', planet: 'zephyr', unlockHabitat: null, description: 'A fluffy cloud-garden dinosaur with long gathering claws. Leaf magic restores its health.', shape: 'feather', skin: '#88c4a9', shade: '#559884', light: '#d9f0b4', accent: '#f3b7df' },
  { id: 'orbit', name: 'Orbit', species: 'Protoceratops', element: 'sun', planet: 'zephyr', unlockHabitat: 'zephyr', description: 'A small frilled dinosaur with a sunny personality. Sun spells brighten the whole battlefield.', shape: 'frill', skin: '#e1bc72', shade: '#b68a60', light: '#fff0b1', accent: '#b4a1e0' },
]);
export const PLANETS = Object.freeze([
  { id: 'bramble', name: 'Bramble', subtitle: 'Your home among the stars', color: '#8dce8c', regions: ['fern', 'river', 'crystal', 'summit'], entry: 'fern', level: 1, description: 'Four wild regions, hidden treasure, and the original dinosaur guardians.' },
  { id: 'luna', name: 'Lunara', subtitle: 'The singing moon', color: '#b9aff3', regions: ['luna'], entry: 'luna', level: 7, requires: 'fern-3', description: 'Hop between glowing craters, meet moon dinosaurs, and awaken the Crater Colossus.' },
  { id: 'cinder', name: 'Cinderis', subtitle: 'An ember-powered world', color: '#f5a472', regions: ['cinder'], entry: 'cinder', level: 11, requires: 'luna-3', description: 'Follow obsidian trails and steaming geysers to face the Furnace Regent.' },
  { id: 'zephyr', name: 'Zephyria', subtitle: 'Gardens above the clouds', color: '#97e1e4', regions: ['zephyr'], entry: 'zephyr', level: 15, requires: 'cinder-3', description: 'Explore floating gardens and challenge the winged ruler of the sky.' },
]);
export const SPACE_REGIONS = Object.freeze([
  { id: 'luna', name: 'Moonchime Craters', subtitle: 'Follow the comet lights', description: 'Silver craters and singing crystals hide two new dinosaur friends.', element: 'stone', level: 7, planetId: 'luna', bossId: 'luna-3', encounterIds: ['luna-1', 'luna-2', 'luna-3'], requires: 'fern-3', bossName: 'Crater Colossus', bossMove: 'Meteor stomp', bossPeriod: 3, bossElement: 'stone', names: ['Comet-tail crossing', 'The moonstone nest', 'Crater Colossus'], teams: [['nova'], ['mochi', 'nova'], ['mochi', 'nova']], reward: 'mochi' },
  { id: 'cinder', name: 'Emberglass Basin', subtitle: 'Across the warm obsidian', description: 'Lava-lit paths connect cooling geysers and the Furnace Regent’s arena.', element: 'fire', level: 11, planetId: 'cinder', bossId: 'cinder-3', encounterIds: ['cinder-1', 'cinder-2', 'cinder-3'], requires: 'luna-3', bossName: 'Furnace Regent', bossMove: 'Solar eruption', bossPeriod: 3, bossElement: 'fire', names: ['The geyser twins', 'Sails in the steam', 'Furnace Regent'], teams: [['aurora'], ['flare', 'aurora'], ['flare', 'aurora', 'ember']], reward: 'flare' },
  { id: 'zephyr', name: 'Cloudbloom Gardens', subtitle: 'Where the sky grows wild', description: 'Cloud gardens drift around the Tempest Crown’s ancient sky temple.', element: 'air', level: 15, planetId: 'zephyr', bossId: 'zephyr-3', encounterIds: ['zephyr-1', 'zephyr-2', 'zephyr-3'], requires: 'cinder-3', bossName: 'Tempest Crown', bossMove: 'Tempest spiral', bossPeriod: 2, bossElement: 'air', names: ['Feathers in the clouds', 'The sun-frill grove', 'Tempest Crown'], teams: [['fernix'], ['orbit', 'fernix'], ['nova', 'fernix', 'orbit']], reward: 'orbit' },
]);
