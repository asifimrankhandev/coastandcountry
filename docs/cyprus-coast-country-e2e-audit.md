# Cyprus Coast & Country — Website E2E Audit & Rebuild Specification

**Prepared:** 2 November 2026  
**Target:** https://www.cypruscoastandcountry.com/  
**Purpose:** Owner-authorized website replacement, content migration planning, and implementation requirements.  
**Audit type:** Public-facing discovery audit with documented evidence and E2E test plan.  
**Status:** **Discovery in progress — not a completed browser-driven E2E execution.**

> **Important accuracy note:** This document distinguishes observed/indexed evidence from items that still require direct browser testing or authorized CMS/database access. Search-engine indexed pages are not a reliable substitute for a live crawl. No claim is made that every URL, image, form submission, breakpoint, backend process, or integration has already been tested. Use this as the working audit specification and evidence register, then complete the verification checklist before sign-off.

---

## 1. Executive summary

Cyprus Coast & Country Homes presents itself as a Northern Cyprus real-estate agency. Publicly visible content includes property search and listings, individual property pages, agency information, buying guidance, mortgage/payment-plan content, inspection trips, testimonials, services, a blog, a video gallery, and contact details.

The site is property-catalogue-driven. The rebuild must treat property data as structured content managed from one source, rather than hard-coded text copied independently into homepage cards and detail pages.

### Primary rebuild objectives

1. Inventory every accessible URL and page template.
2. Reconcile public listings with the owner's authoritative property database/export.
3. Preserve authorized property descriptions, photos, videos, documents, and business content.
4. Rebuild property search, listing cards, detail pages, enquiries, guides, editorial pages, and navigation.
5. Keep current property price/status consistent across every page.
6. Preserve valuable existing URLs or map them to appropriate replacement URLs with redirects.
7. Test all critical customer journeys on desktop and mobile before launch.
8. Record evidence and unresolved items so the project does not mistake assumptions for verified facts.

### High-priority risks to resolve

- **Catalogue completeness:** a public About page claims a portfolio of 400+ properties, while a search-results snapshot shows 1–10 of 100 properties. These may refer to different dates, catalogue scopes, or platform behaviour; reconcile against the live site and owner's data export.
- **Search behaviour:** an older indexed snapshot of `/sale/all` shows “1 to 0 of 0 properties” and “Loading…”, while a newer indexed snapshot shows “1 to 10 of 100 properties”. This is evidence of inconsistent snapshots or potentially dynamic loading, not proof of a current production defect.
- **Content accuracy:** property pages may contain unusual measurement formatting, missing values, or content that must be validated with the owner.
- **Legacy content:** indexed material contains historical claims, prices, payment terms, office details, and experience statements. Verify before republishing.
- **Legal/financial content:** property title-deed, purchase process, mortgage, tax, and investment claims must be reviewed by the owner and appropriate qualified professionals before migration.
- **SEO migration:** missing redirects or changed property URLs can damage traffic and create broken links.
- **Forms and integrations:** form delivery, CRM/email integrations, analytics, cookie consent, map/video embeds, and any property feeds require live testing and/or administrator access.

---

## 2. Scope and audit methodology

### Included in this document

- Public-facing site structure and observed page families.
- Initial URL inventory.
- Content and property-field inventory.
- Functional requirements for the replacement.
- Proposed data model and CMS capabilities.
- E2E test cases and launch acceptance criteria.
- Risks, questions, and next actions.
- Evidence URLs for findings.

### Not yet verified

- Complete live crawl of all internal links and pagination.
- Exact total number of active, archived, or duplicate property records.
- Full image/media download inventory.
- All filter combinations and sorting modes.
- Actual form submission, email delivery, spam handling, and backend persistence.
- Login/admin/CMS functionality.
- Mobile, tablet, accessibility, and performance measurements.
- Source code, database, APIs, analytics, CRM, or third-party integration configuration.
- Current status of every property, price, payment offer, or legal statement.

### Evidence labels used

- **Observed in indexed public content:** content is visible in a retrieved public search/index result.
- **Proposed requirement:** recommended behaviour for the replacement; not asserted as current functionality.
- **Needs verification:** must be tested directly or checked against an owner-controlled source.
- **Owner input required:** cannot safely be decided from public pages alone.

---

## 3. Public evidence and initial findings

### 3.1 Homepage

URL: https://www.cypruscoastandcountry.com/

Publicly indexed content shows:

- Promotional hero/banner content, including seafront properties and luxury villas.
- Property search controls.
- Testimonials.
- Latest property cards and featured properties.
- Mortgage/payment-planning promotional content.
- Service cards such as property sales, blog, consultation, and legal advice.
- Calls to action to contact the agency or browse properties.
- Inspection-trip promotion.
- Video content / video gallery.
- Contact details and a property-information disclaimer.

