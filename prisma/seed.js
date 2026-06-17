/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

async function main() {
  // --- Admin account (from .env) -------------------------------------------
  const email = process.env.ADMIN_EMAIL || 'admin@delzotto.com';
  const password = process.env.ADMIN_PASSWORD || 'admin1234';
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  console.log(`Admin ready: ${email}`);

  // --- Reset content tables (idempotent re-seed) ---------------------------
  await prisma.projectImage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projectSubcategory.deleteMany();
  await prisma.job.deleteMany();
  await prisma.location.deleteMany();
  await prisma.supplyProductField.deleteMany();
  await prisma.supplyProduct.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.deliveryQuote.deleteMany();
  await prisma.galleryImage.deleteMany();

  // --- Project subcategories (under the 2 FIXED categories) -----------------
  const batchPlants = await prisma.projectSubcategory.create({
    data: { categorySlug: 'commercial-concrete', name: 'Batch Plants', slug: 'batch-plants', sortOrder: 1 },
  });
  await prisma.projectSubcategory.create({
    data: { categorySlug: 'residential-concrete', name: 'Driveways & Slabs', slug: 'driveways-slabs', sortOrder: 1 },
  });

  // --- Projects (under "Batch Plants" subcategory) -------------------------
  const projects = [
    {
      title: 'Ocala Plant (Batch Plant)',
      description:
        'A full-scale ready-mix batch plant built to serve Marion County and the surrounding region with high-volume, on-demand concrete production.',
      tag: 'Architecture',
      year: '2025',
      jobName: 'Ocala Plant (Batch Plant)',
      location: 'Ocala, FL',
      projectSize: '63,000 sq. ft.',
      thumbnail: '/assets/pro-2.jpg',
      images: [
        { url: '/assets/pro-2.jpg', alt: 'Ocala Plant Slide 1' },
        { url: '/assets/nested-slide2.jpg', alt: 'Ocala Plant Slide 2' },
      ],
    },
    {
      title: 'Homosassa Plant',
      description:
        'Our Homosassa facility expands ready-mix capacity along the Nature Coast, supporting both residential and commercial pours.',
      tag: 'Architecture',
      year: '2025',
      jobName: 'Homosassa Plant',
      location: 'Homosassa, FL',
      projectSize: '40,000 sq. ft.',
      thumbnail: '/assets/pro-1.jpg',
      images: [
        { url: '/assets/pro-1.jpg', alt: 'Homosassa Plant Slide 1' },
        { url: '/assets/nested-slide-1.jpg', alt: 'Homosassa Plant Slide 2' },
      ],
    },
    {
      title: 'Ocala Plant',
      description: 'Additional batch capacity at our flagship Ocala site.',
      tag: 'Architecture',
      year: '2025',
      jobName: 'Ocala Plant',
      location: 'Ocala, FL',
      projectSize: '52,000 sq. ft.',
      thumbnail: '/assets/pro-3.jpg',
      images: [{ url: '/assets/pro-3.jpg', alt: 'Ocala Plant' }],
    },
  ];

  let order = 1;
  for (const p of projects) {
    const { images, ...data } = p;
    await prisma.project.create({
      data: {
        ...data,
        sortOrder: order++,
        subcategoryId: batchPlants.id,
        images: { create: images.map((img, i) => ({ ...img, sortOrder: i })) },
      },
    });
  }
  console.log('Subcategories + projects seeded.');

  // --- Reinforcing & Supplies catalog --------------------------------------
  const REBAR_SIZES = [
    '#3 Rebar (3/8" Grade 40)', '#4 Rebar (1/2" Grade 60)', '#5 Rebar (5/8" Grade 60)',
    '#6 Rebar (3/4" Grade 60)', '#7 Rebar (7/8" Grade 60)', '#8 Rebar (1" Grade 60)',
    '#9 Rebar (1.128" Grade 60)', '#10 Rebar (1.270" Grade 60)',
  ];
  const REBAR_LENGTHS = [
    "20' Available in Stock", "18' Custom Cut", "16' Custom Cut", "14' Custom Cut", "12' Custom Cut",
    "10' Custom Cut", "8' Custom Cut", "6' Custom Cut", "4' Custom Cut", "2' Custom Cut",
  ];
  const supplies = [
    {
      title: 'Corner Bars & Dowels', image: '/assets/drop-1.jpg',
      fields: [
        { label: 'Select Rebar Size', inputType: 'select', options: REBAR_SIZES },
        { label: 'Rebar Length', inputType: 'select', options: REBAR_LENGTHS },
        { label: 'Rebar Quantity (Pieces)', inputType: 'number', placeholder: 'How many pieces of rebar?', helper: 'Describe any custom length or quantity needs your job has.' },
      ],
    },
    {
      title: 'Wire Mesh', image: '/assets/drop-2.jpg',
      fields: [
        { label: '5\' X 150\' Roll of 6" X 6" Wire Mesh', inputType: 'number', placeholder: 'How many rolls of mesh?' },
        { label: '8\' X 20\' Sheets of 10 Gauge 6" X 6" Wire Mesh', inputType: 'number', placeholder: 'How many sheets?' },
      ],
    },
    {
      title: 'Foundation Chairs', image: '/assets/drop-3.jpg',
      fields: [
        { label: '2-Rod Foundation Chairs', inputType: 'number', placeholder: 'How Many Packs of 100?' },
        { label: '3-Rod Foundation Chairs', inputType: 'number', placeholder: 'How Many Packs of 100?' },
      ],
    },
    {
      title: 'Tie Wire & Tools', image: '/assets/drop-4.jpg',
      fields: [
        { label: '6" 17 Gauge Bar Ties', inputType: 'number', placeholder: 'How many 4-packs of 1000?' },
        { label: 'Auto Tie-Wire Twisters', inputType: 'number', placeholder: 'How many?' },
      ],
    },
    {
      title: 'Poly', image: '/assets/drop-5.jpg',
      fields: [
        { label: "6-Mil 20' X 100' Clear Poly Film", inputType: 'number', placeholder: 'How many rolls?' },
        { label: 'Rolls of Red Poly Tape', inputType: 'number', placeholder: 'How many rolls?' },
      ],
    },
    {
      title: 'Anchor Bolts', image: '/assets/drop-6.jpg',
      fields: [
        { label: '1/2" X 6" Anchor Bolts W/Washer & Nuts', inputType: 'number', placeholder: 'How many boxes of 50?' },
        { label: '1/2" X 10" Anchor Bolts W/Washer & Nuts', inputType: 'number', placeholder: 'How many boxes of 50?' },
      ],
    },
    {
      title: 'Expansion Joints', image: '/assets/drop-7.jpg',
      fields: [
        { label: '1/2" X 3-1/2" X 10\' Black Expansion Joint', inputType: 'number', placeholder: 'How many packages of 10?' },
      ],
    },
    {
      title: 'Curing Compound & Sprayers', image: '/assets/drop-8.jpg',
      fields: [
        { label: '5-Gallon Pail of Curing Compound', inputType: 'number', placeholder: 'How many pails?' },
        { label: 'Industrial Concrete Sprayer', inputType: 'number', placeholder: 'How many sprayers?' },
      ],
    },
  ];
  let sOrder = 1;
  for (const s of supplies) {
    const { fields, ...data } = s;
    await prisma.supplyProduct.create({
      data: {
        ...data,
        sortOrder: sOrder++,
        fields: {
          create: fields.map((f, i) => ({
            label: f.label,
            inputType: f.inputType,
            placeholder: f.placeholder ?? null,
            helper: f.helper ?? null,
            options: f.options ?? undefined,
            sortOrder: i,
          })),
        },
      },
    });
  }
  console.log('Supplies catalog seeded.');

  // --- Blogs ----------------------------------------------------------------
  const blogs = [
    { title: 'How to Calculate the Right Amount of Concrete for Your Project', date: '11 May, 2026', coverImage: '/assets/slide1.png' },
    { title: "5 Signs It's Time to Replace Your Concrete Driveway", date: '16 May, 2026', coverImage: '/assets/pro-1.jpg' },
    { title: 'Choosing the Right Concrete Mix for Commercial Projects', date: '21 May, 2026', coverImage: '/assets/pro-2.jpg' },
    { title: 'Preparing Your Site Before a Concrete Delivery', date: '22 May, 2026', coverImage: '/assets/pro-3.jpg' },
    { title: 'Common Mistakes to Avoid During Concrete Placement', date: '24 May, 2026', coverImage: '/assets/gallery-4.jpg' },
    { title: 'Residential Concrete Ideas to Enhance Curb Appeal', date: '27 May, 2026', coverImage: '/assets/gallery-5.jpg' },
    { title: 'Why Contractors Trust Local Ready-Mix Suppliers', date: '30 May, 2026', coverImage: '/assets/gallery-6.jpg' },
  ];
  let bOrder = 1;
  for (const b of blogs) {
    await prisma.blog.create({
      data: {
        title: b.title,
        slug: slugify(b.title),
        date: b.date,
        coverImage: b.coverImage,
        author: 'Del Zotto Concrete',
        excerpt: 'Practical guidance and updates from the Del Zotto Concrete team.',
        content:
          'Del Zotto Concrete shares practical, field-tested guidance to help you plan and complete your concrete project with confidence.\n\nFrom estimating volume to choosing the right mix and preparing your site, our team brings decades of ready-mix experience to every pour.\n\nHave a question about your project? Reach out to our team and we will be glad to help.',
        sortOrder: bOrder++,
      },
    });
  }
  console.log('Blogs seeded.');

  // --- Jobs ----------------------------------------------------------------
  await prisma.job.createMany({
    data: [
      {
        title: 'Production Laborer',
        category: 'labor',
        location: 'Ocala',
        employmentType: 'Full-time',
        shortDescription:
          'Del Zotto Concrete is seeking a hardworking and reliable Production Laborer to support our concrete production team. This role helps with the production, finishing, handling, and preparation of concrete products while maintaining a clean, safe, and efficient work environment.',
        fullDescription:
          'Del Zotto Concrete is seeking a hardworking and reliable Production Laborer to support our concrete production team. This role helps with the production, finishing, handling, and preparation of concrete products while maintaining a clean, safe, and efficient work environment.\n\nResponsibilities include operating production equipment, maintaining a clean work area, and following all safety protocols.',
        sortOrder: 1,
      },
      {
        title: 'Truck Driver',
        category: 'drive',
        location: 'Ocala',
        employmentType: 'Full-time',
        shortDescription:
          'Del Zotto Concrete is looking for a dependable and safety-focused Truck Driver to join our team. This position is responsible for transporting materials, products, and equipment to job sites and customer locations while maintaining safe driving practices, accurate records, and professional communication.',
        fullDescription:
          'Del Zotto Concrete is looking for a dependable and safety-focused Truck Driver to join our team. This position is responsible for transporting materials, products, and equipment to job sites and customer locations while maintaining safe driving practices, accurate records, and professional communication.\n\nA valid CDL and clean driving record are required.',
        sortOrder: 2,
      },
    ],
  });
  console.log('Jobs seeded.');

  // --- Locations -----------------------------------------------------------
  await prisma.location.createMany({
    data: [
      {
        city: 'Ocala',
        badge: 'Headquarters',
        badgeType: 'hq',
        address: '3260 NW Gainesville Rd Ocala, FL 34475',
        hours: 'Mon–Fri 7am–5pm · Sat 7am–12pm',
        serviceArea: 'Serving Marion County & surroundings',
        phone: '(352) 640-2903',
        mapEmbedUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3482.095299059141!2d-82.15195722369872!3d29.220751257125087!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e62b6d4f57bafd%3A0xb9352497a857b69d!2s3260%20NW%20Gainesville%20Rd%2C%20Ocala%2C%20FL%2034475%2C%20USA!5e0!3m2!1sen!2sin!4v1781258456835!5m2!1sen!2sin',
        sortOrder: 1,
      },
      {
        city: 'Crystal River',
        badge: 'New Location',
        badgeType: 'new',
        address: '8778 S Jump Ct, Homosassa, FL 34448',
        hours: 'Mon–Fri 7am–5pm · Sat 7am–12pm',
        serviceArea: 'Serving Marion County & surroundings',
        phone: '(352) 621-3900',
        mapEmbedUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3495.8127933417622!2d-82.58204572370876!3d28.8146521757857!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e83fc114cb7f91%3A0x221a6147a3aee497!2s8778%20S%20Jump%20Ct%2C%20Homosassa%2C%20FL%2034448%2C%20USA!5e0!3m2!1sen!2sin!4v1781258420057!5m2!1sen!2sin',
        sortOrder: 2,
      },
      {
        city: 'Dunnellon',
        badge: 'New Location',
        badgeType: 'new',
        address: '3260 NW Gainesville Rd Ocala, FL 34475',
        hours: 'Mon–Fri 7am–5pm · Sat 7am–12pm',
        serviceArea: 'Serving Marion County & surroundings',
        phone: '(352) 640-2903',
        mapEmbedUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3482.095299059141!2d-82.15195722369872!3d29.220751257125087!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e62b6d4f57bafd%3A0xb9352497a857b69d!2s3260%20NW%20Gainesville%20Rd%2C%20Ocala%2C%20FL%2034475%2C%20USA!5e0!3m2!1sen!2sin!4v1781258456835!5m2!1sen!2sin',
        sortOrder: 3,
      },
    ],
  });
  console.log('Locations seeded.');

  // --- Gallery photos (order = placement in the fixed grid layout) ----------
  const galleryImages = [
    '/assets/gallery-13.jpg',        // big left
    '/assets/gallery-1.jpg',         // small left x4
    '/assets/gallery-15.jpg',
    '/assets/hero-right-mini-3.jpg',
    '/assets/hero-right-mini-4.jpg',
    '/assets/slide1.png',            // small right x4
    '/assets/del-slide2.jpg',
    '/assets/del-slide3.jpg',
    '/assets/gallery-10.jpg',
    '/assets/hero-bg.jpg',           // big right
  ];
  await prisma.galleryImage.createMany({
    data: galleryImages.map((url, i) => ({ url, alt: 'Gallery Image', sortOrder: i })),
  });
  console.log('Gallery photos seeded.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
