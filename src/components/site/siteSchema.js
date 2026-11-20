// Site builder: section types, their editable fields, themes and starter templates.
// A site is { template, theme, settings, sections: [{ id, type, hidden, data }] }.
import { resolveProjectLanding } from '../../utils/projectLanding'

export const uid = () => Math.random().toString(36).slice(2, 10)

const link = (label, href) => ({ label, href })

// Field types: text, textarea, url, image, link, select, toggle, list (with `item` fields)
export const SECTION_TYPES = {
  nav: {
    label: 'Header', hint: 'Logo and menu at the top',
    fields: [
      { key: 'brand', label: 'Brand name', type: 'text' },
      { key: 'links', label: 'Menu links', type: 'list', addLabel: 'Add link', item: [{ key: 'label', label: 'Text', type: 'text' }, { key: 'href', label: 'Goes to', type: 'url' }] },
      { key: 'cta', label: 'Button', type: 'link' },
    ],
  },
  hero: {
    label: 'Hero', hint: 'Big headline and main button',
    fields: [
      { key: 'eyebrow', label: 'Small line above the headline', type: 'text' },
      { key: 'title', label: 'Headline', type: 'textarea', rows: 2 },
      { key: 'subtitle', label: 'Supporting text', type: 'textarea' },
      { key: 'cta', label: 'Main button', type: 'link' },
      { key: 'secondary', label: 'Second button', type: 'link' },
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'layout', label: 'Layout', type: 'select', options: [['split', 'Text left, image right'], ['center', 'Centered'], ['cover', 'Image behind text']] },
    ],
  },
  features: {
    label: 'Features', hint: 'What it does, in short points',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Intro', type: 'textarea' },
      { key: 'items', label: 'Features', type: 'list', addLabel: 'Add feature', item: [{ key: 'title', label: 'Feature', type: 'text' }, { key: 'text', label: 'Description', type: 'textarea' }] },
    ],
  },
  text: {
    label: 'Text', hint: 'A heading and a paragraph',
    fields: [
      { key: 'title', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea', rows: 6 },
      { key: 'image', label: 'Image (optional)', type: 'image' },
    ],
  },
  gallery: {
    label: 'Gallery', hint: 'A grid of images',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'images', label: 'Images', type: 'list', addLabel: 'Add image', item: [{ key: 'url', label: 'Image', type: 'image' }, { key: 'caption', label: 'Caption', type: 'text' }] },
    ],
  },
  video: {
    label: 'Video', hint: 'YouTube, Vimeo or Loom link',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'url', label: 'Video link', type: 'url', placeholder: 'https://youtube.com/watch?v=…' },
    ],
  },
  pricing: {
    label: 'Pricing', hint: 'Plans and prices',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Intro', type: 'textarea' },
      { key: 'plans', label: 'Plans', type: 'list', addLabel: 'Add plan', item: [
        { key: 'name', label: 'Plan name', type: 'text' },
        { key: 'price', label: 'Price', type: 'text' },
        { key: 'period', label: 'Per (e.g. month, one-time)', type: 'text' },
        { key: 'features', label: "What's included (one per line)", type: 'textarea' },
        { key: 'cta', label: 'Button', type: 'link' },
        { key: 'highlight', label: 'Highlight this plan', type: 'toggle' },
      ] },
    ],
  },
  testimonials: {
    label: 'Testimonials', hint: 'What people say',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Quotes', type: 'list', addLabel: 'Add quote', item: [{ key: 'quote', label: 'Quote', type: 'textarea' }, { key: 'name', label: 'Name', type: 'text' }, { key: 'role', label: 'Role or handle', type: 'text' }] },
    ],
  },
  faq: {
    label: 'FAQ', hint: 'Questions and answers',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'items', label: 'Questions', type: 'list', addLabel: 'Add question', item: [{ key: 'q', label: 'Question', type: 'text' }, { key: 'a', label: 'Answer', type: 'textarea' }] },
    ],
  },
  signup: {
    label: 'Email signup', hint: 'Collect emails (saved to your project)',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'button', label: 'Button text', type: 'text' },
      { key: 'success', label: 'Thank-you message', type: 'text' },
    ],
  },
  cta: {
    label: 'Call to action', hint: 'A closing banner with a button',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'button', label: 'Button', type: 'link' },
    ],
  },
  custom: {
    label: 'Custom (AI code)', hint: 'Describe anything; the AI builds it',
    fields: [
      { key: 'height', label: 'Height (px)', type: 'text' },
    ],
  },
  footer: {
    label: 'Footer', hint: 'Links and small print at the bottom',
    fields: [
      { key: 'text', label: 'Small print', type: 'text' },
      { key: 'links', label: 'Links', type: 'list', addLabel: 'Add link', item: [{ key: 'label', label: 'Text', type: 'text' }, { key: 'href', label: 'Goes to', type: 'url' }] },
    ],
  },
}