**Needs verification:** exact section order, image sources, carousel behaviour, all hero destinations, responsive layouts, loading states, analytics/cookie behaviour, and whether every visible button works.

### 3.2 Property search/results

URLs:
- https://www.cypruscoastandcountry.com/sale/all
- https://cypruscoastandcountry.com/sale/all

Indexed content exposes controls labelled:

- Main Location
- Property Type
- Number of bedrooms
- Min Price
- Search

A newer indexed snapshot shows pagination/results text “1 to 10 of 100 properties”, property cards, reference identifiers, prices, bedroom/bathroom/area values, and featured labels. An older snapshot shows “1 to 0 of 0 properties” and “Loading…”.

**Audit conclusion:** verify the live results page and data source before concluding there is a defect. Test filters individually and in combination, URL state, sorting, pagination, zero-result behaviour, and loading failures.

### 3.3 Property detail pages

Examples:
- https://www.cypruscoastandcountry.com/property/all/311
- https://www.cypruscoastandcountry.com/property/all/381
- https://www.cypruscoastandcountry.com/property/all/367

Indexed content from detail pages shows examples of:

- Property reference/ID.
- Title and asking price.
- Image gallery.
- Bedrooms, bathrooms, area, and sometimes plot size.
- Long-form description.
- Resort/development overview and facilities.
- Property features such as garden, roof terrace, beach proximity, terrace, pool, furnishings, air conditioning, and build year.
- Contact/enquiry language and shared site footer/disclaimer.

A retrieved example includes an area measurement written in a format such as `3,701x3,968 m`. This may represent room dimensions with inconsistent units/formatting; verify against the original source and do not normalize silently.

### 3.4 About page

URL: https://www.cypruscoastandcountry.com/about

Indexed content describes:

- Coast & Country Homes Estate Agency Ltd.
- Estate agency registration number `17571` (owner should verify current status and exact legal wording).
- Agency experience and an international team.
- Northern Cyprus locations including Guzelyurt, Bafra, Famagusta, Kyrenia/Girne, and Esentepe.
- Apartments, villas, land, and commercial property.
- Investment properties and finance/payment options.
- Inspection visits and buyer support.
- Seller valuation, photography, measurements, and marketing.
- International partner agents and property portal marketing.

The page contains time-sensitive claims (portfolio size, years of experience, starting prices, partner relationships, and services). Verify each claim with the owner before republishing.

### 3.5 Buyer's guide

URL: https://www.cypruscoastandcountry.com/guide/buyers-guide

Indexed content includes reasons to use the agency, title-deed transparency, legal review claims, property purchase guidance, and steps such as solicitor engagement, power of attorney, Permission to Purchase, contract signing, and taking possession.

**Important:** this audit records what the page appears to discuss; it does not validate the legal accuracy of the advice. The owner should obtain qualified legal review of all legal, tax, title-deed, immigration, and purchase-process material before publishing it on the new site.

### 3.6 Mortgage/payment plan page

URL: https://www.cypruscoastandcountry.com/payment-plan

Indexed content describes payment arrangements for off-plan, under-construction, completed new-build, and resale properties. It contains specific deposit amounts, timeframes, and financing claims.

**Migration rule:** treat these as dated content, not reusable universal facts. Every numerical claim must be approved by the owner and relevant finance/legal professionals. Prefer clearly dated, property-specific terms where possible.

### 3.7 Contact page

URL: https://www.cypruscoastandcountry.com/contact

Indexed content includes:

- Email: `info@cypruscoastandcountry.com`
- Telephone numbers shown in indexed content: `+90 533 841 4910` and `+44 774 914 1180` (verify current numbers before launch).
- Address text referencing Tasgen Karaaziz Plaza, 39 Cengiz Topel Avenue, Catalkoy, Girne, North Cyprus.
- Contact form fields: Full Name, Email, Message.
- Office-hours information.
- Directions to the office and viewing/meeting instructions.

**Needs verification:** current contact details, form required fields, email delivery, success/failure messages, validation, anti-spam, consent wording, privacy notice, mobile tap-to-call/email links, and office hours.

### 3.8 FAQs, area page, and video gallery

Evidence URLs:
- https://www.cypruscoastandcountry.com/faqs/
- https://cypruscoastandcountry.com/north-cyprus
- Homepage video/gallery content is visible in indexed homepage content.

The FAQ page's indexed result also exposes general promotional content, which may indicate shared page sections or search-index extraction of page-wide content. Verify the actual page body and its FAQ entries in a browser.

The North Cyprus page contains area/destination copy and property content. Video content includes titles relating to coastal living, Esentepe, SPA Residence, and beachfront resort apartments in indexed content.

**Needs verification:** all FAQ questions/answers, video URLs and embed providers, video accessibility, area page subpages, and content taxonomy.

