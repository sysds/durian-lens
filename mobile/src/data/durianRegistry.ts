export type DurianRegistryItem = {
  no: number;
  clone: string;
  commonName?: string;
  registerDate?: string;
  origin?: string;
  slug: string;
  displayName: string;
  isFeatured: boolean;
  isPopular: boolean;
};

const RAW_REGISTRY = `
1	D1	0	00.00.34	0	Hulu Langat, Selangor
2	D2	Dato' Nina	00.00.34	Dato' Nina	Melaka
3	D3	0	00.00.39	0	0
4	D4	Repok B2	27.07.34	0	Batu Kurau, Perak
5	D6	0	00.00.36	0	0
6	D7	0	00.00.34	0	Kajang, Selangor
7	D8	0	27.07.34	0	Kuala Lumpur
8	D10	Durian Hijau	0	0	Kajang, Selangor
9	D16	0	00.00.36	0	0
10	D24	Bukit Merah/Sultan	30.11.37	0	Empangan Bukit Merah, Perak
11	D29	0	27.07.38	0	Kuala Kangsar, Perak
12	D30	Ho Kuen No. 1	05.01.39	0	Bentong, Pahang
13	D33	Sakai No. 1	10.01.39	0	Bentong, Pahang
14	D38	Hj. Abu	11.08.39	Sidak Ishak	Kuala Pilah, Negeri Sembilan
15	D53	0	27.05.40	0	Balik Pulau, Pulau Pinang
16	D63	0	19.06.40	Kum Kuah	Mukim Relau, Pulau Pinang
17	D66	Durian Raja	0	0	Sungkai, Perak
18	D84	0	07.12.48	Che Wahab	Perak Selatan, Perak
19	D88	Bangkok 8	30.08.50	Jabatan Pertanian	Serdang, Selangor
20	D90	0	10.12.51	Mat Arop Kumat	Jasin, Melaka
21	D92	Branceng	21.07.52	Cheong Teik Kee	Bengan Germal, Pulau Pinang
22	D96	Bangkok A	12.02.55	Jabatan Pertanian	Serdang, Selangor
23	D97	Foo	17.06.70	0	Pulau Pinang
24	D98	Katoi	17.06.70	0	Thailand
25	D99	Kop Kecil	17.06.70	0	Thailand
26	D100	Khaw	17.06.70	0	0
27	D101	Bangkok T16	17.06.70	Jabatan Pertanian	Serdang, Selangor
28	D102	Bangkok T17	17.06.70	Jabatan Pertanian	Serdang, Selangor
29	D103	Bangkok T28	17.06.70	Jabatan Pertanian	Serdang, Selangor
30	D104	Taiping 2	17.06.70	A. Hamid Awang	Taiping, Perak
31	D105	Durian Gajah/Taiping 3	17.06.70	Awang Hj. Yaakob	Taiping, Perak
32	D106	Taiping 5	17.06.70	Yunos	Taiping, Perak
33	D107	Durian Ular Kekek	17.06.70	Hjh. Saadiah	Batu Kurau, Perak
34	D108	Nasi Kunyit	17.06.70	Hjh. Saadiah	Batu Kurau, Perak
35	D109	Seberang Manong 4	17.06.70	Yeop Abd Rahman Anjang Osman	Kuala Kangsar, Perak
36	D110	Seberang Manong 5	17.06.70	Yeop Abd Rahman Anjang Osman	Kuala Kangsar, Perak
37	D111	Emas Enggang	17.06.70	Ming Fong	Kuala Kangsar, Perak
38	D112	Emas Perak	17.06.70	Ming Fong	Kuala Kangsar, Perak
39	D113	Raja Patani	17.06.70	Ming Fong	Kuala Kangsar, Perak
40	D114	Kampan	17.06.70	Ming Fong	Kuala Kangsar, Perak
41	D115	Mas Pahang I	17.06.70	Ming Fong	Kuala Kangsar, Perak
42	D116	Durian Batu	17.06.70	Lee Lam Siew	Kuala Kangsar, Perak
43	D117	Durian Gombak	05.01.71	0	Gombak, Selangor
44	D118	Durian Tembaga	17.06.70	Lee Lam Siew	Kuala Kangsar, Perak
45	D119	Durian Ganjil	05.01.71	0	Perak
46	D120	KK5/Manong	17.07.71	Mohd Nasib, Kulob Talib	Kuala Kangsar, Perak
47	D121	Emas Pahang II	17.07.71	Shamsudin Hj. Yob	Kuala Kangsar, Perak
48	D122	RimD1	24.07.71	Pertab Singh	Sungai Buloh, Selangor
49	D123	Chanee	14.07.71	Pertab Singh	Sungai Buloh, Selangor
50	D124	RimD5	14.02.73	Pertab Singh	Sik, Kedah
51	D125	Kop Jantung	14.02.73	Jabatan Pertanian	Sik, Kedah
52	D126	Kop T24	14.02.73	Jabatan Pertanian	Sik, Kedah
53	D127	Kop T25	14.02.73	Jabatan Pertanian	Sik, Kedah
54	D128	Pakta T66	14.02.73	Jabatan Pertanian	Sik, Kedah
55	D129	Chanee T41	14.02.73	Jabatan Pertanian	Sik, Kedah
56	D130	Kan Yau T63	14.02.73	Jabatan Pertanian	Sik, Kedah
57	D131	Kamtoi T9	14.02.73	Jabatan Pertanian	Sik, Kedah
58	D132	Eddie Special	28.03.73	Pertab Singh	Sungai Buloh, Selangor
59	D133	Durian Rambutan	05.04.73	Zainal Abidin Shaaban	Taiping, Perak
60	D134	0	05.05.73	Cheah Eng Hin	Slim Village, Perak
61	D135	Foo Fatt	05.05.73	Cheah Eng Hin	Slim Village, Perak
62	D136	Senggarang 1	05.05.73	Lian Chin Peng	Senggarang, Johor
63	D137	Senggarang 2	05.05.73	Lian Chin Peng	Senggarang, Johor
64	D138	Senggarang 3	05.05.73	Lian Chin Peng	Senggarang, Johor
65	D139	Senggarang 4	05.05.73	Lian Chin Peng	Senggarang, Johor
66	D140	DX/Rogue 24	01.06.81	Jabatan Pertanian	Serdang, Selangor
67	D141	Kacukan D101 x D2	01.06.81	Jabatan Pertanian	Serdang, Selangor
68	D142	Kacukan D66 x D2	01.06.81	Jabatan Pertanian	Serdang, Selangor
69	D143	Kacukan D2 x D7	01.06.81	Jabatan Pertanian	Serdang, Selangor
70	D144	Kacukan D24 x D2	01.06.81	Jabatan Pertanian	Serdang, Selangor
71	D145	Tuan Mek Hijau/Beserah	30.10.81	YM Che Engku Khaidzir Bin Che Engku Ali	Beserah, Pahang
72	D146	Lempur Emas	02.04.85	0	Kuala Kangsar, Perak
73	D147	Paya Lintah Kuning	02.04.85	0	Kuala Kangsar, Perak
74	D148	Paduka	02.04.85	0	Kampung Gajah, Perak
75	D150	Emping Emas	02.04.85	0	Batu Kurau, Perak
76	D151	Kancong Darat	14.07.86	0	Banting, Selangor
77	D152	Katak	14.07.86	0	Jitra, Kedah
78	D153	Kuala Kangsar 2	08.12.86	0	Kuala Kangsar, Perak
79	D155	Sri Kaya	30.09.87	0	Kuala Kangsar, Perak
80	D156	Kampung Perak	30.09.87	0	Batu Kurau, Perak
81	D157	Seberang	30.09.87	0	Gopeng, Perak
82	D158	Kan Yau/Tangkai Panjang	30.06.87	Hj. Omar Hj. Bin	Guar Cempedak, Kedah
83	D159	Mon Thong/Bantal Mas	30.06.87	Hj. Ahmad Yaakob	Kota Sarang Semut, Kedah
84	D160	Buluh Bawah/Tekka/Musang Queen	30.06.87	Lim Hai Chua	Banting, Selangor
85	D161	Merah	30.06.87	Lim Hai Chua	Banting, Selangor
86	D162	Tawa	30.06.87	Lim Hai Chua	Banting, Selangor
87	D163	Hlor/Labu	30.06.87	Chan Fatt Hin	Balik Pulau, Pulau Pinang
88	D164	Ang Bak/Isi Merah	30.06.87	Teoh Eng Eng	Balik Pulau, Pulau Pinang
89	D165	Cheh Chee	30.06.87	Lee Toh Sem	Balik Pulau, Pulau Pinang
90	D166	Balik Pulau 604	30.06.87	Lee Toh Sem	Balik Pulau, Pulau Pinang
91	D167	Buaya	30.06.87	Yap	Kuala Langat, Selangor
92	D168	Durian Mas Muar/Hjh. Hasmah/IOI	24.05.89	Hjh. Hasmah, Hj. Hashim	Muar, Johor
93	D169	Tok Li Tok	00.05.89	Wee Chong Beng	Tanah Merah, Kelantan
94	D170	Kepala Babi	05.06.89	0	Biawak, Sarawak
95	D171	Durian Sungai Sut	05.06.89	0	Kapit, Sarawak
96	D172	Durian Botak	17.06.89	0	Tangkak, Johor
97	D173	Durian Siew	21.07.89	0	Mantin, Negeri Sembilan
98	D174	Durian Hj. Sani	08.01.90	Hj. Sani Mohd Jail	Semenyih, Selangor
99	D175	Udang Merah	04.06.90	Ahmad Sayuti Bin Mohd Yusof	Pulau Pinang
100	D176	Durian Kuning	04.06.90	Abdullah Husin Rani	Maran, Pahang
101	D177	Juara 90 Penang	04.06.90	Lee Tek Hin	Balik Pulau, Pulau Pinang
102	D178	Penang 88	04.06.90	Teh Han Seng	Balik Pulau, Pulau Pinang
103	D179	Penang 99	04.06.90	Teh Han Seng	Balik Pulau, Pulau Pinang
104	D180	Penang Bintang	03.08.90	Lee Tek Hin	Balik Pulau, Pulau Pinang
105	D181	Ghani	04.09.90	Semaian Jamaludin	Guar Cempedak, Kedah
106	D182	Duri Panjang/Asmy Yuh	04.10.90	Jabatan Pertanian	Serdang, Selangor
107	D183	Kop Besar	09.07.91	Hj. Ahmad	Kota Sarang Semut, Kedah
108	D184	Titi Kerawang	08.06.91	Chengg Fatt Hin	Balik Pulau, Pulau Pinang
109	D185	Pikat	05.08.91	Alias Salleh	Kijal, Terengganu
110	D186	Nasi Kunyit Terengganu	05.08.91	Hj. Abd. Razak Abu Bakar	Kijal, Terengganu
111	D187	Saddam	18.08.91	Hj. Hassan M. Noah	Segamat, Johor
112	D188	M.DUR 78	30.08.91	MARDI	Jeranggau, Terengganu
113	D189	M.DUR 79	30.08.91	MARDI	Jeranggau, Terengganu
114	D190	M.DUR 88	01.07.92	MARDI	Jerenggau, Terengganu
115	D191	PK. 110	02.07.92	Jabatan Pertanian	Serdang, Selangor
116	D192	PK. 285	03.08.92	Jabatan Pertanian	Serdang, Selangor
117	D193	Jurong 3	07.09.92	Yaakob Baru	Slim River, Perak
118	D194	Gabai	14.06.93	Lee Chong Kooh	Sepang, Selangor
119	D195	Raja Hutan	26.06.93	Lee You Fong	Semenyih, Selangor
120	D196	Simpang Permata	26.07.93	Md. Nor Ibrahim	Alor Gajah, Melaka
121	D197	Raja Kunyit/Musang King	09.12.93	Wee Chong Beng	Tanah Merah, Kelantan
122	D198	Kim Hong/Golden Phoenix	00.03.13	Tan Seu Seng	Batu Pahat, Johor
123	D199	Bola 828	00.03.13	Tan Eng Kong	Batu Pahat, Johor
124	D200	Ochee/Duri Hitam	00.00.16	Dato' Leow Cheok Kiang	Seberang Perai Selatan, Pulau Pinang
125	D201	Kim Luang	0	0	0
126	D202	Apian	01.08.16	Lee Kwee Thye	Segamat, Johor
127	D203	Kappai	01.08.16	Shiu Sin Fook	Segamat, Johor
128	D204	Bintang	20.03.17	En. Ng Chor Hong	Simpang Renggam, Johor
129	D205	Durian Lipur	21.07.18	Tan Kok Cheng	Batu Pahat, Johor
130	D206	Tok Merah	18.03.19	Sharuddin Bin Hussein	Segamat, Johor
131	D207	Jantung	18.03.19	Hashim Bin Jaffar	Segamat, Johor
132	D208	Kang Hai	18.03.19	Samsari bin Ahmad	Segamat, Johor
133	D209	Tepi Sungai	30.04.20	Gooi Leong Kian	Mentakab, Pahang
134	D210	Pak Awang V22	30.04.20	Pejabat Pertanian Jajahan Kuala Krai	Kuala Krai, Kelantan
135	D211	Kuala Paya Merah P089	30.04.20	Lim Thiam Kiong	Segamat, Johor
136	D212	S17	28.01.21	Siau Sew Kim	Bekok, Johor
137	D213	TUNGKU 3	28.01.21	Mohamad Ibrahim bin Mat Zin	Segamat, Johor
138	D214	TUPAI 226/Tupai King	28.01.21	Chew Chee Wan	Sungai Ara, Pulau Pinang
139	D215	WM	28.01.21	Wong Cheong Keng	Jempol, Negeri Sembilan
140	D219	Mata Merah	01.05.21	Chew Teck Hua	Balik Pulau, Pulau Pinang
`;

