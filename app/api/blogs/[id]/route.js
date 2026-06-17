import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: a single blog by id or slug (blog-view.html).
export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const where = /^\d+$/.test(id) ? { id: Number(id) } : { slug: id };
  const blog = await prisma.blog.findUnique({ where });
  if (!blog) return error('Blog not found', 404);
  return json(blog);
});

// Admin: update a blog post.
export const PUT = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  const blog = await prisma.blog.update({
    where: { id: Number(id) },
    data: {
      title: body.title,
      slug: body.slug,
      coverImage: body.coverImage,
      date: body.date,
      excerpt: body.excerpt,
      content: body.content,
      author: body.author,
      isPublished: body.isPublished,
      sortOrder: body.sortOrder,
    },
  });
  return json(blog);
});

// Admin: delete a blog post.
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.blog.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