export const FONTS = {
  modern: { label: 'Modern', head: "'Inter', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", weight: 700 },
  editorial: { label: 'Editorial', head: "'Instrument Serif', Georgia, serif", body: "'Inter', system-ui, sans-serif", weight: 400 },
  classic: { label: 'Classic', head: "Georgia, 'Times New Roman', serif", body: "Georgia, 'Times New Roman', serif", weight: 700 },
}

export const ACCENTS = ['#c81e3c', '#2563eb', '#059669', '#7c3aed', '#ea580c', '#0f172a', '#db2777', '#0891b2']

const IMG = {
  saas: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
  product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=80',
  creator: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80',
  course: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1400&q=80',
  waitlist: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&q=80',
}

export const TEMPLATES = {
  launch: { label: 'Launch', desc: 'Software, apps and tools', theme: { mode: 'dark', font: 'modern' }, img: IMG.saas },
  product: { label: 'Product', desc: 'Physical products and kits', theme: { mode: 'light', font: 'classic' }, img: IMG.product },
  creator: { label: 'Creator', desc: 'Communities and personal brands', theme: { mode: 'light', font: 'editorial' }, img: IMG.creator },
  course: { label: 'Course', desc: 'Courses, cohorts and workshops', theme: { mode: 'light', font: 'editorial' }, img: IMG.course },
  waitlist: { label: 'Waitlist', desc: 'Apps not out yet: collect emails', theme: { mode: 'dark', font: 'modern' }, img: IMG.waitlist },
  minimal: { label: 'Minimal', desc: 'One clean page, no frills', theme: { mode: 'light', font: 'modern' }, img: '' },
}

const sec = (type, data, extra = {}) => ({ id: uid(), type, hidden: false, data, ...extra })

