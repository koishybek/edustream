import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Real, topical, long-standing TED / TED-Ed / Ellen MacArthur Foundation videos
// on ESG & sustainability, mapped to course categories. Swap freely.
const youtube = (id: string) => `https://www.youtube.com/watch?v=${id}`;

const VIDEOS_BY_CATEGORY: Record<string, string[]> = {
  'esg-reporting': ['HyDteUfammQ', 'Kl3VVrggKz4'], // Corporate ESG; First sustainable generation
  'circular-economy': ['aSCQd6A19YQ', 'Kl3VVrggKz4'], // Circular economy (MacArthur)
  climate: ['xKxrkht7CpY', 'Kl3VVrggKz4'], // How solar panels work; sustainability
  social: ['HyDteUfammQ', 'Kl3VVrggKz4'],
  water: ['otrpxtAmDAk', 'OCzYdNSJF-k'], // Fresh water scarcity; running out of clean water
  biodiversity: ['GK_vRtHJZu4', 'Kl3VVrggKz4'], // Why biodiversity matters
};
const GENERAL_VIDEOS = [
  'Kl3VVrggKz4',
  'xKxrkht7CpY',
  'aSCQd6A19YQ',
  'HyDteUfammQ',
  'GK_vRtHJZu4',
  'otrpxtAmDAk',
];

/** Round-robin a video for a given category, falling back to the general pool. */
function makeVideoPicker(categorySlug: string) {
  const pool = VIDEOS_BY_CATEGORY[categorySlug] ?? GENERAL_VIDEOS;
  let i = 0;
  return () => youtube(pool[i++ % pool.length]);
}

const cover = (seed: string) => `https://picsum.photos/seed/${seed}/800/450`;
const hash = (pw: string) => bcrypt.hash(pw, 10);

interface OptionSeed {
  text: string;
  correct?: boolean;
}
interface QuestionSeed {
  text: string;
  explanation?: string;
  options: OptionSeed[];
}
interface QuizSeed {
  title?: string;
  passingScore?: number;
  questions: QuestionSeed[];
}
interface LessonSeed {
  title: string;
  durationSeconds: number;
}
interface ModuleSeed {
  title: string;
  lessons: LessonSeed[];
  quiz: QuizSeed;
}
interface CourseSeed {
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  instructor: number; // index into instructors[]
  modules: ModuleSeed[];
}

const CATEGORIES = [
  { name: 'Климат', slug: 'climate', icon: 'cloud' },
  { name: 'Вода', slug: 'water', icon: 'droplets' },
  { name: 'Циркулярная экономика', slug: 'circular-economy', icon: 'recycle' },
  { name: 'ESG-отчётность', slug: 'esg-reporting', icon: 'bar-chart-3' },
  { name: 'Биоразнообразие', slug: 'biodiversity', icon: 'leaf' },
  { name: 'Социальное управление', slug: 'social', icon: 'users' },
];