---

## 4. Initial URL inventory

This is a **seed list**, not the final complete crawl.

| ID | URL | Page family | Evidence/status |
|---|---|---|---|
| URL-001 | `/` | Homepage | Indexed public content; direct interaction audit pending |
| URL-002 | `/about` | About agency | Indexed public content |
| URL-003 | `/sale/all` | Property results | Indexed snapshots inconsistent; live verification required |
| URL-004 | `/property/all/311` | Property detail | Indexed detail content |
| URL-005 | `/property/all/381` | Property detail | Indexed detail content |
| URL-006 | `/property/all/367` | Property detail | Indexed page/footer content |
| URL-007 | `/guide/buyers-guide` | Buyer guide | Indexed public content |
| URL-008 | `/payment-plan` | Mortgages/payment plans | Indexed public content |
| URL-009 | `/contact` | Contact | Indexed form and contact details |
| URL-010 | `/faqs/` | FAQ | Indexed result; exact FAQ content pending |
| URL-011 | `/north-cyprus` | Destination/area guide | Indexed public content |
| URL-012 | Blog index and article routes | Editorial | Blog is referenced; complete URLs not inventoried |
| URL-013 | Video gallery and individual video routes | Video | Videos visible/referenced; route inventory pending |
| URL-014 | Inspection trip landing page | Lead generation | Promoted on site; exact URL/flow pending |
| URL-015 | For-sale category/search routes | Property search | Navigation mentions For Sale; complete route inventory pending |
| URL-016 | Sell/buy guide route(s) | Guide | Footer/navigation references Buy/Sell Guide; route mapping pending |
| URL-017 | Privacy/cookie/terms pages | Legal | Existence and URLs need verification |
| URL-018 | Sitemap/robots files | Crawl discovery | Automated open via research interface was not successful; retry from authorized crawl environment |

### URL inventory fields to collect during the real crawl

For every URL, store:

- `source_url`
- `final_url_after_redirect`
- `http_status`
- `page_title`
- `meta_description`
- `canonical_url`
- `robots_indexability`
- `h1`
- `page_type`
- `internal_inlinks`
- `internal_outlinks`
- `image_count`
- `form_count`
- `primary_cta`
- `screenshot_desktop`
- `screenshot_mobile`
- `crawl_timestamp`
- `audit_status`
- `notes`
- `replacement_url`
- `redirect_required`

Do not mark a URL “audited” merely because it appears in a search result.

---

## 5. Navigation and information architecture

### Observed/referenced navigation areas

Public indexed pages reference these sections in navigation/footer content:

- Home
- Inspection Trip
- For Sale
- Mortgages
- Buy/Sell Guide
- About Us
- North Cyprus
- Video Gallery
- Contact
- More / additional pages

### Proposed replacement sitemap

```text
/
├── properties/
│   ├── for-sale/
│   ├── property-type/
│   ├── location/
│   └── {property-slug}-{reference}/
├── areas/
│   └── {area-slug}/
├── buying/
│   ├── buyer-guide/
│   ├── inspection-trip/
│   ├── mortgages-and-payment-plans/
│   └── faqs/
├── selling/
│   ├── seller-guide/
│   └── valuation-enquiry/
├── services/
│   ├── property-sales/
│   ├── consultation/
│   └── legal-information/
├── about/
├── blog/
│   └── {article-slug}/
├── videos/
├── contact/
├── privacy/
├── cookies/
└── terms-and-disclaimers/
```

This is a proposed architecture. Approve it against business requirements before implementation. Do not create thin or duplicate pages solely to fill out the sitemap.

---

## 6. Property catalogue: atomic field inventory

### 6.1 Required property identity fields

- Stable internal property ID.
- Existing website ID / route identifier.
- Public property reference.
- Public title.
- URL slug.
- Listing status.
- Transaction type (sale/rent/other if applicable).
- Property type.
- Resale/new-build/off-plan/under-construction classification.
- Created and updated timestamps.
- Publication date and archive date.
- Source of truth / import batch.
- Data owner or assigned staff member.

### 6.2 Location fields

- Country/territory display value.
- Region/district.
- Town/city.
- Neighbourhood/locality.
- Development/resort.
- Public address if authorized and appropriate.
- Latitude/longitude if supplied and approved.
- Map pin visibility.
- Location privacy rules for occupied/resale homes.

### 6.3 Pricing and availability

- Amount as a decimal numeric value.
- Currency code (do not assume every property is GBP).
- Price display string, generated from structured values.
- Price-on-request flag if supported.
- Reservation/under-offer status.
- Sold/withdrawn/archived status.
- Availability checked date.
- Payment-plan availability and terms.
- Service charges/maintenance fees if supplied.
- Tax/fee information only when verified and clearly qualified.

### 6.4 Accommodation and measurements

