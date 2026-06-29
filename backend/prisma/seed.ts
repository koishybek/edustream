import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Public sample MP4s (Google's gtv-videos bucket) for the lesson player.
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

let videoCursor = 0;
const nextVideo = () => SAMPLE_VIDEOS[videoCursor++ % SAMPLE_VIDEOS.length];
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/800/450`;
const hash = (pw: string) => bcrypt.hash(pw, 10);

interface LessonSeed {
  title: string;
  durationSeconds: number;
}
interface ModuleSeed {
  title: string;
  lessons: LessonSeed[];
}
interface CourseSeed {
  title: string;
  slug: string;
  description: string;
  categorySlug: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  priceCents: number;
  instructor: number; // index into instructors[]
  modules: ModuleSeed[];
}

const CATEGORIES = [
  { name: 'Climate Action', slug: 'climate', icon: 'globe' },
  { name: 'Water Security', slug: 'water', icon: 'droplet' },
  { name: 'Circular Economy', slug: 'circular-economy', icon: 'recycle' },
  { name: 'ESG Reporting', slug: 'esg-reporting', icon: 'bar-chart' },
  { name: 'Biodiversity', slug: 'biodiversity', icon: 'leaf' },
  { name: 'Social Equity', slug: 'social', icon: 'users' },
];

const COURSES: CourseSeed[] = [
  {
    title: 'Corporate Sustainability Strategy: From Principles to Practice',
    slug: 'corporate-sustainability-strategy',
    description:
      'Master the frameworks and practical tools needed to integrate ESG metrics into core business strategy and drive meaningful environmental impact.',
    categorySlug: 'esg-reporting',
    level: 'INTERMEDIATE',
    priceCents: 14900000,
    instructor: 0,
    modules: [
      {
        title: 'Introduction to Modern ESG',
        lessons: [
          { title: 'What ESG means in 2026', durationSeconds: 720 },
          { title: 'The business case for sustainability', durationSeconds: 900 },
          { title: 'Stakeholders vs shareholders', durationSeconds: 660 },
        ],
      },
      {
        title: 'Carbon Accounting Fundamentals',
        lessons: [
          { title: 'Scopes 1, 2 and 3 explained', durationSeconds: 1080 },
          { title: 'Building your first inventory', durationSeconds: 1200 },
          { title: 'Setting science-based targets', durationSeconds: 840 },
        ],
      },
      {
        title: 'Supply Chain Transparency',
        lessons: [
          { title: 'Mapping your value chain', durationSeconds: 960 },
          { title: 'Supplier engagement at scale', durationSeconds: 780 },
        ],
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
    priceCents: 29900000,
    instructor: 1,
    modules: [
      {
        title: 'The Reporting Landscape',
        lessons: [
          { title: 'GRI, SASB and TCFD', durationSeconds: 1020 },
          { title: 'The EU CSRD in practice', durationSeconds: 1140 },
          { title: 'Choosing a framework', durationSeconds: 720 },
        ],
      },
      {
        title: 'Materiality & Assurance',
        lessons: [
          { title: 'Double materiality assessments', durationSeconds: 1260 },
          { title: 'Preparing for external assurance', durationSeconds: 900 },
          { title: 'Avoiding greenwashing claims', durationSeconds: 840 },
        ],
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
    priceCents: 19900000,
    instructor: 2,
    modules: [
      {
        title: 'Foundations',
        lessons: [
          { title: 'Linear vs circular models', durationSeconds: 720 },
          { title: 'Designing for disassembly', durationSeconds: 1080 },
          { title: 'Case study: The Edge, Amsterdam', durationSeconds: 960 },
        ],
      },
      {
        title: 'Regenerative Systems',
        lessons: [
          { title: 'Material passports', durationSeconds: 840 },
          { title: 'Regenerative urban planning', durationSeconds: 1440 },
          { title: 'Measuring circularity', durationSeconds: 780 },
        ],
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
    priceCents: 14900000,
    instructor: 0,
    modules: [
      {
        title: 'Energy Basics',
        lessons: [
          { title: 'From fossil fuels to electrons', durationSeconds: 660 },
          { title: 'Solar PV fundamentals', durationSeconds: 900 },
          { title: 'Wind, on- and offshore', durationSeconds: 840 },
        ],
      },
      {
        title: 'The Clean Grid',
        lessons: [
          { title: 'Storage and batteries', durationSeconds: 1020 },
          { title: 'Balancing supply and demand', durationSeconds: 780 },
        ],
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
    priceCents: 19900000,
    instructor: 2,
    modules: [
      {
        title: 'Defining Impact',
        lessons: [
          { title: 'Outputs vs outcomes vs impact', durationSeconds: 840 },
          { title: 'Theory of change', durationSeconds: 960 },
          { title: 'Choosing indicators', durationSeconds: 720 },
        ],
      },
      {
        title: 'Measurement in Practice',
        lessons: [
          { title: 'Survey design that works', durationSeconds: 1080 },
          { title: 'Reporting to stakeholders', durationSeconds: 660 },
        ],
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
    priceCents: 34900000,
    instructor: 0,
    modules: [
      {
        title: 'Instruments',
        lessons: [
          { title: 'Green and sustainability-linked bonds', durationSeconds: 1140 },
          { title: 'ESG integration in portfolios', durationSeconds: 1260 },
          { title: 'Taxonomies and labels', durationSeconds: 840 },
        ],
      },
      {
        title: 'Risk & Return',
        lessons: [
          { title: 'Pricing climate risk', durationSeconds: 1020 },
          { title: 'Transition vs physical risk', durationSeconds: 900 },
        ],
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
    priceCents: 17900000,
    instructor: 1,
    modules: [
      {
        title: 'The Water Crisis',
        lessons: [
          { title: 'Watersheds and scarcity', durationSeconds: 780 },
          { title: 'The Aral Sea, a cautionary tale', durationSeconds: 1080 },
          { title: 'Water footprints', durationSeconds: 720 },
        ],
      },
      {
        title: 'Solutions',
        lessons: [
          { title: 'Efficient irrigation', durationSeconds: 900 },
          { title: 'Reuse and desalination', durationSeconds: 960 },
        ],
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
    priceCents: 12900000,
    instructor: 2,
    modules: [
      {
        title: 'Nature & Risk',
        lessons: [
          { title: 'Ecosystem services 101', durationSeconds: 720 },
          { title: 'The TNFD framework', durationSeconds: 1020 },
          { title: 'Nature-related dependencies', durationSeconds: 840 },
        ],
      },
      {
        title: 'Taking Action',
        lessons: [
          { title: 'Nature-positive strategies', durationSeconds: 900 },
          { title: 'Restoration and offsets', durationSeconds: 780 },
        ],
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
  'The case studies alone are worth the price.',
];

async function main() {
  // Clean (FK-safe order) so the seed is re-runnable.
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
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

  // Courses (+ modules, lessons, reviews)
  const createdCourses: { id: string; slug: string }[] = [];
  for (let ci = 0; ci < COURSES.length; ci++) {
    const c = COURSES[ci];
    const durationMinutes = Math.round(
      c.modules.reduce(
        (sum, m) =>
          sum + m.lessons.reduce((s, l) => s + l.durationSeconds, 0),
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
        priceCents: c.priceCents,
        currency: 'KZT',
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

  // Pre-enroll the demo student in course #3 (Circular Economies) with partial
  // progress: complete the whole first module.
  const enrolledCourseId = createdCourses[2].id;
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: enrolledCourseId,
      status: 'ACTIVE',
    },
  });

  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId: enrolledCourseId } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });
  const completedCount = Math.min(3, lessons.length); // first module
  for (let i = 0; i < lessons.length; i++) {
    const done = i < completedCount;
    await prisma.lessonProgress.create({
      data: {
        enrollmentId: enrollment.id,
        lessonId: lessons[i].id,
        completed: done,
        watchedSeconds: done ? lessons[i].durationSeconds : 0,
        completedAt: done ? new Date() : null,
      },
    });
  }
  const progressPercent = Math.round((completedCount / lessons.length) * 100);
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { progressPercent },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Seed complete: ${CATEGORIES.length} categories, ${COURSES.length} courses, ` +
      `${instructors.length} instructors, demo student enrolled in ` +
      `"${COURSES[2].title}" at ${progressPercent}%.`,
  );
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