const COURSES: CourseSeed[] = [
  {
    title: 'Corporate Sustainability Strategy: From Principles to Practice',
    slug: 'corporate-sustainability-strategy',
    description:
      'Master the frameworks and practical tools needed to integrate ESG metrics into core business strategy and drive meaningful environmental impact.',
    categorySlug: 'esg-reporting',
    level: 'INTERMEDIATE',
    instructor: 0,
    modules: [
      {
        title: 'Introduction to Modern ESG',
        lessons: [
          { title: 'What ESG means in 2026', durationSeconds: 720 },
          { title: 'The business case for sustainability', durationSeconds: 900 },
          { title: 'Stakeholders vs shareholders', durationSeconds: 660 },
        ],
        quiz: {
          questions: [
            {
              text: 'What does the "G" in ESG stand for?',
              options: [
                { text: 'Growth' },
                { text: 'Governance', correct: true },
                { text: 'Green' },
                { text: 'Global' },
              ],
              explanation:
                'ESG = Environmental, Social and Governance — governance covers board structure, ethics and accountability.',
            },
            {
              text: 'Which best describes the "business case" for sustainability?',
              options: [
                { text: 'It is purely a marketing exercise' },
                {
                  text: 'It can lower risk, cut costs and open new markets',
                  correct: true,
                },
                { text: 'It only matters to regulators' },
                { text: 'It always reduces profit' },
              ],
            },
            {
              text: 'A "stakeholder" view of the firm prioritises:',
              options: [
                { text: 'Only shareholders’ short-term returns' },
                {
                  text: 'The interests of everyone affected — employees, communities, customers',
                  correct: true,
                },
                { text: 'Government subsidies above all' },
                { text: 'Share buybacks' },
              ],
            },
          ],
        },
      },
      {
        title: 'Carbon Accounting Fundamentals',
        lessons: [
          { title: 'Scopes 1, 2 and 3 explained', durationSeconds: 1080 },
          { title: 'Building your first inventory', durationSeconds: 1200 },
          { title: 'Setting science-based targets', durationSeconds: 840 },
        ],
        quiz: {
          questions: [
            {
              text: 'Scope 2 emissions come from:',
              options: [
                { text: 'A company’s own vehicles and boilers' },
                {
                  text: 'Purchased electricity, steam, heating and cooling',
                  correct: true,
                },
                { text: 'Suppliers and product use' },
                { text: 'Employee commuting only' },
              ],
              explanation:
                'Scope 1 = direct, Scope 2 = purchased energy, Scope 3 = everything else in the value chain.',
            },
            {
              text: 'Scope 3 emissions are usually:',
              options: [
                {
                  text: 'The largest and hardest-to-measure share for most firms',
                  correct: true,
                },
                { text: 'Always negligible' },
                { text: 'Banned under the GHG Protocol' },
                { text: 'Only relevant to energy companies' },
              ],
            },
            {
              text: 'A "science-based target" is one that:',
              options: [
                { text: 'Is chosen by marketing for a press release' },
                {
                  text: 'Aligns reductions with limiting warming to 1.5–2°C',
                  correct: true,
                },
                { text: 'Requires no measurement' },
                { text: 'Only counts offsets' },
              ],
            },
          ],
        },
      },
      {
        title: 'Supply Chain Transparency',
        lessons: [
          { title: 'Mapping your value chain', durationSeconds: 960 },
          { title: 'Supplier engagement at scale', durationSeconds: 780 },
        ],
        quiz: {
          questions: [
            {
              text: 'Why map your value chain before setting targets?',
              options: [
                {
                  text: 'You can’t manage emissions or risks you haven’t identified',
                  correct: true,
                },
                { text: 'It is legally forbidden to set targets first' },
                { text: 'Mapping replaces the need for data' },
                { text: 'It guarantees zero emissions' },
              ],
            },
            {
              text: 'Effective supplier engagement at scale relies on:',
              options: [
                { text: 'Ignoring small suppliers entirely' },
                {
                  text: 'Clear data requests, shared standards and incentives',
                  correct: true,
                },
                { text: 'One-off audits with no follow-up' },
                { text: 'Switching suppliers every quarter' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Mastering Corporate ESG Frameworks',
    slug: 'mastering-corporate-esg-frameworks',
    description:
      'A deep dive into integrating environmental, social, and governance principles into core business strategies, taught by industry pioneers.',
    categorySlug: 'esg-reporting',
    level: 'ADVANCED',
    instructor: 1,
    modules: [
      {
        title: 'The Reporting Landscape',
        lessons: [
          { title: 'GRI, SASB and TCFD', durationSeconds: 1020 },
          { title: 'The EU CSRD in practice', durationSeconds: 1140 },
          { title: 'Choosing a framework', durationSeconds: 720 },
        ],
        quiz: {
          questions: [
            {
              text: 'The TCFD framework focuses specifically on:',
              options: [
                { text: 'Water usage reporting' },
                {
                  text: 'Climate-related financial risks and disclosures',
                  correct: true,
                },
                { text: 'Employee diversity quotas' },
                { text: 'Tax transparency' },
              ],
              explanation:
                'TCFD = Task Force on Climate-related Financial Disclosures.',
            },
            {
              text: 'The EU CSRD primarily requires companies to:',
              options: [
                {
                  text: 'Report sustainability information with the same rigor as financials',
                  correct: true,
                },
                { text: 'Stop publishing annual reports' },
                { text: 'Only disclose profit figures' },
                { text: 'Avoid third-party assurance' },
              ],
            },
            {
              text: 'GRI standards are best described as:',
              options: [
                { text: 'A climate-only metric' },
                {
                  text: 'A broad, multi-stakeholder sustainability reporting standard',
                  correct: true,
                },
                { text: 'A stock index' },
                { text: 'A carbon offset registry' },
              ],
            },
          ],
        },
      },
      {
        title: 'Materiality & Assurance',
        lessons: [
          { title: 'Double materiality assessments', durationSeconds: 1260 },
          { title: 'Preparing for external assurance', durationSeconds: 900 },
          { title: 'Avoiding greenwashing claims', durationSeconds: 840 },
        ],
        quiz: {
          questions: [
            {
              text: '"Double materiality" means assessing:',
              options: [
                {
                  text: 'Impact on the company AND the company’s impact on the world',
                  correct: true,
                },
                { text: 'Two separate financial statements' },
                { text: 'Only financial impact' },
                { text: 'Materials used in two factories' },
              ],
            },
            {
              text: 'Greenwashing is:',
              options: [
                { text: 'A water-recycling technique' },
                {
                  text: 'Making misleading or unsubstantiated environmental claims',
                  correct: true,
                },
                { text: 'A type of external audit' },
                { text: 'A reporting standard' },
              ],
            },
            {
              text: 'External assurance of an ESG report mainly improves its:',
              options: [
                { text: 'Length' },
                { text: 'Credibility and reliability', correct: true },
                { text: 'Marketing budget' },
                { text: 'Share price guarantee' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    title: 'The Architecture of Circular Economies',
    slug: 'architecture-of-circular-economies',
    description:
      'Understanding closed-loop systems and regenerative material flows in modern urban environments.',
    categorySlug: 'circular-economy',
    level: 'INTERMEDIATE',
    instructor: 2,
    modules: [
      {
        title: 'Foundations',
        lessons: [
          { title: 'Linear vs circular models', durationSeconds: 720 },
          { title: 'Designing for disassembly', durationSeconds: 1080 },
          { title: 'Case study: The Edge, Amsterdam', durationSeconds: 960 },
        ],
        quiz: {
          questions: [
            {
              text: 'A linear economy follows which pattern?',
              options: [
                { text: 'Take – make – waste', correct: true },
                { text: 'Reduce – reuse – regenerate' },
                { text: 'Borrow – return – repeat' },
                { text: 'Grow – harvest – replant' },
              ],
            },
            {
              text: 'The circular economy goes "beyond recycling" by aiming to:',
              options: [
                {
                  text: 'Design out waste and keep materials in use',
                  correct: true,
                },
                { text: 'Burn more waste for energy' },
                { text: 'Increase single-use packaging' },
                { text: 'Export waste abroad' },
              ],
            },
            {
              text: '"Designing for disassembly" helps because:',
              options: [
                { text: 'Products look more modern' },
                {
                  text: 'Components can be repaired, reused or recycled at end of life',
                  correct: true,
                },
                { text: 'It makes products heavier' },
                { text: 'It prevents any maintenance' },
              ],
            },
          ],
        },
      },
      {
        title: 'Regenerative Systems',
        lessons: [
          { title: 'Material passports', durationSeconds: 840 },
          { title: 'Regenerative urban planning', durationSeconds: 1440 },
          { title: 'Measuring circularity', durationSeconds: 780 },
        ],
        quiz: {
          questions: [
            {
              text: 'A "material passport" records:',
              options: [
                {
                  text: 'What a product is made of, so materials can be recovered',
                  correct: true,
                },
                { text: 'A worker’s travel permits' },
                { text: 'The retail price history' },
                { text: 'Nothing useful for recycling' },
              ],
            },
            {
              text: 'Regenerative design aims to:',
              options: [
                { text: 'Do slightly less harm' },
                {
                  text: 'Leave systems better than before — net positive',
                  correct: true,
                },
                { text: 'Maximise extraction' },
                { text: 'Avoid all measurement' },
              ],
            },
            {
              text: 'Circularity metrics are needed to:',
              options: [
                {
                  text: 'Track progress and compare strategies objectively',
                  correct: true,
                },
                { text: 'Replace the need for any action' },
                { text: 'Hide material flows' },
                { text: 'Guarantee profit' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Introduction to Renewable Energetics',
    slug: 'introduction-to-renewable-energetics',
    description:
      'A beginner-friendly tour of solar, wind, hydro and storage — how the modern clean grid actually fits together.',
    categorySlug: 'climate',
    level: 'BEGINNER',
    instructor: 0,
    modules: [
      {
        title: 'Energy Basics',
        lessons: [
          { title: 'From fossil fuels to electrons', durationSeconds: 660 },
          { title: 'Solar PV fundamentals', durationSeconds: 900 },
          { title: 'Wind, on- and offshore', durationSeconds: 840 },
        ],
        quiz: {
          questions: [
            {
              text: 'A solar photovoltaic (PV) cell converts:',
              options: [
                { text: 'Heat directly into motion' },
                { text: 'Sunlight directly into electricity', correct: true },
                { text: 'Wind into hydrogen' },
                { text: 'Water into fuel' },
              ],
              explanation:
                'PV cells use the photovoltaic effect to turn photons into an electric current.',
            },
            {
              text: 'Roughly how much more solar energy hits Earth than humanity uses?',
              options: [
                { text: 'About the same' },
                { text: 'Around 10 times more' },
                { text: 'Thousands of times more', correct: true },
                { text: 'Less than we use' },
              ],
            },
            {
              text: 'Offshore wind is attractive mainly because:',
              options: [
                {
                  text: 'Winds at sea are stronger and steadier',
                  correct: true,
                },
                { text: 'It needs no maintenance' },
                { text: 'It works without wind' },
                { text: 'It is always cheaper than onshore' },
              ],
            },
          ],
        },
      },
      {
        title: 'The Clean Grid',
        lessons: [
          { title: 'Storage and batteries', durationSeconds: 1020 },
          { title: 'Balancing supply and demand', durationSeconds: 780 },
        ],
        quiz: {
          questions: [
            {
              text: 'Why is energy storage important on a renewable grid?',
              options: [
                {
                  text: 'Sun and wind are variable, so supply must be shifted in time',
                  correct: true,
                },
                { text: 'Batteries create new energy from nothing' },
                { text: 'Storage removes the need for generation' },
                { text: 'It only matters at night for wind' },
              ],
            },
            {
              text: '"Balancing" a grid means:',
              options: [
                { text: 'Keeping the wires physically level' },
                {
                  text: 'Matching electricity supply to demand second-by-second',
                  correct: true,
                },
                { text: 'Charging customers equally' },
                { text: 'Shutting down at peak times' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Social Impact Metrics & Measurement',
    slug: 'social-impact-metrics-measurement',
    description:
      'Turn community impact, labor rights and diversity goals into rigorous, defensible metrics leadership can act on.',
    categorySlug: 'social',
    level: 'INTERMEDIATE',
    instructor: 2,
    modules: [
      {
        title: 'Defining Impact',
        lessons: [
          { title: 'Outputs vs outcomes vs impact', durationSeconds: 840 },
          { title: 'Theory of change', durationSeconds: 960 },
          { title: 'Choosing indicators', durationSeconds: 720 },
        ],
        quiz: {
          questions: [
            {
              text: 'Which is an OUTPUT rather than an outcome?',
              options: [
                { text: 'Number of people trained', correct: true },
                { text: 'Increased household income' },
                { text: 'Improved health' },
                { text: 'Reduced unemployment' },
              ],
              explanation:
                'Outputs are what you produce; outcomes are the changes that result.',
            },
            {
              text: 'A "theory of change" describes:',
              options: [
                {
                  text: 'How and why activities are expected to lead to impact',
                  correct: true,
                },
                { text: 'A company’s share structure' },
                { text: 'A marketing slogan' },
                { text: 'A random list of tasks' },
              ],
            },
            {
              text: 'Good impact indicators should be:',
              options: [
                { text: 'Vague and unmeasurable' },
                { text: 'Specific, measurable and relevant', correct: true },
                { text: 'Chosen to flatter the org' },
                { text: 'Changed every week' },
              ],
            },
          ],
        },
      },
      {
        title: 'Measurement in Practice',
        lessons: [
          { title: 'Survey design that works', durationSeconds: 1080 },
          { title: 'Reporting to stakeholders', durationSeconds: 660 },
        ],
        quiz: {
          questions: [
            {
              text: 'A leading cause of biased survey data is:',
              options: [
                { text: 'Using a neutral, clear question' },
                { text: 'Leading or loaded questions', correct: true },
                { text: 'Anonymity' },
                { text: 'A representative sample' },
              ],
            },
            {
              text: 'Reporting to stakeholders works best when it is:',
              options: [
                {
                  text: 'Honest about both successes and shortfalls',
                  correct: true,
                },
                { text: 'Only positive news' },
                { text: 'As long as possible' },
                { text: 'Hidden from the public' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Sustainable Finance & Investment',
    slug: 'sustainable-finance-investment',
    description:
      'Green bonds, ESG-linked loans and impact investing — how capital is being redirected toward the transition.',
    categorySlug: 'esg-reporting',
    level: 'ADVANCED',
    instructor: 0,
    modules: [
      {
        title: 'Instruments',
        lessons: [
          { title: 'Green and sustainability-linked bonds', durationSeconds: 1140 },
          { title: 'ESG integration in portfolios', durationSeconds: 1260 },
          { title: 'Taxonomies and labels', durationSeconds: 840 },
        ],
        quiz: {
          questions: [
            {
              text: 'A green bond raises money specifically to:',
              options: [
                {
                  text: 'Finance environmentally beneficial projects',
                  correct: true,
                },
                { text: 'Pay executive bonuses' },
                { text: 'Buy back shares' },
                { text: 'Fund any project at all' },
              ],
            },
            {
              text: 'A sustainability-linked bond ties its interest rate to:',
              options: [
                {
                  text: 'Whether the issuer hits ESG performance targets',
                  correct: true,
                },
                { text: 'The CEO’s salary' },
                { text: 'The weather' },
                { text: 'Nothing measurable' },
              ],
            },
            {
              text: 'A green "taxonomy" (e.g. the EU Taxonomy) is:',
              options: [
                { text: 'A tax on carbon' },
                {
                  text: 'A classification of which activities count as sustainable',
                  correct: true,
                },
                { text: 'A list of banned companies' },
                { text: 'A stock exchange' },
              ],
            },
          ],
        },
      },
      {
        title: 'Risk & Return',
        lessons: [
          { title: 'Pricing climate risk', durationSeconds: 1020 },
          { title: 'Transition vs physical risk', durationSeconds: 900 },
        ],
        quiz: {
          questions: [
            {
              text: '"Physical" climate risk refers to:',
              options: [
                {
                  text: 'Damage from floods, storms, heat and other hazards',
                  correct: true,
                },
                { text: 'The risk of new carbon taxes' },
                { text: 'Reputational damage only' },
                { text: 'Currency fluctuations' },
              ],
            },
            {
              text: '"Transition" risk arises from:',
              options: [
                {
                  text: 'Policy, technology and market shifts toward a low-carbon economy',
                  correct: true,
                },
                { text: 'Hurricanes and wildfires' },
                { text: 'Rising sea levels' },
                { text: 'Droughts' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Water Security & Resource Management',
    slug: 'water-security-resource-management',
    description:
      'Resource management and scarcity solutions for a warming, water-stressed Central Asia and beyond.',
    categorySlug: 'water',
    level: 'INTERMEDIATE',
    instructor: 1,
    modules: [
      {
        title: 'The Water Crisis',
        lessons: [
          { title: 'Watersheds and scarcity', durationSeconds: 780 },
          { title: 'The Aral Sea, a cautionary tale', durationSeconds: 1080 },
          { title: 'Water footprints', durationSeconds: 720 },
        ],
        quiz: {
          questions: [
            {
              text: 'Although ~71% of Earth is covered by water, fresh water is scarce because:',
              options: [
                {
                  text: 'Most water is salty or locked in ice/groundwater',
                  correct: true,
                },
                { text: 'There is no water in rivers' },
                { text: 'Fresh water cannot be stored' },
                { text: 'Rain has stopped globally' },
              ],
            },
            {
              text: 'The shrinking of the Aral Sea was driven mainly by:',
              options: [
                {
                  text: 'Diverting its feeder rivers for irrigation',
                  correct: true,
                },
                { text: 'A single dry year' },
                { text: 'Rising sea levels' },
                { text: 'An earthquake' },
              ],
            },
            {
              text: 'A "water footprint" measures:',
              options: [
                {
                  text: 'The total fresh water used to make a product or service',
                  correct: true,
                },
                { text: 'Shoe sizes near rivers' },
                { text: 'Only drinking water' },
                { text: 'Rainfall in a city' },
              ],
            },
          ],
        },
      },
      {
        title: 'Solutions',
        lessons: [
          { title: 'Efficient irrigation', durationSeconds: 900 },
          { title: 'Reuse and desalination', durationSeconds: 960 },
        ],
        quiz: {
          questions: [
            {
              text: 'Drip irrigation saves water mainly by:',
              options: [
                {
                  text: 'Delivering water slowly to roots, cutting evaporation',
                  correct: true,
                },
                { text: 'Flooding entire fields' },
                { text: 'Using only rainwater' },
                { text: 'Spraying water into the air' },
              ],
            },
            {
              text: 'A key drawback of desalination is that it:',
              options: [
                { text: 'Produces no fresh water' },
                {
                  text: 'Is energy-intensive and produces concentrated brine',
                  correct: true,
                },
                { text: 'Only works on fresh water' },
                { text: 'Is illegal everywhere' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    title: 'Biodiversity & Business',
    slug: 'biodiversity-and-business',
    description:
      'Why nature is the next frontier of corporate responsibility — measuring and protecting biodiversity at scale.',
    categorySlug: 'biodiversity',
    level: 'BEGINNER',
    instructor: 2,
    modules: [
      {
        title: 'Nature & Risk',
        lessons: [
          { title: 'Ecosystem services 101', durationSeconds: 720 },
          { title: 'The TNFD framework', durationSeconds: 1020 },
          { title: 'Nature-related dependencies', durationSeconds: 840 },
        ],
        quiz: {
          questions: [
            {
              text: 'Higher biodiversity generally makes an ecosystem:',
              options: [
                {
                  text: 'More resilient to shocks and change',
                  correct: true,
                },
                { text: 'More fragile' },
                { text: 'Unable to recover' },
                { text: 'Identical to a monoculture' },
              ],
            },
            {
              text: '"Ecosystem services" are:',
              options: [
                {
                  text: 'Benefits nature provides — pollination, clean water, climate regulation',
                  correct: true,
                },
                { text: 'Paid subscriptions for parks' },
                { text: 'A type of insurance policy' },
                { text: 'Government departments' },
              ],
            },
            {
              text: 'The TNFD helps organisations to:',
              options: [
                {
                  text: 'Assess and disclose nature-related risks and dependencies',
                  correct: true,
                },
                { text: 'Trade carbon credits only' },
                { text: 'Avoid all reporting' },
                { text: 'Measure employee turnover' },
              ],
            },
          ],
        },
      },
      {
        title: 'Taking Action',
        lessons: [
          { title: 'Nature-positive strategies', durationSeconds: 900 },
          { title: 'Restoration and offsets', durationSeconds: 780 },
        ],
        quiz: {
          questions: [
            {
              text: 'A "nature-positive" goal means:',
              options: [
                {
                  text: 'Halting and reversing nature loss — net gain for biodiversity',
                  correct: true,
                },
                { text: 'Slightly slowing damage' },
                { text: 'Ignoring ecosystems' },
                { text: 'Only planting one species' },
              ],
            },
            {
              text: 'A risk of relying on biodiversity "offsets" is that:',
              options: [
                {
                  text: 'Restored habitat may not equal what was destroyed',
                  correct: true,
                },
                { text: 'They always perfectly replace nature' },
                { text: 'They are free and instant' },
                { text: 'They remove the need to measure' },
              ],
            },
          ],
        },
      },
    ],
  },
];

// Deterministic review sets per course (ratings → non-zero averages).
const REVIEW_RATINGS = [
  [5, 5, 4, 5],
  [5, 4, 5],
  [4, 5, 4, 4],
  [4, 4, 5],
  [5, 4, 4, 5],
  [5, 5, 5],
  [4, 5, 4],
  [5, 4, 5, 5],
];
const REVIEW_COMMENTS = [
  'Genuinely changed how our team thinks about reporting.',
  'Clear, practical and well paced. Highly recommend.',
  'Exactly what I needed to move from theory to action.',
  'Dense but rewarding — come ready to take notes.',
  'The case studies alone are worth it.',
];

async function main() {
  // Clean (FK-safe order) so the seed is re-runnable.
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Categories
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await prisma.category.create({ data: c });
    categoryBySlug.set(created.slug, created.id);
  }

  // Users
  await prisma.user.create({
    data: {
      email: 'admin@demo.io',
      passwordHash: await hash('Admin123!'),
      role: 'ADMIN',
      name: 'EduStream Admin',
      locale: 'ru',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@demo.io',
      passwordHash: await hash('Student123!'),
      role: 'STUDENT',
      name: 'Sarah Jenkins',
      locale: 'ru',
      interests: ['climate', 'circular-economy'],
      knowledgeLevel: 'INTERMEDIATE',
    },
  });

  const instructors = await Promise.all(
    [
      { email: 'elena@demo.io', name: 'Dr. Elena Rostova' },
      { email: 'elias@demo.io', name: 'Dr. Elias Vance' },
      { email: 'david@demo.io', name: 'David Chen' },
    ].map(async (i) =>
      prisma.user.create({
        data: {
          email: i.email,
          passwordHash: await hash('Instructor123!'),
          role: 'INSTRUCTOR',
          name: i.name,
          locale: 'en',
        },
      }),
    ),
  );

  const reviewers = await Promise.all(
    ['aigerim', 'marat', 'dana', 'timur'].map(async (n, idx) =>
      prisma.user.create({
        data: {
          email: `${n}@demo.io`,
          passwordHash: await hash('Reviewer123!'),
          role: 'STUDENT',
          name: ['Aigerim K.', 'Marat S.', 'Dana T.', 'Timur A.'][idx],
          locale: 'ru',
        },
      }),
    ),
  );

  // Courses (+ modules, lessons, quizzes, reviews)
  const createdCourses: { id: string; slug: string }[] = [];
  for (let ci = 0; ci < COURSES.length; ci++) {
    const c = COURSES[ci];
    const nextVideo = makeVideoPicker(c.categorySlug);
    const durationMinutes = Math.round(
      c.modules.reduce(
        (sum, m) => sum + m.lessons.reduce((s, l) => s + l.durationSeconds, 0),
        0,
      ) / 60,
    );

    const course = await prisma.course.create({
      data: {
        title: c.title,
        slug: c.slug,
        description: c.description,
        categoryId: categoryBySlug.get(c.categorySlug)!,
        level: c.level,
        durationMinutes,
        instructorId: instructors[c.instructor].id,
        coverImageUrl: cover(c.slug),
        status: 'PUBLISHED',
        modules: {
          create: c.modules.map((m, mi) => ({
            title: m.title,
            order: mi + 1,
            lessons: {
              create: m.lessons.map((l, li) => ({
                title: l.title,
                order: li + 1,
                videoUrl: nextVideo(),
                durationSeconds: l.durationSeconds,
                isFreePreview: mi === 0 && li === 0,
              })),
            },
            quiz: {
              create: {
                title: m.quiz.title ?? `${m.title} — тест`,
                passingScore: m.quiz.passingScore ?? 60,
                questions: {
                  create: m.quiz.questions.map((q, qi) => ({
                    text: q.text,
                    order: qi + 1,
                    explanation: q.explanation,
                    options: {
                      create: q.options.map((o, oi) => ({
                        text: o.text,
                        isCorrect: !!o.correct,
                        order: oi + 1,
                      })),
                    },
                  })),
                },
              },
            },
          })),
        },
      },
    });
    createdCourses.push({ id: course.id, slug: course.slug });

    // Reviews → ratingAvg / ratingCount
    const ratings = REVIEW_RATINGS[ci % REVIEW_RATINGS.length];
    for (let ri = 0; ri < ratings.length; ri++) {
      await prisma.review.create({
        data: {
          courseId: course.id,
          userId: reviewers[ri % reviewers.length].id,
          rating: ratings[ri],
          comment: REVIEW_COMMENTS[(ci + ri) % REVIEW_COMMENTS.length],
        },
      });
    }
    const ratingAvg =
      Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
      10;
    await prisma.course.update({
      where: { id: course.id },
      data: { ratingAvg, ratingCount: ratings.length },
    });
  }

  // Pre-enroll the demo student in course #3 (Circular Economies): complete the
  // first module's lessons but NOT its quiz — so the learning + quiz loop is
  // demonstrable. Progress = (done lessons + passed quizzes) / (lessons + quizzes).
  const enrolledCourseId = createdCourses[2].id;
  const enrollment = await prisma.enrollment.create({
    data: { userId: student.id, courseId: enrolledCourseId, status: 'ACTIVE' },
  });

  const firstModule = await prisma.module.findFirst({
    where: { courseId: enrolledCourseId },
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
  for (const lesson of firstModule?.lessons ?? []) {
    await prisma.lessonProgress.create({
      data: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        completed: true,
        watchedSeconds: lesson.durationSeconds,
        completedAt: new Date(),
      },
    });
  }

  const [totalLessons, totalQuizzes, doneLessons] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId: enrolledCourseId } } }),
    prisma.quiz.count({ where: { module: { courseId: enrolledCourseId } } }),
    prisma.lessonProgress.count({
      where: { enrollmentId: enrollment.id, completed: true },
    }),
  ]);
  const units = totalLessons + totalQuizzes;
  const progressPercent =
    units === 0 ? 0 : Math.round((doneLessons / units) * 100);
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { progressPercent },
  });

  const totalQuizCount = await prisma.quiz.count();
  // eslint-disable-next-line no-console
  console.log(
    `Seed complete: ${CATEGORIES.length} categories, ${COURSES.length} courses, ` +
      `${totalQuizCount} module quizzes, ${instructors.length} instructors. ` +
      `Demo student enrolled in "${COURSES[2].title}" at ${progressPercent}% ` +
      `(module 1 lessons done, quiz pending).`,
  );
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