// Build a full starter site from the project's own concept, for the chosen template.
export function siteFromTemplate(project, templateId = 'launch') {
  const t = TEMPLATES[templateId] || TEMPLATES.launch
  const { concept, brandColor, creator } = resolveProjectLanding(project || {})
  const name = concept.name || project?.productName || 'Your product'
  const slug = project?.slug || project?.id || ''
  const preorder = slug ? `/preorder/${slug}` : '#signup'
  const features = (concept.keyFeatures || []).slice(0, 6).map((f) => (typeof f === 'string' ? { title: f, text: '' } : { title: f.title || f.name || '', text: f.description || f.text || '' }))
  const price = String(concept.pricing || '').match(/\$?\d[\d,.]*/)?.[0] || ''
  const image = concept.imageUrl || concept.image_url || t.img
  const by = creator.name ? `by ${creator.name}` : ''

  const hero = sec('hero', {
    eyebrow: templateId === 'creator' && by ? by : 'Now available',
    title: concept.tagline || name,
    subtitle: concept.problem ? `Built for ${concept.customer || 'people'} who are tired of ${String(concept.problem).replace(/\.$/, '').toLowerCase()}.` : `Meet ${name}.`,
    cta: link(price ? `Get it for ${price.startsWith('$') ? price : `$${price}`}` : 'Get early access', preorder),
    secondary: link('See how it works', '#features'),
    image,
    layout: templateId === 'product' ? 'split' : templateId === 'creator' ? 'center' : 'split',
  })
  const feat = sec('features', {
    title: templateId === 'product' ? "What's inside" : 'What you get',
    subtitle: '',
    items: features.length ? features : [{ title: 'Fast', text: 'Up and running in minutes.' }, { title: 'Simple', text: 'No learning curve.' }, { title: 'Yours', text: 'Built around how you work.' }],
  }, { anchor: 'features' })
  const faq = sec('faq', { title: 'Questions', items: [
    { q: `What is ${name}?`, a: concept.tagline || `${name} is ${by ? `made ${by}` : 'a new product'}.` },
    { q: 'When do I get it?', a: 'Right after you order. You get an email with everything you need.' },
    { q: 'Can I get a refund?', a: "Yes. If it isn't right for you, email us within 30 days." },
  ] })
  const close = sec('cta', { title: `Ready to try ${name}?`, text: '', button: link('Get started', preorder) })
  const nav = sec('nav', { brand: name, links: [link('Features', '#features'), link('FAQ', '#faq')], cta: link('Get started', preorder) })
  const footer = sec('footer', { text: `© ${new Date().getFullYear()} ${name}${by ? ` · ${by}` : ''}`, links: [] })

  const signup = sec('signup', { title: 'Get early access', text: `Be first to try ${name}. One email when it opens, nothing else.`, button: 'Join the waitlist', success: "You're on the list. We'll email you when it opens." }, { anchor: 'signup' })
  if (templateId === 'waitlist') {
    hero.data = { ...hero.data, eyebrow: 'Coming soon', cta: link('Join the waitlist', '#signup'), secondary: link('', ''), layout: 'center' }
    nav.data.cta = link('Join the waitlist', '#signup')
  }
  if (templateId === 'minimal') {
    hero.data = { ...hero.data, image: '', layout: 'center', secondary: link('', '') }
    nav.data.links = []
  }
  if (templateId === 'course') hero.data = { ...hero.data, eyebrow: by ? `A course ${by}` : 'Online course', layout: 'split' }

  const middle = templateId === 'waitlist'
    ? [feat, signup]
    : templateId === 'minimal'
      ? [sec('text', { title: `Why ${name}`, body: concept.problem || `${name} does one thing well.`, image: '' })]
      : templateId === 'course'
        ? [{ ...feat, data: { ...feat.data, title: "What you'll learn" } }, sec('text', { title: creator.name ? `Your teacher: ${creator.name}` : 'Who teaches it', body: concept.problem ? `I made this course because ${String(concept.problem).replace(/\.$/, '').toLowerCase()}.` : 'Learn from someone who does this every day.', image: creator.avatar_url || '' }), sec('pricing', { title: 'Enroll', subtitle: '', plans: [{ name: 'Full course', price: price || '$—', period: 'one-time', features: features.map((f) => f.title).join('\n'), cta: link('Enroll now', preorder), highlight: true }] }), sec('testimonials', { title: 'From students', items: [] }, { hidden: true })]
        : templateId === 'product'
    ? [feat, sec('gallery', { title: 'A closer look', images: [{ url: image, caption: '' }] }), sec('pricing', { title: 'Pricing', subtitle: '', plans: [{ name, price: price || '$—', period: 'one-time', features: features.map((f) => f.title).join('\n'), cta: link('Order now', preorder), highlight: true }] }), sec('testimonials', { title: 'What people say', items: [] }, { hidden: true })]
    : templateId === 'creator'
      ? [sec('text', { title: creator.name ? `Hi, I'm ${creator.name.split(' ')[0]}.` : 'Why I made this', body: concept.problem ? `I kept seeing the same problem: ${concept.problem}\n\nSo I built ${name}.` : `I built ${name} for my community.`, image: creator.avatar_url || '' }), feat, sec('signup', { title: 'Get updates', text: 'New lessons and early offers, straight to your inbox.', button: 'Join', success: "You're in. Check your inbox." })]
      : [feat, sec('video', { title: 'See it in action', url: '' }, { hidden: true }), sec('pricing', { title: 'Simple pricing', subtitle: '', plans: [{ name: 'Starter', price: price || '$—', period: concept.pricing && /month|mo\b/i.test(concept.pricing) ? 'month' : 'one-time', features: features.map((f) => f.title).join('\n'), cta: link('Get started', preorder), highlight: true }] })]

  return {
    version: 1,
    template: templateId,
    theme: { accent: brandColor || '#c81e3c', ...t.theme },
    settings: { title: `${name}${concept.tagline ? ` | ${concept.tagline}` : ''}`.slice(0, 70), description: (concept.tagline || '').slice(0, 160), logoUrl: '', faviconUrl: '' },
    sections: templateId === 'minimal' ? [nav, hero, ...middle, close, footer] : templateId === 'waitlist' ? [nav, hero, ...middle, faq, footer] : [nav, hero, ...middle, faq, close, footer],
  }
}