- Bedrooms.
- Bathrooms.
- Living rooms and other room counts if supplied.
- Internal area and unit.
- Covered/uncovered area where available.
- Land/plot area and unit.
- Balcony/terrace/garden area where available.
- Room-by-room measurements.
- Measurement source and verification status.
- Unknown/missing-value handling.

**Validation:** store numeric measurements as numeric values plus explicit units. Do not treat `0` as “unknown” unless the source system's semantics confirm that. Preserve original source text in a migration/audit field if normalization is required.

### 6.5 Descriptive content

- Short description.
- Full description.
- Development overview.
- Location description.
- Room-by-room details.
- Facilities and amenities.
- Nearby points of interest.
- Furnishing status.
- Heating/cooling.
- Parking.
- Pool/garden/outdoor space.
- Accessibility information where supplied.
- Build/completion year.
- Energy/performance fields only if applicable and sourced.
- Legal/title-deed text, with review status.
- Investment or rental claims, with substantiation and approval.
- Source language and translated variants, if multilingual content is required.

### 6.6 Images and media

For each image/media asset:

- Asset ID.
- Associated property or page.
- Original filename.
- Original source URL/path.
- Local storage path after authorized migration.
- Alt text.
- Caption.
- Sequence/order.
- Main/cover image flag.
- Image dimensions and file size.
- MIME type.
- Rights/permission status.
- Credit/attribution.
- Transformation variants (thumbnail/card/detail/large).
- Broken/missing asset status.
- Duplicate/hash detection.
- Import status.

For videos:
- Provider and video ID/URL.
- Title.
- Poster/thumbnail.
- Captions/subtitles.
- Consent/loading policy if third-party embed is used.
- Playback and mobile test status.

### 6.7 Property features

Use a controlled feature taxonomy instead of free-text-only values. Examples found or suggested by public property content include:

- Pool
- Indoor pool
- Garden
- Roof terrace
- Terrace
- Balcony
- Furnished
- Air conditioning
- Beach proximity
- Parking
- Playground
- Gym
- Spa/wellness
- Restaurant
- Resort facilities
- Sea view / mountain view

Only attach features actually supported by source data. Separate private-unit features from shared development facilities.

### 6.8 Data migration rules

- Never invent a value for an empty field.
- Preserve original source text during the migration.
- Record every transformed/normalized value and the rule applied.
- Keep old property IDs and URLs mapped to the new record.
- Identify duplicates by reference, source ID, title, location, and image similarity.
- Compare record counts before and after import.
- Create a human review queue for ambiguous, malformed, or conflicting fields.
- Confirm rights to reuse photographs, video, floorplans, logos, testimonials, and third-party content.
- Archive rather than delete records until the owner approves final disposition.
- Treat current price/status as owner-controlled business data, not as a value to infer from search-engine caches.

---

## 7. Functional specification for the replacement

The following are requirements to implement and test; they are not assertions that every feature exists today.

### 7.1 Search and listing results

- Search by location.
- Search by property type.
- Filter by bedroom count.
- Filter by minimum/maximum price (confirm owner requirements).
- Filter by transaction/listing type if relevant.
- Filter by property features where useful.
- Combine filters correctly.
- Sort by default, newest, price ascending/descending where approved.
- Paginate or progressively load results.
- Show result count that matches returned records.
- Keep filters when moving between pages.
- Support direct links to filtered results.
- Provide clear filters/reset.
- Display a helpful no-results state.
- Display loading and recoverable error states.
- Avoid showing archived/sold records unless the business explicitly chooses to.
- Ensure keyboard and screen-reader access to controls.

### 7.2 Property cards

Minimum fields, subject to availability:

- Cover image.
- Property title.
- Public reference.
- Price/currency or price-on-request.
- Location.
- Bedrooms/bathrooms.
- Area with unit.
- Listing/featured status where appropriate.
- Link to detail page.

Rules:
- Hide absent values rather than showing misleading zeros.
- Preserve a consistent card layout.
- Use responsive image sizes and meaningful alt text.
- Make the clickable target clear.
- Avoid implying “featured” means verified or endorsed unless the business defines it.

### 7.3 Property detail page

- Title and reference.
- Current owner-approved price/status.
- Responsive image gallery with accessible controls.
- Description and structured facts.
- Features and facilities.
- Location information at approved precision.
- Development information where relevant.
- Enquiry/viewing CTA.
- Contact alternatives.
- Similar listings only when valid and available.
- Shareable canonical URL.
- SEO title/description and social preview.
- Missing-image and unavailable-property fallback.
- Clear legal/financial disclaimers where appropriate.
- Form context must identify the property to staff.

### 7.4 Contact and lead forms

Contact page currently exposes Full Name, Email, and Message in indexed content. Verify whether other forms exist.

