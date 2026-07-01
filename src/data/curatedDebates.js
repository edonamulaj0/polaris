/**
 * Curated controversial debate topics — pre-built discussion articles.
 * Each entry becomes a full debate page with moderated comments.
 *
 * @typedef {[string, string, string]} DebateTuple — [title, topicArea, summary]
 */

/** @type {DebateTuple[]} */
const RAW_DEBATES = [
  [
    'Death Penalty vs. Lifetime Imprisonment',
    'Human Rights',
    'When society confronts heinous crimes, should justice mean permanent incarceration or the ultimate punishment? Advocates of life sentences note that imprisonment is severe yet reversible and avoids the moral burden of state-sanctioned killing. Pro-death-penalty supporters argue that some crimes are so atrocious that only execution suffices. This debate mixes ethics, deterrence and human rights, and divides public opinion worldwide.',
  ],
  [
    'Legalizing and Regulating Recreational Drugs',
    'Health & Society',
    'Decades after the "war on drugs," many question whether prohibition has done more harm than good. Supporters of legalization claim that regulation could reduce crime and improve public health, pointing to decriminalization experiments in places like Portugal. Opponents fear that making substances available, even with warning labels, will increase abuse and societal costs. The issue pits individual freedom against public safety and morality.',
  ],
  [
    'Euthanasia and Physician-Assisted Death',
    'Health & Society',
    'Is it compassionate to allow terminally ill patients to end their lives, or does legalizing assisted death open a dangerous door? Proponents view euthanasia as a merciful choice for people in unbearable suffering, while critics warn about slippery slopes and moral dangers.',
  ],
  [
    'Compulsory Voting vs. Voluntary Elections',
    'Politics & Governance',
    'Should democracies force citizens to vote? Supporters argue that compulsory voting boosts turnout and ensures leaders represent the entire populace. Critics see mandated voting as an infringement of personal freedom and worry that uninterested or uninformed voters will dilute electoral quality. The dispute frames voting as civic duty versus voluntary right.',
  ],
  [
    'Profit Maximization vs. Corporate Social Responsibility',
    'Politics & Governance',
    'Many CEOs claim that a firm\'s primary obligation is to its shareholders, citing Milton Friedman\'s classic argument. Others insist businesses must also protect the environment, workers and communities even if profits decline. From sweatshop scandals to eco-friendly initiatives, this debate asks whether greed is good or whether corporations must answer to society.',
  ],
  [
    'Licensing Parenthood',
    'Health & Society',
    'Should parenting require proof of competence? This provocative topic compares raising a child to driving a car, an activity that affects others and arguably warrants licensing. Advocates argue that mandatory parenting classes, background checks or financial stability could prevent neglect and abuse. Opponents decry the idea as dystopian, citing government overreach and discrimination.',
  ],
  [
    'Donald Trump\'s Economic Interventionism',
    'Politics & Governance',
    'During the Trump administration, trade wars and heavy-handed policies raised questions about free markets. Supporters of Trump\'s approach see tariffs and renegotiated trade deals as necessary to protect American industries. Critics say this "interventionist" strategy disrupted global commerce and violated laissez-faire principles.',
  ],
  [
    'Fake-News Removal Within 24 Hours',
    'Technology',
    'Should governments force social-media platforms to delete misinformation on a timer? Supporters view rapid removal as an "emergency brake" to combat viral lies. Opponents warn that overzealous moderation threatens free speech and could create a slippery slope toward censorship. This clash pits truth and public safety against civil liberties.',
  ],
  [
    'Prisoner Voting Rights',
    'Human Rights',
    'Can a democracy be truly representative if prisoners cannot vote? This question examines whether incarceration should silence an individual\'s political voice. Advocates note that civic participation aids rehabilitation, while opponents argue that losing voting rights is a valid part of punishment.',
  ],
  [
    'Punishment vs. Rehabilitation in Prisons',
    'Human Rights',
    'Should prisons primarily penalize offenders or help them rebuild their lives? Those favoring harsh penalties emphasize deterrence and retribution, whereas supporters of rehabilitation believe society benefits more when inmates are educated and given second chances.',
  ],
  [
    'Public Transport vs. Road Infrastructure Funding',
    'Climate & Environment',
    'Should governments invest more in buses, trains and subways, or expand roads for private vehicles? Proponents of public transport funding highlight sustainability and equality, while critics argue that smoother roads are essential for economic growth.',
  ],
  [
    'Monarchy vs. Republic',
    'Politics & Governance',
    'In constitutional monarchies, royal families serve as cultural symbols. Critics argue that full republics with elected heads of state are more democratic and accountable. Supporters of monarchy value tradition and national identity.',
  ],
  [
    'Cognitive and Ethical Tests for Political Candidates',
    'Politics & Governance',
    'Should aspiring leaders prove their mental acuity and moral compass before taking office? Advocates say testing could strengthen governance and voter trust. Opponents warn that mandatory evaluations undermine freedom of choice and could be abused politically.',
  ],
  [
    'Social Media\'s Influencer Culture',
    'Technology',
    'Are influencers positive role models or purveyors of unrealistic standards? This debate explores whether the rise of online personalities benefits society or fuels negative trends. Some celebrate influencers for democratizing fame; others blame them for promoting consumerism and body-image issues.',
  ],
  [
    'Hiding Likes and Follows to Protect Mental Health',
    'Technology',
    'Does displaying "likes" on social platforms harm users\' self-esteem? Advocates for hiding engagement metrics believe it could reduce social pressure. Opponents argue that public metrics drive accountability and engagement. The issue touches on mental health and platform design.',
  ],
  [
    'Breaking Up Big Tech',
    'Technology',
    'With tech giants dominating markets, some call for antitrust action. Critics of monopolies argue that breaking up big tech would foster competition and consumer choice. Others warn that fragmentation could hinder innovation and global competitiveness.',
  ],
  [
    'AI in Debate Activities',
    'Education',
    'As generative AI improves, should it be barred from debating? Purists worry that AI research tools and deepfake voices could erode human-only debate skills. Others see AI as a practice buddy and fact-checker, comparing bans to forbidding calculators.',
  ],
  [
    'Parents Accessing Teen Dating Apps',
    'Health & Society',
    'Parents want to protect their children; teenagers want privacy. This topic asks whether parents should have access to their teens\' dating-app accounts. Proponents emphasize safety and oversight, while opponents argue that snooping undermines trust and autonomy.',
  ],
  [
    'Is Online Dating Ruining the Dating Scene?',
    'Health & Society',
    'Dating apps have reshaped relationships. Critics worry they encourage superficial interactions and commodify romance. Defenders see them as tools for connection in a busy world. The debate reflects generational and cultural differences in courtship.',
  ],
  [
    'Does Social Media Do More Harm Than Good?',
    'Technology',
    'Perhaps the platform\'s biggest question, this topic weighs social media\'s benefits (connection, information) against its harms (polarization, misinformation, addiction). The debate invites a broad examination of how platforms shape society.',
  ],
  [
    'Is Social Media Addiction a Public-Health Crisis?',
    'Health & Society',
    'Some researchers liken heavy social-media use to substance addiction, citing dopamine spikes and mental-health issues. Critics argue that "addiction" is an exaggerated term and that blame lies in individuals\' self-control. Governments and platforms face pressure to treat this as a health issue.',
  ],
  [
    'Do Social Movements Need to Go Viral?',
    'Politics & Governance',
    'From the Arab Spring to #MeToo, virality has amplified activism. This debate questions whether causes can succeed without trending online. Some activists say that going viral is essential for awareness; others argue that quiet, local organizing remains crucial.',
  ],
  [
    'Character Development vs. Academics in Schools',
    'Education',
    'Should early education prioritize empathy, resilience and ethics alongside reading and math? Proponents of social-emotional learning argue that cooperation and self-control are critical for long-term success. Traditionalists counter that basic academics must come first. The debate seeks a balance between virtue and GPA.',
  ],
  [
    'Abolishing Grades for Personalized Growth Reports',
    'Education',
    'Replacing report-card letters with narrative feedback could encourage growth mindsets and reduce test anxiety. Critics worry about subjectivity and the complications this poses for college admissions. The issue challenges long-standing evaluation systems.',
  ],
  [
    'Blockchain-Certified Micro-Credentials vs. Traditional Degrees',
    'Education',
    'In an age of MOOCs and crypto technology, some propose replacing degrees with secure digital badges. Proponents say micro-credentials can be more current and job-relevant, preventing résumé fraud. Skeptics doubt whether employers will value badges over established diplomas.',
  ],
  [
    'Merit-Based Admissions vs. Diversity Quotas',
    'Education',
    'College admissions officers face a dilemma: select the best scores or assemble a diverse class? Merit advocates warn that quotas may undermine standards, while diversity supporters argue that proactive measures correct historic inequities. The debate intertwines fairness, equity and educational outcomes.',
  ],
  [
    'Banning Smartphones for Children Under 13',
    'Education',
    'With concerns about screen addiction and cyberbullying, some argue for a hard age limit on smartphone ownership. Supporters imagine kids playing outside more, whereas critics say technology literacy is essential and bans infringe on parental choice.',
  ],
  [
    'Parents Still Paying Education Taxes After Children Graduate',
    'Education',
    'Education funding typically comes from property or income taxes. Should parents stop paying once their kids finish school? Community advocates respond that public education benefits everyone and that today\'s students become tomorrow\'s doctors, leaders and taxpayers.',
  ],
  [
    'Using AI Tools like ChatGPT for Homework',
    'Education',
    'AI can help students brainstorm and edit, but at what cost? Supporters see AI as a powerful tutor that improves learning. Critics warn that over-reliance leads to shallow understanding and raises academic-integrity concerns. Schools are rewriting honor codes to address this new reality.',
  ],
  [
    'Animals in Research and Animal Rights',
    'Science',
    'Animal testing has led to lifesaving medical breakthroughs, yet it raises profound ethical concerns. This debate asks whether potential benefits justify harming sentient creatures. It also examines whether humane alternatives can replace traditional practices.',
  ],
  [
    'Should we normalize quitting instead of "never give up"?',
    'Health & Society',
    'A debate weighing whether quitting can prevent burnout and redirect energy, or if it erodes resilience and perseverance.',
  ],
  [
    'Do commemorative months actually raise awareness or are they just symbolic?',
    'Human Rights',
    'Examines whether months like Black History Month bring visibility and education or are performative gestures without lasting impact.',
  ],
  [
    'Should toy companies stop marketing toys specifically to boys or girls?',
    'Education',
    'Questions whether gender-based marketing limits children\'s interests and suggests a shift toward gender-neutral products.',
  ],
  [
    'Do universities need to stop pretending all degrees have equal value in the job market?',
    'Education',
    'Looks at whether different degrees provide comparable employment outcomes and whether higher education should be more transparent about returns.',
  ],
  [
    'Does criminalizing low-value survival crimes (shoplifting, fare-dodging) do more harm than good?',
    'Human Rights',
    'Challenges whether punishing poverty-driven offenses merely traps people in poverty instead of addressing root causes.',
  ],
  [
    'Should religion have no place in politics?',
    'Religion & Ethics',
    'Explores the boundaries between faith and political power and whether secularism ensures fair representation in pluralistic societies.',
  ],
  [
    'Should single-sex spaces be defined by biological sex or gender identity?',
    'Human Rights',
    'Considers evolving definitions of gender in sports, shelters and prisons, and the tension between inclusion, privacy and safety.',
  ],
  [
    'Are mental-health disorders being overdiagnosed in young adults?',
    'Health & Society',
    'Debates whether rising diagnoses of anxiety, depression and ADHD reflect better recognition or an over-medicalization of normal distress.',
  ],
  [
    'Should emotional harm be treated as seriously as physical harm in law?',
    'Human Rights',
    'Asks whether legal systems should give equal weight to emotional and physical injuries when assessing damages and justice.',
  ],
  [
    'Is disaster tourism ethical?',
    'Religion & Ethics',
    'Weighs whether visiting sites of tragedy educates and memorializes or commodifies suffering for "dark tourism".',
  ],
  [
    'Is AI making people less intelligent?',
    'Technology',
    'Considers whether automation of thinking tasks and constant info streams erode our depth of thought or simply shift which skills matter.',
  ],
  [
    'Can we create a universally objective definition of right and wrong?',
    'Religion & Ethics',
    'Surveys philosophical efforts from ancient codes to modern debates, asking if morality is a universal truth or culturally constructed.',
  ],
  [
    'Is cancel culture a form of censorship?',
    'Politics & Governance',
    'Questions whether public backlash holds people accountable or unjustly silences speech, balancing free expression with social responsibility.',
  ],
  [
    'Is bullying a natural part of youth development?',
    'Education',
    'Explores whether rough peer interactions "build character" or normalize cruelty, and whether empathy can replace domination as a rite of passage.',
  ],
  [
    'Are truth and justice human-made constructs?',
    'Religion & Ethics',
    'Delves into moral relativism and social constructivism, asking if these ideals exist beyond human interpretation.',
  ],
  [
    'Should American football be banned?',
    'Health & Society',
    'Debates whether the sport\'s cultural significance outweighs concerns about player safety and long-term health risks.',
  ],
  [
    'Should history classes include mandatory units on colonialism and slavery?',
    'Education',
    'Discusses whether curricula should ensure in-depth coverage of colonialism and the transatlantic slave trade to confront legacies of oppression.',
  ],
  [
    'Should cultural appropriation ever be considered a compliment?',
    'Religion & Ethics',
    'Differentiates between respectful cultural exchange and appropriation, questioning when borrowing traditions honors or exploits marginalized cultures.',
  ],
  [
    'Would celebrities be better off without media coaches?',
    'Technology',
    'Considers whether media training protects stars and prevents scandals or turns them into inauthentic performances.',
  ],
  [
    'Should organ markets be legalized to reduce transplant shortages?',
    'Health & Society',
    'Tackles whether a regulated organ-sale system could increase supply and save lives or would exploit the poor and commodify the human body.',
  ],
]