// Switch template: keep the creator's text and images, take the new look and any sections it adds.
export function applyTemplate(site, project, templateId) {
  const fresh = siteFromTemplate(project, templateId)
  const have = new Set((site?.sections || []).map((s) => s.type))
  const extra = fresh.sections.filter((s) => !have.has(s.type))
  const kept = (site?.sections || []).filter((s) => s.type !== 'footer')
  const footer = (site?.sections || []).find((s) => s.type === 'footer') || fresh.sections.find((s) => s.type === 'footer')
  return { ...site, template: templateId, theme: { ...site.theme, ...TEMPLATES[templateId].theme }, sections: [...kept, ...extra.filter((s) => s.type !== 'footer'), footer] }
}

export function newSection(type) {
  const d = {
    nav: { brand: 'Brand', links: [], cta: link('Get started', '#') },
    hero: { eyebrow: '', title: 'Your headline', subtitle: 'One sentence on why it matters.', cta: link('Get started', '#'), secondary: link('', ''), image: '', layout: 'center' },
    features: { title: 'Features', subtitle: '', items: [{ title: 'Feature', text: 'What it does for you.' }] },
    text: { title: 'Heading', body: 'Write something here.', image: '' },
    gallery: { title: 'Gallery', images: [] },
    video: { title: 'Watch', url: '' },
    pricing: { title: 'Pricing', subtitle: '', plans: [{ name: 'Plan', price: '$0', period: 'month', features: '', cta: link('Choose', '#'), highlight: false }] },
    testimonials: { title: 'What people say', items: [{ quote: 'This changed how I work.', name: 'Name', role: '' }] },
    faq: { title: 'Questions', items: [{ q: 'Question?', a: 'Answer.' }] },
    signup: { title: 'Stay in the loop', text: 'Get updates in your inbox.', button: 'Join', success: "Thanks, you're in." },
    cta: { title: 'Ready?', text: '', button: link('Get started', '#') },
    custom: { prompt: '', html: '', css: '', height: '480' },
    footer: { text: `© ${new Date().getFullYear()}`, links: [] },
  }[type]
  return sec(type, JSON.parse(JSON.stringify(d)))
}

// Only allow http(s), mailto, tel, in-page (#) and site-relative links.
export function safeHref(h) {
  const v = String(h || '').trim()
  if (!v) return undefined
  if (/^(https?:|mailto:|tel:)/i.test(v) || v.startsWith('#') || (v.startsWith('/') && !v.startsWith('//'))) return v
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(v)) return `https://${v}`
  return undefined
}
export const safeImg = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '')