Replacement requirements:
- Server-side and client-side validation.
- Clear required/optional labels.
- Email format validation.
- Consent/privacy text approved by owner/legal reviewer.
- Anti-spam protection appropriate to the risk.
- Safe handling and storage of submitted personal data.
- Submission status and accessible error messages.
- Duplicate-submit prevention.
- Email/CRM delivery monitoring.
- Notification and failure logging without exposing sensitive content.
- Retention policy and authorized access.
- Property reference and source page captured for property enquiries.
- Confirmation page or message.
- Automated tests for valid, invalid, failed, and repeated submissions.

### 7.5 Inspection-trip enquiry

Promoted public content describes an inspection visit and a “3 Nights FREE ~ Bed and Breakfast” offer in indexed results. Verify current offer, eligibility, terms, dates, exclusions, and availability with the owner.

Potential form fields (owner approval required):
- Name
- Email
- Phone/country code
- Preferred dates
- Number of travellers
- Property interests/budget
- Accessibility or scheduling requirements if needed
- Consent/privacy acknowledgement

Do not advertise a free offer unless its current terms are approved and clearly displayed.

### 7.6 Content management/admin

Recommended capabilities:
- Role-based access (administrator, editor, property manager, enquiry handler).
- Draft, preview, publish, unpublish, archive.
- Property import/export.
- Bulk edit for safe fields.
- Media library with rights/credit metadata.
- Audit trail for price/status/content changes.
- Required-field validation before publishing.
- Duplicate detection and review.
- Redirect management.
- Editorial scheduling if needed.
- Enquiry queue with assignment/status and retention rules.
- Backup and recovery process.
- MFA for privileged accounts where supported.
- Least-privilege permissions.

---

## 8. Proposed data model

A relational database or a well-structured CMS is recommended, subject to final stack selection.

### Core entities

- `property`
- `property_image`
- `property_video`
- `property_feature`
- `feature`
- `property_type`
- `location`
- `development`
- `development_facility`
- `property_status_history`
- `property_price_history` (if business requires historical tracking)
- `enquiry`
- `enquiry_event`
- `inspection_trip_request`
- `contact_request`
- `blog_article`
- `guide_page`
- `faq_item`
- `testimonial`
- `staff_profile`
- `redirect`
- `seo_metadata`
- `media_asset`
- `user`
- `role`
- `audit_log`

### Relationship principles

- One property can have many images and features.
- A property may reference one location and optionally one development.
- A development can have many facilities and many properties.
- Each enquiry can optionally reference a property.
- Public pages should read property data from the same authoritative record.
- Price/status history should be auditable if staff need to investigate changes.
- Testimonials require permission/consent records and should not expose private details unnecessarily.
- Archived properties must remain available to authorized staff for audit/migration purposes without necessarily being public.

### Example property JSON (illustrative only)

```json
{
  "reference": "EXAMPLE-001",
  "slug": "example-two-bedroom-apartment",
  "title": "Example Two-Bedroom Apartment",
  "transaction_type": "sale",
  "property_type": "apartment",
  "status": "draft",
  "location": {
    "region": null,
    "town": null,
    "neighbourhood": null
  },
  "pricing": {
    "amount": null,
    "currency": "GBP",
    "price_on_request": false
  },
  "accommodation": {
    "bedrooms": 2,
    "bathrooms": null
  },
  "measurements": {
    "internal_area": null,
    "internal_area_unit": "m2",
    "land_area": null,
    "land_area_unit": "m2"
  },
  "description": {
    "short": "",
    "full": ""
  },
  "features": [],
  "images": [],
  "development_id": null,
  "published_at": null,
  "updated_at": null
}
```

This is not copied from a real property. It demonstrates structure only.

---

## 9. SEO and URL migration

### Audit every existing URL for

- HTTP status and redirect chain.
- Canonical URL.
- Indexability and robots directives.
- Title and meta description.
- H1 and heading hierarchy.
- Structured data, if any.
- Image alt text.
- Internal links and orphan status.
- Backlinks/organic landing-page importance where analytics tools are available.
- Replacement URL and redirect requirement.

### Migration rules

1. Preserve existing URLs where reasonable.
2. If a URL changes, use a single permanent redirect to the closest equivalent replacement page.
3. Do not redirect every removed property to the homepage; map it to a suitable replacement or a helpful unavailable-property page.
4. Keep old property reference codes searchable internally.
5. Generate and validate a new XML sitemap.
6. Update internal links to final canonical URLs.
7. Preserve relevant title/description content when still accurate.
8. Remove stale metadata and expired promotional claims.
9. Check for redirect loops and chains.
10. Monitor crawl errors and organic landing pages after launch.

### SEO acceptance checks

