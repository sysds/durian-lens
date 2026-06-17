import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Characteristic {
  category: string;
  label: string;
  value: string;
  score?: number;
  sortOrder: number;
}

interface Variety {
  slug: string;
  name: string;
  scientificName: string;
  description: string;
  origin: string;
  season: string;
  priceRange: string;
  sortOrder: number;
  characteristics: Characteristic[];
}

const varieties: Variety[] = [
  {
    slug: 'musang-king',
    name: 'D197 Musang King',
    scientificName: 'Durio zibethinus cv. D197 Musang King',
    description:
      'The undisputed King of Durians. Musang King is renowned for its intensely rich, bittersweet flavor with deep golden-yellow flesh. It has a complex taste profile with notes of custard, caramel, and a lingering bitterness that durian connoisseurs prize above all others. Small flat seeds mean an exceptionally high flesh-to-husk ratio.',
    origin: 'Kelantan and Pahang, Malaysia',
    season: 'April – August',
    priceRange: 'MYR 25–80/kg',
    sortOrder: 1,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '8/10', score: 8, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '7/10', score: 7, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '9/10', score: 9, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '9/10', score: 9, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Deep golden yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'black-thorn',
    name: 'D200 Black Thorn',
    scientificName: 'Durio zibethinus cv. D200 Black Thorn',
    description:
      'Black Thorn (黑刺) is considered the premium variety that rivals and sometimes surpasses Musang King. Its flesh is pale yellow with a pinkish hue, creamy and velvety in texture, with an extremely complex flavor — sweet, bitter, and deeply fragrant with a distinctly floral finish. Often commands the highest prices at Malaysian durian auctions.',
    origin: 'Penang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 50–120/kg',
    sortOrder: 2,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '9/10', score: 9, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '6/10', score: 6, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '10/10', score: 10, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '8/10', score: 8, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale yellow with pink hue', sortOrder: 5 },
    ],
  },
  {
    slug: 'd24',
    name: 'D24 Sultan',
    scientificName: 'Durio zibethinus cv. D24 Sultan',
    description:
      'D24 is the classic Malaysian durian and a long-time favorite. Its creamy pale yellow flesh delivers a perfectly balanced sweet-bitter profile, less intense than Musang King but consistently delicious. The affordable price and reliable quality make it the everyday choice for durian lovers across Southeast Asia.',
    origin: 'Pahang and Johor, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 10–25/kg',
    sortOrder: 3,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '6/10', score: 6, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '7/10', score: 7, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Creamy pale yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'red-prawn',
    name: 'Red Prawn',
    scientificName: 'Durio zibethinus cv. Udang Merah',
    description:
      'Red Prawn (Udang Merah) is famous for its distinctive soft orange-red flesh, gentle sweetness, and creamy, almost silky texture. A beloved Penang variety with a milder, more approachable finish than the strongest bitter cultivars. The fine-textured flesh melts on the tongue with a delicate floral aftertaste.',
    origin: 'Penang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 15–35/kg',
    sortOrder: 4,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '8/10', score: 8, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '3/10', score: 3, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '8/10', score: 8, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '6/10', score: 6, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pinkish-orange', sortOrder: 5 },
    ],
  },
  {
    slug: 'tupai-king',
    name: 'Tupai King',
    scientificName: 'Durio zibethinus cv. Tupai King',
    description:
      'Tupai King is appreciated for its thick, generous flesh, balanced sweetness, and rich, lingering aroma. Often positioned as a premium Malaysian cultivar for fresh eating, it offers a satisfying mouthfeel with moderately dense texture and a pleasant sweet-bitter interplay.',
    origin: 'Pahang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 20–50/kg',
    sortOrder: 5,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '5/10', score: 5, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '7/10', score: 7, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Golden yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'ioi',
    name: 'IOI',
    scientificName: 'Durio zibethinus cv. IOI',
    description:
      'IOI is a popular southern Malaysian variety with smooth, golden-yellow flesh, approachable sweetness, and a fragrant profile that suits both new and regular durian eaters. Slightly nutty and grassy notes add subtle complexity to its gentle, milky custard-like texture.',
    origin: 'Muar, Johor, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 12–28/kg',
    sortOrder: 6,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '6/10', score: 6, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '2/10', score: 2, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '5/10', score: 5, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Golden yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'dato-nina',
    name: 'Dato Nina',
    scientificName: 'Durio zibethinus cv. Dato Nina',
    description:
      'Dato Nina is known for its exceptionally creamy flesh and a rounded sweet-bitter flavour that sits comfortably in the middle of the intensity spectrum. Commonly sought by buyers who prefer a balanced durian profile without overwhelming bitterness or cloying sweetness.',
    origin: 'Pahang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 20–45/kg',
    sortOrder: 7,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '5/10', score: 5, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '8/10', score: 8, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '6/10', score: 6, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'xo',
    name: 'XO',
    scientificName: 'Durio zibethinus cv. XO',
    description:
      'XO is recognised for its fermented, slightly alcoholic aroma reminiscent of aged spirits, and its pronounced bitterness that builds with each bite. A favourite among durian fans who enjoy stronger, more assertive flavours. The pale, watery-looking flesh belies its intense character.',
    origin: 'Johor and Pahang, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 15–35/kg',
    sortOrder: 8,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '5/10', score: 5, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '8/10', score: 8, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '6/10', score: 6, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '9/10', score: 9, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'tekka',
    name: 'Tekka',
    scientificName: 'Durio zibethinus cv. Tekka',
    description:
      'Tekka has thick flesh and a bold sweet-bitter taste with a dense, creamy bite. It is often compared with premium old-tree selections. Harder to cut open due to its fibrous husk, but rewards the patient with an intense, complex taste profile and strong floral notes.',
    origin: 'Pahang and Johor, Malaysia',
    season: 'July – August',
    priceRange: 'MYR 20–45/kg',
    sortOrder: 9,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '6/10', score: 6, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '8/10', score: 8, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '9/10', score: 9, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Deep yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'hor-lor',
    name: 'Hor Lor',
    scientificName: 'Durio zibethinus cv. Hor Lor',
    description:
      'Hor Lor, also called gourd durian for its distinctive oval shape, is a Penang favourite with smooth, creamy-sweet flesh. Mild and approachable flavour profile with medium seeds, making it an excellent choice for beginners or those who prefer a gentler durian experience.',
    origin: 'Penang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 10–22/kg',
    sortOrder: 10,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '2/10', score: 2, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '4/10', score: 4, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale cream', sortOrder: 5 },
    ],
  },
  {
    slug: 'golden-phoenix',
    name: 'Golden Phoenix',
    scientificName: 'Durio zibethinus cv. Golden Phoenix',
    description:
      'Golden Phoenix is smaller in size but prized for concentrated flavour, pale golden flesh, and a strong bittersweet profile. Small seeds mean more flesh per fruit. One of Singapore\'s top favourite varieties, it delivers a surprisingly intense experience for its modest size.',
    origin: 'Johor, Malaysia',
    season: 'May – August',
    priceRange: 'MYR 18–40/kg',
    sortOrder: 11,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '9/10', score: 9, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '4/10', score: 4, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '8/10', score: 8, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale golden', sortOrder: 5 },
    ],
  },
  {
    slug: 'green-skin',
    name: 'Green Skin',
    scientificName: 'Durio zibethinus cv. Green Skin',
    description:
      'Green Skin is valued for its fragrant, pale yellow flesh and balanced sweetness with minimal bitterness. It is commonly associated with northern Malaysian durian farms and offers a clean, refreshing flavour that appeals to a wide range of palates.',
    origin: 'Penang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 15–30/kg',
    sortOrder: 12,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '3/10', score: 3, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '6/10', score: 6, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '6/10', score: 6, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'd101',
    name: 'D101',
    scientificName: 'Durio zibethinus cv. D101',
    description:
      'D101 offers attractive orange-yellow flesh, medium sweetness, and a pleasant creamy texture. It is popular as a dependable mid-range variety that delivers consistent quality without the premium price tag of the top-tier cultivars.',
    origin: 'Pahang and Johor, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 12–28/kg',
    sortOrder: 13,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '6/10', score: 6, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '4/10', score: 4, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '6/10', score: 6, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '5/10', score: 5, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Orange-yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'd13',
    name: 'D13',
    scientificName: 'Durio zibethinus cv. D13',
    description:
      'D13 is known for its deep orange flesh and a sweeter, lighter flavour with very little bitterness. It is often recommended for people who prefer less bitter durians or are trying the fruit for the first time. The smooth, custardy texture makes it highly approachable.',
    origin: 'Johor, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 10–25/kg',
    sortOrder: 14,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '8/10', score: 8, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '2/10', score: 2, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '5/10', score: 5, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Deep orange', sortOrder: 5 },
    ],
  },
  {
    slug: 'd88',
    name: 'D88',
    scientificName: 'Durio zibethinus cv. D88',
    description:
      'D88 has thick yellow flesh with a rich aroma and moderate bitterness. It is a familiar Malaysian market variety that offers good value for money, with a robust flavour profile that satisfies regular durian eaters looking for a dependable choice.',
    origin: 'Pahang, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 12–30/kg',
    sortOrder: 15,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '6/10', score: 6, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '6/10', score: 6, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '7/10', score: 7, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Bright yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'd99',
    name: 'D99',
    scientificName: 'Durio zibethinus cv. D99',
    description:
      'D99 is an older registered cultivar with a strong fragrance and classic sweet-bitter taste profile. It remains popular in traditional markets for its reliability and well-rounded flavour that captures the essence of classic Malaysian durian.',
    origin: 'Pahang and Johor, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 12–28/kg',
    sortOrder: 16,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '6/10', score: 6, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '6/10', score: 6, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '7/10', score: 7, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'd145-beserah',
    name: 'D145 Beserah',
    scientificName: 'Durio zibethinus cv. D145 Beserah',
    description:
      'D145 Beserah is linked with Pahang orchards and is appreciated for aromatic flesh and a traditional kampung durian character. It offers a nostalgic flavour profile that reminds many Malaysians of durians from their childhood.',
    origin: 'Pahang, Malaysia',
    season: 'July – September',
    priceRange: 'MYR 12–28/kg',
    sortOrder: 17,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '6/10', score: 6, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '5/10', score: 5, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '6/10', score: 6, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '7/10', score: 7, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Creamy yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'd158-kan-yao',
    name: 'D158 Kan Yao',
    scientificName: 'Durio zibethinus cv. D158 Kan Yao',
    description:
      'D158 Kan Yao is known for its long-stem shape and a refined flavour profile with creamy, pale yellow flesh. The name translates to "long stem," referencing its distinctive physical appearance. It offers a balanced, elegant eating experience.',
    origin: 'Pahang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 18–40/kg',
    sortOrder: 18,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '5/10', score: 5, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '6/10', score: 6, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'd160',
    name: 'D160',
    scientificName: 'Durio zibethinus cv. D160',
    description:
      'D160 is a Malaysian registered cultivar often associated with rich flesh and balanced sweetness. It has gained a loyal following for its consistent quality and pleasant, medium-intensity flavour that works well for everyday enjoyment.',
    origin: 'Johor, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 15–32/kg',
    sortOrder: 19,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '4/10', score: 4, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '6/10', score: 6, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Golden yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'd168',
    name: 'D168',
    scientificName: 'Durio zibethinus cv. D168',
    description:
      'D168 is commonly associated with the IOI family of durians, offering creamy flesh and an accessible sweet profile. It provides a smooth, mellow eating experience that makes it a popular choice for casual durian sessions with family and friends.',
    origin: 'Johor, Malaysia',
    season: 'June – September',
    priceRange: 'MYR 12–28/kg',
    sortOrder: 20,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '6/10', score: 6, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '3/10', score: 3, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '5/10', score: 5, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'd175',
    name: 'D175',
    scientificName: 'Durio zibethinus cv. D175',
    description:
      'D175 is commonly associated with Red Prawn selections and is loved for its orange-tinged flesh and gentle sweetness. It carries the same silky-smooth texture that makes the Red Prawn family so beloved among Penang durian enthusiasts.',
    origin: 'Penang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 18–40/kg',
    sortOrder: 21,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '3/10', score: 3, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '8/10', score: 8, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '6/10', score: 6, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Orange-tinged', sortOrder: 5 },
    ],
  },
  {
    slug: 'd198-kim-hong',
    name: 'D198 Kim Hong',
    scientificName: 'Durio zibethinus cv. D198 Kim Hong',
    description:
      'D198 Kim Hong is a premium cultivar with rich flesh and strong aroma, often discussed alongside modern high-value durians. It offers a luxurious eating experience with complex layers of sweetness and a memorable aftertaste.',
    origin: 'Pahang, Malaysia',
    season: 'June – August',
    priceRange: 'MYR 25–55/kg',
    sortOrder: 22,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '8/10', score: 8, sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: '6/10', score: 6, sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: '8/10', score: 8, sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: '8/10', score: 8, sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Bright yellow', sortOrder: 5 },
    ],
  },
  {
    slug: 'kampung',
    name: 'Kampung Durian',
    scientificName: 'Durio zibethinus',
    description:
      'Kampung durians are the wild, village-grown treasures of Malaysia. Flavour, aroma, and texture vary widely by orchard and tree, giving a truly traditional Malaysian durian experience with diverse profiles that can range from mild and sweet to intensely bitter and complex.',
    origin: 'Throughout Malaysia',
    season: 'June – September',
    priceRange: 'MYR 8–20/kg',
    sortOrder: 23,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: 'Variable', sortOrder: 1 },
      { category: 'flavor', label: 'Bitterness', value: 'Variable', sortOrder: 2 },
      { category: 'texture', label: 'Creaminess', value: 'Variable', sortOrder: 3 },
      { category: 'aroma', label: 'Intensity', value: 'Variable', sortOrder: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Variable', sortOrder: 5 },
    ],
  },
];

async function main() {
  for (const v of varieties) {
    const { characteristics, ...data } = v;
    const dbData = {
      slug: data.slug,
      name: data.name,
      scientific_name: data.scientificName,
      description: data.description,
      origin: data.origin,
      season: data.season,
      price_range: data.priceRange,
      sort_order: data.sortOrder,
    };

    const variety = await prisma.varieties.upsert({
      where: { slug: data.slug },
      update: dbData,
      create: dbData,
    });

    // Sync characteristics: delete existing and recreate to ensure consistency
    await prisma.variety_characteristics.deleteMany({ where: { variety_id: variety.id } });
    await prisma.variety_characteristics.createMany({
      data: characteristics.map((c) => ({
        variety_id: variety.id,
        category: c.category,
        label: c.label,
        value: c.value,
        score: c.score ?? null,
        sort_order: c.sortOrder,
      })),
    });

    console.log(`  ${data.slug}`);
  }

  console.log(`Seeded ${varieties.length} durian varieties.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