const FEATURED_CLONES = ['D197', 'D24', 'D200'];
const POPULAR_CLONES = new Set(['D197', 'D24', 'D200', 'D175', 'D168', 'D160', 'D2', 'D158', 'D198', 'D214']);
const NAME_OVERRIDES: Record<string, string> = {
  D197: 'Musang King',
  D24: 'Sultan',
  D200: 'Black Thorn',
};
const SLUG_OVERRIDES: Record<string, string> = {
  D2: 'dato-nina',
  D13: 'd13',
  D24: 'd24',
  D88: 'd88',
  D99: 'd99',
  D101: 'd101',
  D145: 'd145-beserah',
  D158: 'd158-kan-yao',
  D160: 'd160',
  D163: 'hor-lor',
  D168: 'ioi',
  D175: 'red-prawn',
  D197: 'musang-king',
  D198: 'd198-kim-hong',
  D200: 'black-thorn',
  D214: 'tupai-king',
};

function clean(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed !== '0' ? trimmed : undefined;
}

function cloneNumber(clone: string) {
  return Number(clone.replace(/\D/g, '')) || 0;
}

function dateScore(date?: string) {
  if (!date) return 0;
  const parts = date.split('.').map((part) => Number(part) || 0);
  const [day = 0, month = 0, rawYear = 0] = parts;
  const year = rawYear > 99 ? rawYear : rawYear >= 30 ? 1900 + rawYear : 2000 + rawYear;
  return year * 10000 + month * 100 + day;
}

