/** Fallback corpus when the Worker API is unavailable (CORS, keys, network). */

const stubArticle = ({
  lede,
  background = 'This story sits at the intersection of research, policy, and public debate. Understanding the full context requires tracing how the issue evolved over the past decade.',
  perspectives = 'Supporters argue the trend represents necessary progress, while sceptics warn of unintended consequences. Researchers, industry leaders, and civil-society groups each bring distinct priorities to the table.',
  evidence = 'Peer-reviewed studies and institutional reports cite measurable shifts in the underlying data, though experts disagree on how to interpret the strongest claims.',
  counterpoint = 'The most forceful challenge to the prevailing narrative holds that headline conclusions overstate what the available evidence can support.',
  implications = 'Whatever path policymakers choose, the decision will shape investment, regulation, and everyday life for years to come.',
  conclusion = 'The debate is far from settled, but the next year of reporting and research will clarify which forecasts deserve the most attention.',
}) => ({
  lede,
  background,
  perspectives,
  evidence,
  counterpoint,
  implications,
  conclusion,
})

export const MOCK_DISCUSSIONS = [
  {
    id: 'mock-1',
    source: 'polaris',
    subreddit: 'r/technology',
    category: 'Technology',
    title: 'Should AI be regulated like nuclear technology?',
    url: 'https://example.com/mock-1',
    score: 12400,
    num_comments: 342,
    thumbnail: null,
    imageUrl: 'https://picsum.photos/seed/nexusai/960/520',
    createdUtc: Math.floor(Date.now() / 1000) - 3600 * 3,
    stanceDistribution: { for: 42, against: 38, neutral: 20 },
    civility: 81,
    article: stubArticle({
      lede:
        'Governments on three continents are weighing whether frontier artificial-intelligence systems should face licensing regimes comparable to those governing nuclear material. The proposal, once dismissed as alarmist, has moved into mainstream policy discussions as model capabilities accelerate.',
      background:
        'Dual-use technology controls have existed since the Cold War, but software has historically escaped the strictest export and inspection frameworks. Recent voluntary commitments from leading labs have not satisfied lawmakers who want enforceable oversight.',
      perspectives:
        'Safety researchers and some national-security officials favour binding thresholds for training runs above a defined compute scale. Open-source advocates and many startup founders warn that heavy licensing would concentrate power among a handful of incumbents.',
      evidence:
        'The UK AI Safety Institute and similar bodies have published evaluation benchmarks, while industry groups cite deployment incident rates that remain low relative to other infrastructure domains.',
      counterpoint:
        'Critics note that code copies instantly across borders, making inspection metaphors from physical goods a poor fit for software supply chains that evolve weekly.',
    }),
    bothSides: {
      for: [
        'Frontier models concentrate risk; licensing mirrors other dual-use domains.',
        'International inspection norms could adapt faster than bespoke AI treaties.',
      ],
      against: [
        'Software diffuses unlike fissile material; export control metaphors break down.',
        'Heavy-handed rules risk freezing safety research inside a few gatekeepers.',
      ],
      common_ground: 'Both sides want catastrophic misuse prevented—the fight is over mechanisms, not goals.',
      stance_distribution: { for: 42, against: 38, neutral: 20 },
    },
    sources: [
      { type: 'reddit', title: 'Community thread (mock)', url: '#', domain: 'reddit.com' },
      { type: 'news', title: 'Regulators eye AI benchmarks', url: '#', domain: 'news.example' },
    ],
    redditComments: [],
    tweets: [],
  },
  {
    id: 'mock-2',
    source: 'polaris',
    subreddit: 'r/science',
    category: 'Science',
    title: 'Is remote work destroying cities?',
    url: 'https://example.com/mock-2',
    score: 8200,
    num_comments: 218,
    thumbnail: null,
    imageUrl: 'https://picsum.photos/seed/nexuscity/960/520',
    createdUtc: Math.floor(Date.now() / 1000) - 3600 * 8,
    stanceDistribution: { for: 55, against: 30, neutral: 15 },
    civility: 74,
    article: stubArticle({
      lede:
        'Urban economists are revisiting long-held assumptions about agglomeration as hybrid work persists into a fifth year. Downtown vacancy rates and transit ridership remain below pre-2020 peaks in many North American and European cities.',
      perspectives:
        'Urban planners highlight equity gains for caregivers and disabled workers, while municipal finance officers stress falling commercial tax receipts and underused public transport networks.',
    }),
    bothSides: {
      for: [
        'Flexible work expands access for caregivers and reduces emissions from commuting.',
        'Hybrid patterns can preserve downtown vitality while easing housing pressure.',
      ],
      against: [
        'Transit and municipal budgets depend on weekday office concentration.',
        'Apprenticeship and mentorship suffer when serendipity disappears.',
      ],
      common_ground: 'The debate is really about distribution of flexibility—not whether offices should exist.',
      stance_distribution: { for: 55, against: 30, neutral: 15 },
    },
    sources: [
      { type: 'reddit', title: 'Urbanism weekly (mock)', url: '#', domain: 'reddit.com' },
    ],
    redditComments: [],
    tweets: [],
  },
  {
    id: 'mock-3',
    source: 'polaris',
    subreddit: 'r/technology',
    category: 'Technology',
    title: 'Should social media platforms be liable for content?',
    url: 'https://example.com/mock-3',
    score: 18900,
    num_comments: 891,
    thumbnail: null,
    imageUrl: 'https://picsum.photos/seed/nexusmedia/960/520',
    createdUtc: Math.floor(Date.now() / 1000) - 86400,
    stanceDistribution: { for: 61, against: 27, neutral: 12 },
    civility: 66,
    article: stubArticle({
      lede:
        'Legislators in Washington and Brussels are again debating whether large social platforms should face publisher-style liability for user-generated content. The question cuts across free-speech doctrine, competition law, and the economics of moderation at scale.',
    }),
    bothSides: {
      for: [
        'Ranking is editorial; scale creates foreseeable harms that victims cannot remedy alone.',
        'Transparency reports show repeat failure modes that liability could discipline.',
      ],
      against: [
        'Strict liability incentivizes over-removal and chills marginal speech.',
        'Courts lack bandwidth to adjudicate global speech at platform velocity.',
      ],
      common_ground: 'Everyone wants fewer harms; disagreement is who pays the error cost—users or platforms.',
      stance_distribution: { for: 61, against: 27, neutral: 12 },
    },
    sources: [
      { type: 'reddit', title: 'Policy thread (mock)', url: '#', domain: 'reddit.com' },
      { type: 'news', title: 'Section 230 reform debate', url: '#', domain: 'news.example' },
    ],
    redditComments: [],
    tweets: [],
  },
  {
    id: 'mock-4',
    source: 'polaris',
    subreddit: 'r/science',
    category: 'Science',
    title: 'Is universal basic income inevitable?',
    url: 'https://example.com/mock-4',
    score: 6400,
    num_comments: 156,
    thumbnail: null,
    imageUrl: 'https://picsum.photos/seed/nexusubi/960/520',
    createdUtc: Math.floor(Date.now() / 1000) - 86400 * 2,
    stanceDistribution: { for: 48, against: 35, neutral: 17 },
    civility: 79,
    article: stubArticle({
      lede:
        'Pilot programmes from Kenya to California have renewed interest in unconditional cash transfers as automation anxiety rises. Proponents frame UBI as a simpler welfare architecture; opponents question fiscal sustainability and labour-market effects.',
    }),
    bothSides: {
      for: [
        'Cash floors reduce administrative leakage compared with fragmented benefits.',
        'Automation shocks may require simpler insurance as legacy systems strain.',
      ],
      against: [
        'Inflation and tax incidence are not solved by transfers alone.',
        'Political coalitions for UBI remain fragile without durable funding stories.',
      ],
      common_ground: 'Both camps agree poverty is costly; they differ on whether cash is the cleanest instrument.',
      stance_distribution: { for: 48, against: 35, neutral: 17 },
    },
    sources: [{ type: 'reddit', title: 'Economy forum (mock)', url: '#', domain: 'reddit.com' }],
    redditComments: [],
    tweets: [],
  },
  {
    id: 'mock-5',
    source: 'polaris',
    subreddit: 'r/technology',
    category: 'Technology',
    title: 'Does open source software weaken national security?',
    url: 'https://example.com/mock-5',
    score: 4100,
    num_comments: 93,
    thumbnail: null,
    imageUrl: 'https://picsum.photos/seed/nexusoss/960/520',
    createdUtc: Math.floor(Date.now() / 1000) - 3600 * 12,
    stanceDistribution: { for: 33, against: 52, neutral: 15 },
    civility: 88,
    article: stubArticle({
      lede:
        'A classified review leaked last month reignited arguments over whether publicly available cryptography and infrastructure code create asymmetric advantages for adversaries. Security agencies and open-source maintainers have offered sharply different readings of the same incident data.',
    }),
    bothSides: {
      for: [
        'Attackers can study patches and exploit windows at planetary scale.',
        'Some critical paths may warrant controlled distribution beyond public repos.',
      ],
      against: [
        'Many-eyes dynamics surface bugs faster than opaque monocultures.',
        'Security is a process; openness supports reproducible audits.',
      ],
      common_ground: 'The argument is layered openness: math and protocols public, operations and keys guarded.',
      stance_distribution: { for: 33, against: 52, neutral: 15 },
    },
    sources: [{ type: 'reddit', title: 'Security thread (mock)', url: '#', domain: 'reddit.com' }],
    redditComments: [],
    tweets: [],
  },
  {
    id: 'mock-6',
    source: 'polaris',
    subreddit: 'r/nature',
    category: 'Nature',
    title: 'Can rewilding restore biodiversity at scale?',
    url: 'https://example.com/mock-6',
    score: 15200,
    num_comments: 445,
    thumbnail: null,
    imageUrl: 'https://picsum.photos/seed/nexusvote/960/520',
    createdUtc: Math.floor(Date.now() / 1000) - 3600 * 4,
    stanceDistribution: { for: 44, against: 44, neutral: 12 },
    civility: 58,
    article: stubArticle({
      lede:
        'Large-scale rewilding projects from the Scottish Highlands to the Iberian peninsula are reporting early signs of species recovery, yet farmers and rural communities question who bears the cost of land set-asides.',
      perspectives:
        'Conservation NGOs celebrate keystone species returns, while agricultural unions warn of lost grazing income and increased predator conflicts with livestock.',
    }),
    bothSides: {
      for: [
        'Higher turnout can reduce primary polarization incentives.',
        'Civic duty framing aligns with jury service in several democracies.',
      ],
      against: [
        'Forced participation can inflate low-information ballots.',
        'Penalties can fall unevenly without excellent access design.',
      ],
      common_ground: 'Legitimacy needs both broad voice and meaningful choice—not turnout for its own sake.',
      stance_distribution: { for: 44, against: 44, neutral: 12 },
    },
    sources: [{ type: 'reddit', title: 'Conservation thread (mock)', url: '#', domain: 'reddit.com' }],
    redditComments: [],
    tweets: [],
  },
]
