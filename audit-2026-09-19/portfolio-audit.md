# BIM Portfolio UX and Accessibility Audit

Date: 19 September 2026

## Scope

Live portfolio audit at desktop (1440 x 1000) and mobile (390 x 844). The assumed goal is to support both job applications and freelance enquiries because a primary goal was not confirmed.

## Flow

1. `01-home-desktop.png` — Desktop entry: healthy visual identity; role is visible, but the first screen lacks a resume link, LinkedIn link, and a concise proof summary.
2. `02-projects-desktop.png` — Desktop selected work: visually polished; a 14-item carousel slows scanning and the generic descriptions do not show the candidate's precise responsibility or measurable outcome.
3. `03-project-gallery-desktop.png` — Project gallery: strong imagery; the modal gives no captions, scope, software, LOD, deliverables, constraints, or result.
4. `04-home-mobile.png` — Mobile entry: attractive portrait treatment; the word “PORTFOLIO” is visibly cropped and the fixed visitor/CTA controls compete for space.
5. `05-projects-mobile.png` — Mobile selected work: the section heading reads well; the card copy sits below the fold while the fixed CTA and corner widgets overlap the project experience.
6. `06-contact-desktop.png` — Desktop contact: clear, credible, and easy to act on; LinkedIn and resume are absent.
7. `07-contact-mobile.png` — Mobile contact details: readable and well spaced; fixed widgets crowd the bottom content.
8. `08-contact-form-mobile.png` — Mobile contact form: simple and usable; submission errors are not explained inline and the fixed widgets overlap the footer area.

## Strengths

- Distinctive plum and peach visual identity, strong portrait, and consistent typography.
- Real project renders, BBS drawings, contact details, and clear availability create credibility.
- Desktop hierarchy is strong and the contact path is easy to find.
- Mobile navigation has a clear menu control and the form fields have visible labels.

## Highest-impact improvements

1. Turn three or four strongest projects into real case studies. Show project type, location, scale, role, software, LOD, deliverables, challenge, contribution, and a truthful result. Keep the remaining projects behind “View all projects.”
2. Add `Download Resume`, LinkedIn, and `View Projects` actions near the hero. Replace the generic first-screen message with a short value statement such as BIM modelling, coordination, BOQ, and BBS experience.
3. Fix mobile layout: allow the hero title to fit, hide or relocate the visitor counter on small screens, and keep only one persistent contact action. Do not let fixed controls cover project cards or footer content.
4. Replace the 14-project carousel with a scannable featured-project grid. Carousels hide work and force repeated interaction.
5. Upgrade the gallery modal into a case-study viewer with captions and project facts. Add focus management and restore focus to the trigger when the modal closes.
6. Compress the 78.26 MB image library. Several individual project images are 8–9 MB. Use responsive WebP/AVIF variants and thumbnails; load full-resolution images only after opening a project.

## Accessibility risks

- Auto-advancing carousels need a visible pause control. The BBS carousel should also respect reduced-motion preference.
- Carousel dots are visually tiny and likely below a comfortable touch target.
- The modal does not visibly communicate keyboard focus or provide evidence of focus trapping from this audit.
- The contact form focuses an empty message field but does not provide an inline error message or announced status.
- Some labels and navigation text are very small, especially on mobile.

## Suggested delivery order

- v2.8.0: mobile layout fixes, one fixed CTA, resume and LinkedIn actions, and accessibility fixes.
- v2.9.0: featured-project grid plus three complete case studies.
- v2.9.1: image compression and responsive image loading.

## Evidence limits

The audit used fresh live screenshots and source inspection. It did not include screen-reader testing, full keyboard traversal, automated WCAG checks, or measured network performance on a throttled device. Therefore it does not claim WCAG compliance.