function buildArticle(summary) {
  const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean)
  const lede = sentences.slice(0, 2).join(' ') || summary
  const rest = sentences.slice(2).join(' ')

  return {
    lede,
    background:
      rest ||
      'This question sits at the intersection of values, policy, and lived experience. Understanding it requires weighing competing claims about fairness, freedom, and what a good society ought to protect.',
    perspectives:
      'Supporters of one side argue that the status quo fails vulnerable people and that change is overdue. Critics warn that proposed reforms carry unintended consequences, trade-offs, and risks to institutions many rely on.',
    evidence:
      'Researchers, journalists, and advocacy groups cite studies, historical precedents, and real-world experiments — though experts disagree on which evidence matters most and how to interpret it.',
    counterpoint:
      'The strongest challenge to the prevailing view holds that the opposite approach better protects dignity, stability, or individual liberty — and that quick fixes often ignore deeper structural causes.',
    implications:
      'Whatever society chooses, the decision will shape law, culture, and everyday life. The outcome may reassure one camp while deepening mistrust in the other.',
    conclusion:
      'The debate remains open. Constructive disagreement depends on good-faith argument, credible sources, and willingness to engage the strongest version of the other side.',
  }
}

function hashStance(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const forPct = 28 + (h % 25)
  const againstPct = 28 + ((h >> 4) % 25)
  const neutralPct = Math.max(10, 100 - forPct - againstPct)
  return { for: forPct, against: againstPct, neutral: neutralPct }
}

