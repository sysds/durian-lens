process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://durian_user:devpassword@localhost:5432/durian_lens';

import { prisma } from '../src/utils/prisma';

const VARIETY_DATA = [
  {
    slug: 'musang-king',
    name: 'D197 Musang King',
    description: 'The undisputed King of Durians. Musang King is renowned for its intensely rich, bittersweet flavor with deep golden-yellow flesh. It has a complex taste profile with notes of custard, caramel, and a lingering bitterness that durian connoisseurs prize above all others. Small flat seeds mean an exceptionally high flesh-to-husk ratio.',
    origin: 'Kelantan and Pahang, Malaysia',
    season: 'April – August',
    price_range: 'MYR 25–80/kg',
    sort_order: 1,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '8/10', score: 8 },
      { category: 'flavor', label: 'Bitterness', value: '7/10', score: 7 },
      { category: 'texture', label: 'Creaminess', value: '9/10', score: 9 },
      { category: 'aroma', label: 'Intensity', value: '9/10', score: 9 },
      { category: 'appearance', label: 'Flesh Color', value: 'Deep golden yellow', score: null },
    ],
  },
  {
    slug: 'black-thorn',
    name: 'D200 Black Thorn',
    description: 'Black Thorn (黑刺) is considered the premium variety that rivals and sometimes surpasses Musang King. Its flesh is pale yellow with a pinkish hue, creamy and velvety in texture, with an extremely complex flavor — sweet, bitter, and deeply fragrant with a distinctly floral finish. Often commands the highest prices at Malaysian durian auctions.',
    origin: 'Penang, Malaysia',
    season: 'June – August',
    price_range: 'MYR 50–120/kg',
    sort_order: 2,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '9/10', score: 9 },
      { category: 'flavor', label: 'Bitterness', value: '6/10', score: 6 },
      { category: 'texture', label: 'Creaminess', value: '10/10', score: 10 },
      { category: 'aroma', label: 'Intensity', value: '8/10', score: 8 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale yellow with pink hue', score: null },
    ],
  },
  {
    slug: 'd24',
    name: 'D24 Sultan',
    description: 'D24 is the classic Malaysian durian and a long-time favorite. Its creamy pale yellow flesh delivers a perfectly balanced sweet-bitter profile, less intense than Musang King but consistently delicious. The affordable price and reliable quality make it the everyday choice for durian lovers across Southeast Asia.',
    origin: 'Pahang and Johor, Malaysia',
    season: 'June – September',
    price_range: 'MYR 10–25/kg',
    sort_order: 3,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7 },
      { category: 'flavor', label: 'Bitterness', value: '6/10', score: 6 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7 },
      { category: 'aroma', label: 'Intensity', value: '7/10', score: 7 },
      { category: 'appearance', label: 'Flesh Color', value: 'Creamy pale yellow', score: null },
    ],
  },
  {
    slug: 'red-prawn',
    name: 'Red Prawn',
    description: 'Red Prawn (Udang Merah) is famous for its distinctive soft orange-red flesh, gentle sweetness, and creamy, almost silky texture. A beloved Penang variety with a milder, more approachable finish than the strongest bitter cultivars. The fine-textured flesh melts on the tongue with a delicate floral aftertaste.',
    origin: 'Penang, Malaysia',
    season: 'June – August',
    price_range: 'MYR 15–35/kg',
    sort_order: 4,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '8/10', score: 8 },
      { category: 'flavor', label: 'Bitterness', value: '3/10', score: 3 },
      { category: 'texture', label: 'Creaminess', value: '8/10', score: 8 },
      { category: 'aroma', label: 'Intensity', value: '6/10', score: 6 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pinkish-orange', score: null },
    ],
  },
  {
    slug: 'tupai-king',
    name: 'Tupai King',
    description: 'Tupai King is appreciated for its thick, generous flesh, balanced sweetness, and rich, lingering aroma. Often positioned as a premium Malaysian cultivar for fresh eating, it offers a satisfying mouthfeel with moderately dense texture and a pleasant sweet-bitter interplay.',
    origin: 'Pahang, Malaysia',
    season: 'June – August',
    price_range: 'MYR 20–50/kg',
    sort_order: 5,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7 },
      { category: 'flavor', label: 'Bitterness', value: '5/10', score: 5 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7 },
      { category: 'aroma', label: 'Intensity', value: '7/10', score: 7 },
      { category: 'appearance', label: 'Flesh Color', value: 'Golden yellow', score: null },
    ],
  },
  {
    slug: 'golden-phoenix',
    name: 'Golden Phoenix',
    description: 'Golden Phoenix is smaller in size but prized for concentrated flavour, pale golden flesh, and a strong bittersweet profile. Small seeds mean more flesh per fruit. One of Singapore\'s top favourite varieties, it delivers a surprisingly intense experience for its modest size.',
    origin: 'Johor, Malaysia',
    season: 'May – August',
    price_range: 'MYR 18–40/kg',
    sort_order: 6,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '9/10', score: 9 },
      { category: 'flavor', label: 'Bitterness', value: '4/10', score: 4 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7 },
      { category: 'aroma', label: 'Intensity', value: '8/10', score: 8 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale golden', score: null },
    ],
  },
  {
    slug: 'ioi',
    name: 'IOI',
    description: 'IOI is a popular southern Malaysian variety with smooth, golden-yellow flesh, approachable sweetness, and a fragrant profile that suits both new and regular durian eaters. Slightly nutty and grassy notes add subtle complexity to its gentle, milky custard-like texture.',
    origin: 'Muar, Johor, Malaysia',
    season: 'June – September',
    price_range: 'MYR 12–28/kg',
    sort_order: 7,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '6/10', score: 6 },
      { category: 'flavor', label: 'Bitterness', value: '2/10', score: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7 },
      { category: 'aroma', label: 'Intensity', value: '5/10', score: 5 },
      { category: 'appearance', label: 'Flesh Color', value: 'Golden yellow', score: null },
    ],
  },
  {
    slug: 'hor-lor',
    name: 'Hor Lor',
    description: 'Hor Lor, also called gourd durian for its distinctive oval shape, is a Penang favourite with smooth, creamy-sweet flesh. Mild and approachable flavour profile with medium seeds, making it an excellent choice for beginners or those who prefer a gentler durian experience.',
    origin: 'Penang, Malaysia',
    season: 'June – August',
    price_range: 'MYR 10–22/kg',
    sort_order: 8,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7 },
      { category: 'flavor', label: 'Bitterness', value: '2/10', score: 2 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7 },
      { category: 'aroma', label: 'Intensity', value: '4/10', score: 4 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale cream', score: null },
    ],
  },
  {
    slug: 'dato-nina',
    name: 'Dato Nina',
    description: 'Dato Nina is known for its exceptionally creamy flesh and a rounded sweet-bitter flavour that sits comfortably in the middle of the intensity spectrum. Commonly sought by buyers who prefer a balanced durian profile without overwhelming bitterness or cloying sweetness.',
    origin: 'Pahang, Malaysia',
    season: 'June – August',
    price_range: 'MYR 20–45/kg',
    sort_order: 9,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '7/10', score: 7 },
      { category: 'flavor', label: 'Bitterness', value: '5/10', score: 5 },
      { category: 'texture', label: 'Creaminess', value: '8/10', score: 8 },
      { category: 'aroma', label: 'Intensity', value: '6/10', score: 6 },
      { category: 'appearance', label: 'Flesh Color', value: 'Pale yellow', score: null },
    ],
  },
  {
    slug: 'tekka',
    name: 'Tekka',
    description: 'Tekka has thick flesh and a bold sweet-bitter taste with a dense, creamy bite. It is often compared with premium old-tree selections. Harder to cut open due to its fibrous husk, but rewards the patient with an intense, complex taste profile and strong floral notes.',
    origin: 'Pahang and Johor, Malaysia',
    season: 'July – August',
    price_range: 'MYR 20–45/kg',
    sort_order: 10,
    characteristics: [
      { category: 'flavor', label: 'Sweetness', value: '6/10', score: 6 },
      { category: 'flavor', label: 'Bitterness', value: '8/10', score: 8 },
      { category: 'texture', label: 'Creaminess', value: '7/10', score: 7 },
      { category: 'aroma', label: 'Intensity', value: '9/10', score: 9 },
      { category: 'appearance', label: 'Flesh Color', value: 'Deep yellow', score: null },
    ],
  },
];

async function seed() {
  console.log('Seeding varieties...');

  for (const v of VARIETY_DATA) {
    const variety = await prisma.varieties.upsert({
      where: { slug: v.slug },
      update: {
        name: v.name,
        description: v.description,
        origin: v.origin,
        season: v.season,
        price_range: v.price_range,
        is_active: true,
        sort_order: v.sort_order,
      },
      create: {
        slug: v.slug,
        name: v.name,
        description: v.description,
        origin: v.origin,
        season: v.season,
        price_range: v.price_range,
        is_active: true,
        sort_order: v.sort_order,
      },
    });

    if (v.characteristics) {
      await prisma.variety_characteristics.deleteMany({ where: { variety_id: variety.id } });
      await prisma.variety_characteristics.createMany({
        data: v.characteristics.map((c, i) => ({
          variety_id: variety.id,
          category: c.category,
          label: c.label,
          value: c.value,
          score: c.score,
          sort_order: i,
        })),
      });
    }

    console.log(`  ${v.slug}`);
  }

  console.log('Done seeding first batch.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