export const DURIAN_REGISTRY: DurianRegistryItem[] = RAW_REGISTRY.trim()
  .split('\n')
  .map((line) => {
    const [no, clone, rawName, rawDate, _owner, rawOrigin] = line.split('\t');
    const commonName = NAME_OVERRIDES[clone] || clean(rawName);
    const registerDate = clean(rawDate);
    const origin = clean(rawOrigin);
    return {
      no: Number(no),
      clone,
      commonName,
      registerDate,
      origin,
      slug: SLUG_OVERRIDES[clone] || clone.toLowerCase(),
      displayName: commonName ? `${clone} - ${commonName}` : clone,
      isFeatured: FEATURED_CLONES.includes(clone),
      isPopular: POPULAR_CLONES.has(clone),
    };
  })
  .filter((item) => item.commonName);

export function findDurianRegistryItem(slug: string) {
  return DURIAN_REGISTRY.find((item) => item.slug === slug || item.clone.toLowerCase() === slug);
}

export function sortDurianRegistry(items: DurianRegistryItem[], mode: 'all' | 'popular' | 'newest' | 'clone') {
  const sorted = [...items].sort((a, b) => {
    if (mode === 'newest') return dateScore(b.registerDate) - dateScore(a.registerDate);
    if (mode === 'popular') return Number(b.isPopular) - Number(a.isPopular) || cloneNumber(a.clone) - cloneNumber(b.clone);
    return cloneNumber(a.clone) - cloneNumber(b.clone);
  });

  if (mode !== 'all') return sorted;

  // Pin featured clones at the top only in 'All' mode
  const featured = DURIAN_REGISTRY.filter((item) => FEATURED_CLONES.includes(item.clone));
  const pool = sorted.filter((item) => !FEATURED_CLONES.includes(item.clone));
  const visibleFeatured = featured.filter((item) => items.some((current) => current.clone === item.clone));
  return [...visibleFeatured, ...pool];
}