- No important migrated page returns an unintended 404/5xx.
- No canonical points to the wrong page.
- No internal links point to old URLs unnecessarily.
- Redirects resolve in one hop where possible.
- Property structured data is valid if implemented and supported by accurate data.
- Sitemap contains only intended canonical/indexable URLs.
- Staging is protected from unintended indexing, and production is indexable as intended.

---

## 10. Accessibility, performance, security, privacy

### Accessibility

Test:
- Keyboard-only navigation.
- Visible focus indicators.
- Form labels and errors.
- Image alt text.
- Heading order and landmarks.
- Colour contrast.
- Modal/gallery focus handling.
- Reduced-motion preference.
- Mobile touch target size.
- Screen-reader announcement of result counts and form status.

Target WCAG 2.2 AA where practical and applicable; document any exceptions.

### Performance

Measure on representative pages:
- Homepage.
- Search results.
- Property detail with large gallery.
- Guide/article.
- Contact form.

Check:
- Image formats and responsive sizes.
- Lazy loading below the fold.
- Layout shifts.
- JavaScript bundle weight.
- Third-party embeds.
- Cache headers/CDN.
- Core Web Vitals using field data after launch and lab testing before launch.

### Security and privacy

- HTTPS everywhere.
- Secure admin authentication and least privilege.
- MFA for privileged users where supported.
- Server-side input validation.
- Output escaping and protection against common web vulnerabilities.
- Rate limiting and anti-spam on public forms.
- Secure secret management; never put credentials in source control.
- Backups with restore tests.
- Logs that avoid unnecessary personal data.
- Data retention and deletion policy.
- Privacy/cookie controls reviewed against applicable law and actual tracking technologies.
- Verify access permissions for exports and media.
- Do not place personal/customer data in a public property feed.

---

## 11. E2E test plan

**Execution status:** test cases are specified below; they have not all been run against the live site. Execute against the existing site for baseline behaviour where possible, then against the rebuilt staging site.

### 11.1 Navigation and page rendering

| Test ID | Test | Expected result | Status |
|---|---|---|---|
| NAV-001 | Open homepage | Page renders; no fatal errors | Not run |
| NAV-002 | Click each primary navigation item | Correct destination loads | Not run |
| NAV-003 | Open every footer link | Correct page/destination | Not run |
| NAV-004 | Use browser back/forward | Navigation state remains sensible | Not run |
| NAV-005 | Open a deep link directly | Page loads without requiring homepage first | Not run |
| NAV-006 | Follow internal links | No unintended dead ends | Not run |
| NAV-007 | Check redirects | No loops or unnecessary chains | Not run |

### 11.2 Property search

| Test ID | Test | Expected result | Status |
|---|---|---|---|
| SRCH-001 | Search with all default filters | Results and count agree | Not run |
| SRCH-002 | Filter by location | All results satisfy selected location | Not run |
| SRCH-003 | Filter by property type | All results match type | Not run |
| SRCH-004 | Filter by bedroom count | Results match chosen rule | Not run |
| SRCH-005 | Filter by minimum price | No result below the threshold | Not run |
| SRCH-006 | Combine multiple filters | AND/OR semantics are correct and documented | Not run |
| SRCH-007 | Reset filters | Defaults restored | Not run |
| SRCH-008 | Select no-match combination | Helpful empty state; no fake results | Not run |
| SRCH-009 | Change page | Correct next/previous records | Not run |
| SRCH-010 | Keep filters through pagination | Selected filters persist | Not run |
| SRCH-011 | Sort by price | Numeric sorting, not string sorting | Not run |
| SRCH-012 | Open filtered URL in new tab | State/results are reproducible if URL state is supported | Not run |
| SRCH-013 | Search on mobile | Controls usable without overflow | Not run |
| SRCH-014 | API/data failure | Recoverable error with retry/help | Not run |

### 11.3 Property detail

| Test ID | Test | Expected result | Status |
|---|---|---|---|
| PROP-001 | Open a valid property URL | Correct record loads | Not run |
| PROP-002 | Compare card and detail price | Values agree | Not run |
| PROP-003 | Compare reference code | Same reference on all views | Not run |
| PROP-004 | Navigate image gallery | Correct images, order, controls | Not run |
| PROP-005 | Gallery keyboard access | Focus and controls work | Not run |
| PROP-006 | Missing image | Fallback; no broken icon | Not run |
| PROP-007 | Missing area/bathroom value | No misleading zero or invalid unit | Not run |
| PROP-008 | Sold/withdrawn listing | Correct status and business-approved behaviour | Not run |
| PROP-009 | Similar properties | Only relevant published records shown | Not run |
| PROP-010 | Enquire about property | Enquiry carries correct property ID/reference | Not run |
| PROP-011 | Direct URL refresh | Detail page still loads | Not run |
| PROP-012 | SEO metadata | Correct title/canonical/description | Not run |

### 11.4 Contact and lead forms

