# What You Can Edit From the Admin Panel

Every piece of text, every icon and every button on the public site is editable
at **/admin** — nothing on the front end is hardcoded any more.

Log in at `/admin`, then use **Page Sections** for page copy and **Site
Settings** for anything site-wide.

---

## Page Sections

Sections are grouped by where they appear. Open a group, expand a block, edit,
and press **Save Changes**.

Each block has the same seven fields. You only fill in the ones that block uses:

| Field | What it controls |
| --- | --- |
| **Title** | The main heading of the block. |
| **Subtitle** | The small coloured label that sits above the heading. |
| **Content** | The body paragraph. Press Enter twice for a new paragraph. |
| **Button Text** | The button label. **Leave blank to hide the button entirely.** |
| **Button Link** | Where the button goes, e.g. `/contact.html`. |
| **Icon** | A [Font Awesome](https://fontawesome.com/search?o=r&m=free) class, e.g. `fas fa-award`. |
| **Image** | Paste an image URL, or press the upload button to upload one. |

### Homepage
| Block | Where it shows |
| --- | --- |
| `Hero` | The big headline and subtitle over the slider, plus the first button. |
| `Hero Secondary Button` | The second hero button ("Contact Us"). |
| `About Preview` | The "About Us" block, including its **Learn More** button. |
| `Products Header` | The "Our Products" heading and the **View All Products** button. |
| `Features Header` | The "Why Choose Us" heading. |
| `Feature Quality` / `Sustainable` / `Fresh` / `Delivery` | The four cards — heading, text and **icon**. |
| `Testimonials Header` | The "What Our Clients Say" heading. |
| `News Header` | The "From Our Blog" heading and **View All News** button. |
| `Cta Section` | The closing call-to-action band. |

### Page Headers
The banner at the top of each inner page: `Page Header About`, `Products`,
`Team`, `News`, `Gallery` and `Contact`. **Title** is the big heading,
**Content** is the line underneath.

### About Page
| Block | Where it shows |
| --- | --- |
| `About Story` | The "Our Story" text block. |
| `About Mission` / `About Vision` | The two cards, including their icons. |
| `About Values Header` | The "What Drives Us" heading. |
| `About Value 1`–`4` | The four value cards — heading, text and icon. |
| `About Certifications Header` | The certifications heading. |
| `About Cert 1`–`4` | The four badges. **Title** is the code inside the circle (e.g. `HACCP`), **Content** is the caption below it. |
| `About Cta` | The closing call-to-action. |

### Other pages
- **Products Page** — `Products Cta`
- **Team Page** — `Team Header`
- **Contact Page** — `Contact Info Header`, `Contact Form Header`
- **Footer** — `Footer About`, `Footer Quicklinks`, `Footer Products`,
  `Footer Newsletter`, `Footer Tagline`

---

## Site Settings

- **Site name, tagline and logo** — the logo also becomes the browser favicon.
- **Contact email, phone and address** — shown on the Contact page and footer.
- **Google Maps Embed URL** — in Google Maps choose *Share → Embed a map* and
  paste only the `src` URL. **Leave blank to hide the map section.**
- **Social links** — Facebook, Twitter, Instagram, LinkedIn.
- **Footer text** — the copyright line.
- **Hero Wave Animation Style** — Realistic or Classic waves at the bottom of
  the homepage hero.

### Intro Animation
The full-screen wave intro on the **home page**. It replays on every reload of
the home page; inner pages never show it.

- **Show Intro Animation** — On or Off.
- **Play Frequency** — *Every page load* (default) replays it on each home-page
  reload; *Once per visit* shows it only the first time in a browsing session.
- **Duration** — how long it runs, in milliseconds. 3200 ≈ 3.2 seconds.
- **Intro Tagline** — the line that surfaces under the logo.

> Settings are cached in the visitor's browser, so a change to the intro takes
> effect on their **next** page load rather than the current one.

---

## Content managed elsewhere in the panel

These have their own sections in the sidebar, with full add/edit/delete:

**Homepage Slider** · **Homepage Images** · **Products** · **Categories** ·
**Team** · **Testimonials** · **News** · **Gallery**

Contact form submissions and newsletter subscribers are also listed there.

---

## Tips

- Content is saved as plain text. Line breaks are preserved; HTML tags are not
  rendered, they appear as literal text.
- To hide any button, clear its **Button Text** and save.
- Uploading an image only fills the field — you still need to press
  **Save Changes** for it to stick.
- If an edit doesn't appear, hard-refresh the page (Ctrl+F5).
