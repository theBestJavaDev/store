// Seattle Solvers shop catalog. Edit prices, packs, and stock here only.
// icon: bearing | collar | shaft | screw | nut | spacer | string | wheel | kit

export const FTC_CATALOG = [
  { id: 'BRG-688',   sku: 'BRG-688',   category: 'Bearings',            name: '688ZZ flanged bearing',          desc: '8 mm bore, shielded, for 8 mm pattern plates.',         specs: ['8×16×5 mm'],      packSize: '10-pack', price: 7.99, icon: 'bearing', inStock: true },
  { id: 'BRG-686',   sku: 'BRG-686',   category: 'Bearings',            name: 'F686ZZ flanged bearing',         desc: '6 mm bore for REV-style hex adapters and idlers.',      specs: ['6×13×5 mm'],      packSize: '10-pack', price: 7.49, icon: 'bearing', inStock: true },
  { id: 'BRG-PB8',   sku: 'BRG-PB8',   category: 'Bearings',            name: '8 mm pillow block',              desc: 'Aluminum block with pressed bearing for pivots.',       specs: ['8 mm bore'],      packSize: '2-pack',  price: 5.99, icon: 'bearing', inStock: true },
  { id: 'COL-8C',    sku: 'COL-8C',    category: 'Shaft collars',       name: '8 mm clamping collar',           desc: 'Split collar with M3 clamp screw. Won’t mar shafts.',   specs: ['8 mm round bore'],packSize: '4-pack',  price: 5.49, icon: 'collar',  inStock: true },
  { id: 'COL-8D',    sku: 'COL-8D',    category: 'Shaft collars',       name: '8 mm D-bore clamping collar',    desc: 'Keyed to D-shaft so it can’t slip under torque.',       specs: ['8 mm D-bore'],    packSize: '4-pack',  price: 5.99, icon: 'collar',  inStock: true },
  { id: 'COL-6S',    sku: 'COL-6S',    category: 'Shaft collars',       name: '6 mm set-screw collar',          desc: 'Light-duty spacing on 6 mm shafts.',                    specs: ['6 mm bore'],      packSize: '6-pack',  price: 3.99, icon: 'collar',  inStock: true },
  { id: 'SHF-8D200', sku: 'SHF-8D200', category: 'Shafting',            name: '8 mm stainless D-shaft, 200 mm', desc: '303 stainless, chamfered ends.',                        specs: ['200 mm'],         packSize: '1 pc',    price: 3.49, icon: 'shaft',   inStock: true },
  { id: 'SHF-8D400', sku: 'SHF-8D400', category: 'Shafting',            name: '8 mm stainless D-shaft, 400 mm', desc: 'Long stock for intakes and cut-to-length jobs.',        specs: ['400 mm'],         packSize: '1 pc',    price: 5.49, icon: 'shaft',   inStock: true },
  { id: 'SHF-6D150', sku: 'SHF-6D150', category: 'Shafting',            name: '6 mm stainless D-shaft, 150 mm', desc: 'For 6 mm bearings and small mechanisms.',               specs: ['150 mm'],         packSize: '1 pc',    price: 2.49, icon: 'shaft',   inStock: true },
  { id: 'FST-M4x8',  sku: 'FST-M4x8',  category: 'Fasteners & spacers', name: 'M4 × 8 socket head screw',       desc: 'Black-oxide alloy steel. The one you’ll use most.',     specs: ['M4 × 8'],         packSize: '100-pack',price: 4.99, icon: 'screw',   inStock: true },
  { id: 'FST-M4x16', sku: 'FST-M4x16', category: 'Fasteners & spacers', name: 'M4 × 16 socket head screw',      desc: 'Through plate-and-channel stacks.',                     specs: ['M4 × 16'],        packSize: '100-pack',price: 5.99, icon: 'screw',   inStock: true },
  { id: 'FST-M4N',   sku: 'FST-M4N',   category: 'Fasteners & spacers', name: 'M4 nylon-insert lock nut',       desc: 'Holds through vibration all season.',                   specs: ['M4'],             packSize: '100-pack',price: 3.99, icon: 'nut',     inStock: true },
  { id: 'FST-M4W',   sku: 'FST-M4W',   category: 'Fasteners & spacers', name: 'M4 flat washer',                 desc: 'Spreads load on polycarbonate and SRPP.',               specs: ['M4'],             packSize: '100-pack',price: 2.49, icon: 'nut',     inStock: true },
  { id: 'SPC-8AS',   sku: 'SPC-8AS',   category: 'Fasteners & spacers', name: '8 mm spacer assortment',         desc: 'Aluminum spacers in 1, 2, 4, 8, and 16 mm lengths.',    specs: ['8 mm ID'],        packSize: '40 pcs',  price: 6.99, icon: 'spacer',  inStock: true },
  { id: 'MOT-DYN',   sku: 'MOT-DYN',   category: 'Motion & intakes',    name: 'Dyneema slide string',           desc: 'Low-stretch line for linear slide rigging.',            specs: ['2 mm'],           packSize: '10 m',    price: 6.49, icon: 'string',  inStock: true },
  { id: 'MOT-TUB',   sku: 'MOT-TUB',   category: 'Motion & intakes',    name: 'Surgical tubing',                desc: 'Grippy intake roller and flap material.',               specs: ['1/4 in OD'],      packSize: '3 m',     price: 5.99, icon: 'string',  inStock: true },
  { id: 'MOT-CW2',   sku: 'MOT-CW2',   category: 'Motion & intakes',    name: '2 in compliant wheel',           desc: 'Soft intake wheel, 8 mm hex hub insert included.',      specs: ['2 in'],           packSize: '4-pack',  price: 9.99, icon: 'wheel',   inStock: true },
];

export const FTC_RESCUE_KIT = {
  id: 'KIT-001', sku: 'KIT-001', category: 'Kits', name: 'League night rescue kit',
  desc: 'Pit spares in a labeled organizer case.', specs: ['Organizer case'],
  packSize: 'Kit', price: 29.99, icon: 'kit', inStock: true,
};

// Plate materials. Match the live plate page: aluminum, SRPP, wood.
export const PLATE_MATERIALS = [
  { id: 'al2',  name: 'Aluminum 2 mm', detail: '6061-T6, 0.080 in',            ratePerSqIn: 0.25, label: '2 mm 6061-T6 aluminum' },
  { id: 'al3',  name: 'Aluminum 3 mm', detail: '6061-T6, 1/8 in',              ratePerSqIn: 0.32, label: '3 mm 6061-T6 aluminum' },
  { id: 'srpp', name: 'SRPP 3 mm',     detail: 'Self-reinforced polypropylene', ratePerSqIn: 0.16, label: '3 mm self-reinforced polypropylene' },
  { id: 'wood', name: 'Wood 6 mm',     detail: 'Birch ply, for prototypes',     ratePerSqIn: 0.08, label: '6 mm birch plywood' },
];

export const SHOP_CONFIG = {
  freeShipThreshold: 40,
  flatShipping: 3.99,
  plateSetupFee: 3.5,
  plateSetupWaiveOver: 35,   // compared after pair discount
  platePairDiscount: 0.15,
  plateMaxInches: 18,
  plateMaxQty: 50,
  orderEmail: 'business@seattlesolvers.com',
  storageKey: 'ss-shop-cart-v2',
};