| Test ID | Test | Expected result | Status |
|---|---|---|---|
| FORM-001 | Submit valid contact form | Confirmation shown; record delivered/stored | Not run |
| FORM-002 | Submit with required field missing | Clear validation; no submission | Not run |
| FORM-003 | Invalid email | Clear validation | Not run |
| FORM-004 | Very long input | Safe handling and sensible limit | Not run |
| FORM-005 | Special characters/HTML input | Safely stored/escaped; no script execution | Not run |
| FORM-006 | Double-click submit | No duplicate lead unless intentionally allowed | Not run |
| FORM-007 | Network/server failure | Clear error and retry path | Not run |
| FORM-008 | Spam/rate-limit test | Protection works without blocking normal users | Not run |
| FORM-009 | Email delivery | Correct inbox/CRM receives expected details | Not run |
| FORM-010 | Mobile keyboard | Fields and submit control remain usable | Not run |
| FORM-011 | Consent/privacy text | Correct approved wording displayed | Not run |
| FORM-012 | Screen-reader status | Success/error announced accessibly | Not run |

### 11.5 CMS and migration

| Test ID | Test | Expected result | Status |
|---|---|---|---|
| CMS-001 | Authorized staff login | Correct role access | Not run |
| CMS-002 | Create draft property | Draft is not public | Not run |
| CMS-003 | Publish valid property | Property appears in intended public areas | Not run |
| CMS-004 | Edit price | Card, detail and search stay consistent | Not run |
| CMS-005 | Archive property | Public behaviour matches policy; audit data retained | Not run |
| CMS-006 | Upload image | Image validated, optimized and ordered | Not run |
| CMS-007 | Import property batch | Counts and field mapping reconcile | Not run |
| CMS-008 | Re-import same batch | No unintended duplicates | Not run |
| CMS-009 | Invalid data import | Errors reported; valid records not corrupted | Not run |
| CMS-010 | Restore backup | Recovery procedure succeeds | Not run |

### 11.6 Responsive, accessibility, and browser matrix

Test at minimum:
- Desktop widths around 1440 px and 1280 px.
- Tablet widths around 768–1024 px.
- Mobile widths around 360–430 px.
- Current supported Chrome, Safari, Firefox, and Edge where relevant.
- iOS Safari and Android Chrome on real or representative devices.
- Keyboard-only navigation.
- At least one screen reader in a supported platform.
- Reduced-motion and zoom/text-resize behaviour.

These are test targets, not results already measured.

---

## 12. Migration and launch acceptance criteria

The new site should not be signed off until:

### Data
- All owner-approved properties are accounted for in a reconciliation report.
- Every imported property has a stable ID and old-reference mapping where applicable.
- Missing/invalid fields are listed for owner review.
- Price, status, and key facts match the authoritative source.
- Images/media have confirmed reuse rights and no unresolved critical broken assets.
- Duplicate records are resolved or explicitly approved.

### Functionality
- All primary navigation routes work.
- Search and filters produce correct results.
- Pagination and sorting are correct.
- Property detail pages load directly and on refresh.
- Contact and property enquiry forms submit successfully end to end.
- Form delivery/CRM handling is verified.
- Error, empty, and loading states are implemented.
- Admin permissions and backup/restore have been tested.

### SEO
- Every important old URL has a documented keep/redirect/retire decision.
- Redirect map is tested.
- Canonicals, titles, metadata, sitemap, and robots settings are reviewed.
- No accidental staging URLs or noindex settings remain in production.
- Analytics/search-console monitoring is configured if approved.

### Quality
- No critical or high-severity defects remain open.
- Responsive and accessibility checks are completed.
- Performance is measured on representative pages.
- Privacy, cookie, and legal content is approved by the owner.
- Launch rollback and recovery procedures are documented.

---

## 13. Priority backlog

### P0 — Blockers before build/migration

- [ ] Get owner-authorized CMS/database/export access.
- [ ] Establish the authoritative property inventory and current property count.
- [ ] Verify which domain/host is canonical and whether there is a staging or alternate site.
- [ ] Export existing URLs, property IDs, prices/statuses, content, and media references.
- [ ] Confirm rights to reuse every image, logo, video, testimonial, and third-party asset.
- [ ] Identify form recipients, CRM, email, property feeds, analytics, cookie tools, maps, and video providers.
- [ ] Confirm business rules for sold/withdrawn properties and price changes.
- [ ] Approve legal/financial content review process.

### P1 — Required for first release

- [ ] Complete URL crawl and page-template inventory.
- [ ] Finalize information architecture.
- [ ] Finalize property schema and import mapping.
- [ ] Build property search/results and detail pages.
- [ ] Build contact/property enquiry forms and verify delivery.
- [ ] Build admin/CMS workflow.
- [ ] Implement redirects and SEO essentials.
- [ ] Test responsive layout and critical user journeys.
- [ ] Create backup/restore and monitoring plan.