/** @param {DebateTuple} tuple @param {number} index */
function buildDebate([title, topicArea, summary], index) {
  const num = index + 1
  const id = `curated-${String(num).padStart(2, '0')}`
  const stanceDistribution = hashStance(id)
  const civility = 62 + (num % 28)

  return {
    id,
    source: 'curated',
    subreddit: 'Polaris Curated',
    category: topicArea,
    topicArea,
    title,
    url: `/discussion/${id}`,
    score: 2400 + num * 137,
    num_comments: 18 + (num % 90),
    thumbnail: null,
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/960/520`,
    createdUtc: Math.floor(Date.now() / 1000) - 86400 * (num % 45),
    publishedAt: Math.floor(Date.now() / 1000) - 86400 * (num % 45),
    stanceDistribution,
    civility,
    verified: true,
    sourceType: 'curated',
    isCurated: true,
    isWeeklyEligible: true,
    article: buildArticle(summary),
    explainer: summary,
    sources: [
      {
        type: 'curated',
        title: 'Polaris curated debate topic',
        url: '#',
        domain: 'polaris.app',
      },
    ],
    redditComments: [],
    tweets: [],
  }
}

export const CURATED_DEBATES = RAW_DEBATES.map(buildDebate)

export const CURATED_DEBATE_BY_ID = Object.fromEntries(
  CURATED_DEBATES.map((d) => [d.id, d]),
)

export function getCuratedDebate(id) {
  const decoded = decodeURIComponent(id)
  return CURATED_DEBATE_BY_ID[id] ?? CURATED_DEBATE_BY_ID[decoded] ?? null
}

export function filterCuratedByTopic(topicId) {
  if (!topicId) return CURATED_DEBATES
  return CURATED_DEBATES.filter((d) => d.topicArea === topicId)
}