export function videoEmbed(url) {
  const u = String(url || '')
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`
  m = u.match(/vimeo\.com\/(\d+)/)
  if (m) return `https://player.vimeo.com/video/${m[1]}`
  m = u.match(/loom\.com\/share\/([\w-]+)/)
  if (m) return `https://www.loom.com/embed/${m[1]}`
  return ''
}

// ── Extra pages (About, Terms, …) ──────────────────────────────────────────────────────────────────
// site.pages = [{ id, title, path, menu: 'header'|'footer'|'none', sections }]. Extra pages share the
// home page's header and footer, like a WordPress theme.
export const PAGE_KINDS = {
  about: { label: 'About', menu: 'header', make: (name) => [
    sec('text', { title: `About ${name}`, body: `Tell the story behind ${name}: who it's for, why you made it and what you care about.`, image: '' }),
    sec('features', { title: 'What we believe', subtitle: '', items: [{ title: 'Value 1', text: '' }, { title: 'Value 2', text: '' }, { title: 'Value 3', text: '' }] }),
  ] },
  contact: { label: 'Contact', menu: 'header', make: (name) => [
    sec('text', { title: 'Get in touch', body: `Questions about ${name}? Email us at hello@example.com and we'll reply within one working day.`, image: '' }),
    sec('signup', { title: 'Stay in the loop', text: 'News and offers, now and then.', button: 'Join', success: "Thanks, you're in." }),
  ] },
  terms: { label: 'Terms', menu: 'footer', make: (name) => [
    sec('text', { title: 'Terms of service', body: `These terms apply when you buy or use ${name}.\n\n1. What you get\nDescribe the product and how it's delivered.\n\n2. Payments and refunds\nState prices, billing and your refund window.\n\n3. Acceptable use\nWhat customers may and may not do.\n\n4. Liability\nLimits of your responsibility.\n\n5. Contact\nHow to reach you about these terms.\n\nReplace this text with terms that fit your business. If unsure, ask a lawyer.`, image: '' }),
  ] },
  privacy: { label: 'Privacy', menu: 'footer', make: (name) => [
    sec('text', { title: 'Privacy policy', body: `This explains what ${name} collects and why.\n\nWhat we collect\nYour email when you sign up or order, and basic usage data.\n\nHow we use it\nTo deliver the product, send updates you asked for and improve the service.\n\nWho we share it with\nOnly the services needed to run the business (payments, email). We never sell your data.\n\nYour choices\nEmail us any time to see, change or delete your data.\n\nReplace this text with a policy that fits your business.`, image: '' }),
  ] },
  blank: { label: 'Blank page', menu: 'none', make: () => [sec('text', { title: 'New page', body: 'Write something here.', image: '' })] },
}

export const slugPath = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'page'

export function newPage(kind, site, name) {
  const k = PAGE_KINDS[kind] || PAGE_KINDS.blank
  const taken = new Set((site.pages || []).map((p) => p.path))
  let path = slugPath(kind === 'blank' ? 'page' : k.label); let n = 2
  while (taken.has(path)) { path = `${slugPath(k.label)}-${n}`; n += 1 }
  return { id: uid(), title: kind === 'blank' ? 'New page' : k.label, path, menu: k.menu, sections: k.make(name || 'this product') }
}

// What to render for a page: home as-is; extra pages get the home header and footer around their sections.
export function pageView(site, pageId) {
  if (!site) return site
  const page = pageId && pageId !== 'home' ? (site.pages || []).find((p) => p.id === pageId) : null
  if (!page) return site
  const nav = (site.sections || []).find((s) => s.type === 'nav' && !s.hidden)
  const foot = (site.sections || []).find((s) => s.type === 'footer' && !s.hidden)
  return { ...site, sections: [...(nav ? [{ ...nav, _shared: true }] : []), ...(page.sections || []), ...(foot ? [{ ...foot, _shared: true }] : [])], _page: page }
}
