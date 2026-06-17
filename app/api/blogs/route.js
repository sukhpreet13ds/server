import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: published blogs (blogs.html). Admin (?all=1) includes drafts.
export const GET = handler(async (request) => {
  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get('all') === '1';
  const blogs = await prisma.blog.findMany({
    where: includeUnpublished ? {} : { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return json(blogs);
});

// Admin: create a blog post.
export const POST = handler(async (request) => {
  requireAdmin(request);
  const body = await request.json();
  if (!body.title || !body.slug) return error('title and slug are required');
  const blog = await prisma.blog.create({
    data: {
      title: body.title,
      slug: body.slug,
      coverImage: body.coverImage ?? null,
      date: body.date ?? null,
      excerpt: body.excerpt ?? null,
      content: body.content ?? null,
      author: body.author ?? null,
      isPublished: body.isPublished ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return json(blog, { status: 201 });
});
