# Product Feature block — metafield setup guide

The **Product feature** block (`blocks/ai_gen_block_83dce0d.liquid`) is now fully
product-driven. You pick a product in the theme editor and everything populates
automatically from that product and its metafields — no content is stored in the
block anymore.

Data that comes straight from the product needs **no setup**:

| In the design | Source (automatic) |
|---|---|
| Main image + thumbnail gallery | Product media / images |
| Product title | `product.title` |
| Breadcrumb | `Home / {first collection} / {product type}` |
| Price / compare-at / sale | Selected variant price |
| Pack cards | One card per product **variant** (label, price, compare, savings %) |
| Add to cart / sold-out / unavailable | Variant availability via the theme's ajax cart + cart drawer |
| Description box | `product.description` (unless `custom.short_description` is set) |

Everything else is optional and comes from **product metafields** in the
`custom` namespace. Create the definitions below in
**Shopify admin → Settings → Custom data → Products**. Each block will simply
hide the corresponding piece if the metafield is empty.

## 1. Simple product metafields

Create each as a **Product** metafield with namespace/key exactly as shown:

| Name | Namespace and key | Type |
|---|---|---|
| Subtitle | `custom.subtitle` | Single line text |
| Short description | `custom.short_description` | Multi-line text |
| Quote | `custom.quote` | Multi-line text |
| Promo badge | `custom.promo_badge` | Single line text |
| Footer note | `custom.footer_note` | Single line text |
| Price note | `custom.price_note` | Single line text |
| Rating value | `custom.rating_value` | Decimal |
| Review count | `custom.review_count` | Integer |
| Tag pills | `custom.tag_pills` | Single line text — **List of** |
| Feature badges | `custom.feature_badges` | Single line text — **List of** |

> For "List of" types, choose the list variant when creating the definition, then
> add each pill/badge as its own list entry on the product.

## 2. Certifications (metaobject)

1. **Settings → Custom data → Metaobjects → Add definition.** Name it
   **Certification** (type/handle `certification`). Add fields:
   - `label` — Single line text
   - `value` — Single line text
   - `icon` — File (optional; not shown in the current design)
2. Create one **Certification** entry per certification (e.g. label `ISO 9001`,
   value `VALID JUL 2026`).
3. Create a **Product** metafield **`custom.certifications`**, type
   **Metaobject → Certification → List of**. On each product, add the
   certifications you want to show.

## 3. Accordion items (metaobject)

1. Add a metaobject definition **Accordion item** (handle `accordion_item`) with:
   - `title` — Single line text
   - `content` — Rich text
2. Create one entry per accordion row (Description, Ingredients, How to use,
   Cautions, …). The merchant can add **unlimited** items.
3. Create a **Product** metafield **`custom.accordion_items`**, type
   **Metaobject → Accordion item → List of**, and add the items in the order you
   want them displayed.

## Field-name contract

The Liquid reads these exact metaobject field keys, so they must match:

- Certification: `label`, `value`  (icon optional)
- Accordion item: `title`, `content`

## Theme editor toggles

The block schema only exposes: the **Product** picker, an **Add to cart label**,
and show/hide checkboxes for each optional area (thumbnails, quote, rating, pack
selector, description, tags, certifications, badges, accordion). The pack/variant
selector also auto-hides when the product has only one variant.