### P2 — Important enhancements, subject to business approval

- [ ] Saved/favourite properties.
- [ ] Property comparison.
- [ ] More advanced search filters.
- [ ] Multilingual pages.
- [ ] Map-based browsing.
- [ ] Lead source attribution and reporting.
- [ ] Automated stale-listing reminders.
- [ ] More advanced editorial search and content tagging.

Do not include P2 items automatically; validate user demand and business value first.

---

## 14. Questions requiring owner answers

1. Which platform/CMS currently runs the site?
2. Is the site currently connected to a property CRM, feed, or external listing system?
3. What is the authoritative count of active properties, and how many are archived?
4. Are all properties to be migrated, or only currently available listings?
5. Are there multiple languages now or planned?
6. Which email inboxes/CRM queues should receive contact, viewing, and inspection-trip enquiries?
7. Are favourites, saved searches, customer accounts, or other logged-in features present?
8. What analytics, consent, advertising, map, video, chat, or call-tracking tools are in use?
9. Which domain should be canonical after launch?
10. Must old property IDs/URLs remain unchanged?
11. Who approves property prices, availability, legal text, testimonials, and marketing claims?
12. Who can approve asset reuse and confirm third-party licence restrictions?
13. What hosting, backup, security, and maintenance constraints apply?
14. What is the desired launch date and acceptable downtime?
15. Are there private pages or admin-only workflows that must be audited with credentials in a secure environment?

---

## 15. Recommended next steps to turn this into a verified E2E audit

### Step 1 — Obtain owner-controlled source data

Request an export from the current CMS/database, including:
- Properties and status.
- Property references and old URLs.
- Descriptions, features, prices, and measurements.
- Image/media references and files where permitted.
- Guides, FAQs, blog posts, videos, testimonials.
- Redirect rules and SEO metadata.
- Forms/integration configuration (never export or expose secrets unnecessarily).

### Step 2 — Run a controlled crawl

Use a crawler/browser automation in an authorized environment. Respect server load and access rules. Include:
- Sitemap discovery.
- Internal-link crawling.
- Pagination discovery.
- Canonical and redirect tracking.
- Screenshots at desktop/mobile breakpoints.
- Form and interaction testing with safe test submissions.
- Error logging and duplicate URL normalization.

Do not aggressively crawl or submit repeated production forms. Use staging or designated test records where possible.

### Step 3 — Reconcile public and owner data

Generate a reconciliation report with:
- Total discovered URLs.
- Total unique property records.
- Total published/archived records.
- Duplicate IDs/references.
- Missing images.
- Missing or malformed fields.
- Price/status conflicts.
- URLs without a replacement.
- Content needing owner/legal approval.

### Step 4 — Build and test the replacement

Use the acceptance criteria and test matrix in this document. Keep a clear distinction between:
- `Not run`
- `Passed`
- `Failed`
- `Blocked`
- `Not applicable`

Attach evidence for failures and passed critical tests, such as screenshot, URL, timestamp, and test environment.

### Step 5 — Sign-off

The owner or delegated business representative should approve:
- Final content and legal copy.
- Property migration reconciliation.
- Asset rights.
- Redirect map.
- Form routing.
- E2E test results.
- Launch/rollback plan.

---

## 16. Evidence sources

The findings above were informed by publicly indexed pages. Indexed content can be stale, incomplete, or inconsistent with the current live website; re-check it before migration.

1. Homepage: https://www.cypruscoastandcountry.com/
2. Property search/results: https://www.cypruscoastandcountry.com/sale/all
3. About: https://www.cypruscoastandcountry.com/about
4. Buyer guide: https://www.cypruscoastandcountry.com/guide/buyers-guide
5. Payment plan: https://www.cypruscoastandcountry.com/payment-plan
6. Contact: https://www.cypruscoastandcountry.com/contact
7. FAQs: https://www.cypruscoastandcountry.com/faqs/
8. North Cyprus area guide: https://cypruscoastandcountry.com/north-cyprus
9. Property example 311: https://www.cypruscoastandcountry.com/property/all/311
10. Property example 381: https://cypruscoastandcountry.com/property/all/381
11. Property example 367: https://www.cypruscoastandcountry.com/property/all/367

---

## 17. Final status statement

**This is a detailed audit specification and initial evidence-based discovery report, not a certified completed E2E audit.** Publicly indexed content supports the initial page-family and feature inventory, but a true “every page and every interaction” audit still requires a live crawl, browser interaction testing, and ideally an owner-authorized CMS/database export.

The most reliable route is to use this document as the audit checklist, run the crawl and E2E tests, reconcile against owner-controlled source data, and update every status with actual evidence before development or launch sign-off.
