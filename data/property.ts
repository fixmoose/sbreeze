// ─────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the listing.
// Edit numbers/text here and the whole site updates. No code knowledge needed.
// Dollar amounts are plain numbers; the site formats them.
// ─────────────────────────────────────────────────────────────────────────

export const property = {
  name: "Sunset Breeze",
  addressLine: "8770 Sunset Breeze Dr.",
  city: "Reno",
  state: "NV",
  zip: "89506",
  beds: 3,
  baths: 2.5,
  sqft: 1350,
  type: "Townhouse (one shared wall, no HOA)",
  availability: "Available now — move-in ready, professionally cleaned",

  // Headline rent. This is what you advertise. Solar + battery is INCLUDED.
  rent: 2395,

  // Refundable security deposit you will ask a well-qualified applicant for.
  // Nevada (NRS 118A.242) caps TOTAL deposits (security + pet) at 3x rent.
  // 1x is competitive; you may raise to 1.5x for borderline credit.
  securityDeposit: 2395,
  securityDepositMaxNote:
    "Equal to one month's rent for well-qualified applicants. May be set higher (up to the legal maximum of 3× monthly rent, including any pet deposit) based on screening results.",

  leaseTermMonths: 12,
};

// ── What the rent includes / excludes ──────────────────────────────────────
export const utilities = {
  includedInRent: [
    "Solar + battery system — included (no extra charge)",
    "Garbage / trash service",
    "Sewer",
  ],
  paidByTenant: [
    "Electricity — the NV Energy account stays in the owner's name (required to keep the solar net-metering credit). The monthly NV Energy bill is forwarded to the tenant to pay.",
    "Water",
    "Internet / cable",
  ],
  solarMonthly: 0, // solar is bundled into rent now (kept for reference)
};

// ── Property highlights for the marketing section ──────────────────────────
export const features = [
  { icon: "⛳", title: "Golf course view", desc: "Backs directly onto the golf course — no rear neighbor behind you." },
  { icon: "☀️", title: "Solar + battery backup", desc: "Lower power bills and resilience during outages — included in the rent." },
  { icon: "🔌", title: "2× EV chargers", desc: "Charge two electric vehicles at home." },
  { icon: "🍳", title: "Newer kitchen + fridge", desc: "Updated kitchen with a newer refrigerator included." },
  { icon: "🪵", title: "New flooring upstairs", desc: "Brand-new flooring throughout the upper level — no carpet." },
  { icon: "🛁", title: "3 bed / 2.5 bath", desc: "~1,350 sq ft of comfortable, move-in-ready space." },
  { icon: "🏡", title: "Townhouse, no HOA", desc: "Only one shared (side) wall; no HOA dues or rules." },
  { icon: "🤝", title: "Rent direct from the owner", desc: "Apply on this site and rent directly from the owner — no third-party rental or management agency, and no agency fees." },
];

// ── Rental criteria (applied equally to EVERY applicant) ────────────────────
// Stating these publicly and applying them uniformly is your best protection
// against a fair-housing complaint. Keep them objective and consistent.
export const criteria = {
  incomeMultiple: 3, // combined gross household income must be >= 3x rent
  minCreditScore: 620,
  evictionLookbackYears: 5,
  items: [
    "Combined gross household income of at least 3× the monthly rent (≈ $7,185/month).",
    "Verifiable income/employment (pay stubs, offer letter, or bank statements; tax returns if self-employed).",
    "Minimum credit score of 620. Lower scores may still qualify with a higher deposit or a qualified co-signer.",
    "No prior eviction judgments (unlawful detainer) in the last 5 years.",
    "No outstanding landlord/property-related money judgments.",
    "Positive references from prior landlords.",
    "No conviction history that poses a demonstrable risk to the safety of residents or the property (assessed individually — see note below).",
    "Valid government-issued photo ID and a truthful, complete application.",
  ],
  fairnessNote:
    "These criteria are applied to every applicant equally. Criminal history is reviewed individually based on the nature, severity, and recency of the offense — not as an automatic disqualifier — consistent with HUD guidance.",
};

// ── Pets ────────────────────────────────────────────────────────────────────
export const pets = {
  allowed: "Case-by-case",
  maxPets: 2,
  petDepositPerPet: 400, // refundable; counts toward the 3x total-deposit cap
  petRentPerPetMonthly: 35,
  policy: [
    "Pets considered case-by-case — tell us about yours in the application.",
    "Maximum of 2 pets.",
    "Refundable pet deposit of $400 per pet, plus $35/month pet rent per pet.",
    "Breed and weight restrictions apply (e.g., we cannot accommodate certain high-liability breeds; a single calm, well-behaved large dog may be fine — two of a restricted breed would not).",
    "All pets must be spayed/neutered, vaccinated, and licensed as required by Washoe County.",
  ],
  serviceAnimalNote:
    "Service animals and approved assistance/emotional-support animals are NOT pets under fair-housing law. No pet deposit, pet rent, breed, or weight restriction applies to them, and they are approved as a reasonable accommodation with appropriate documentation.",
};

// ── Occupancy ───────────────────────────────────────────────────────────────
export const occupancy = {
  maxPersons: 6, // 2 per bedroom — HUD "presumptively reasonable" standard
  policy: [
    "Occupancy is limited to 2 persons per bedroom (maximum 6 residents) — based on the size and design of the home, consistent with HUD occupancy guidance.",
    "Every adult (18+) who will live in the home must be named on the lease and submit an application.",
    "Guests staying more than 14 consecutive days, or more than 30 days total in a 12-month period, must be approved and added to the lease.",
    "This limit is based on unit size, not on family makeup, and is applied to all applicants equally.",
  ],
};

// ── Other lease requirements ────────────────────────────────────────────────
export const requirements = [
  {
    title: "Renter's insurance (required)",
    body:
      "Tenant must carry renter's (tenant) insurance with at least $100,000 in personal liability coverage for the full lease term, naming the owner as an 'interested party.' Proof is required before move-in.",
  },
  {
    title: "Vehicles",
    body:
      "Only operational vehicles that are currently registered and insured may be parked on the property. No unregistered, uninsured, or inoperable vehicles; no vehicle repairs or fluid changes on-site. Parking is limited to the garage and driveway.",
  },
  {
    title: "No smoking (entire property)",
    body:
      "No smoking or vaping of any kind anywhere on the property — indoors or outdoors, including the garage, patio/balcony, and any shared areas.",
  },
  {
    title: "Lease term",
    body: "12-month lease. Rent is due on the 1st of each month.",
  },
  {
    title: "Shared wall",
    body:
      "This townhouse shares one (side) wall with the neighboring unit. There is no rear neighbor — the back faces the golf course. Quiet hours and considerate-neighbor conduct apply.",
  },
];

// ── Required / standard disclosures (Nevada) ────────────────────────────────
// Fill the bracketed [ ] items before going live.
export const disclosures = [
  {
    title: "Owner / manager contact (NRS 118A.260)",
    body:
      "Owner: [YOUR NAME]. Person authorized to manage the premises and to receive notices and service of process: [NAME], [ADDRESS], [PHONE/EMAIL]. Emergency contact within 60 miles of the property: [NAME / PHONE].",
  },
  {
    title: "Foreclosure (NRS 118A.275)",
    body:
      "The property is NOT the subject of any foreclosure proceeding. (Update this statement if that ever changes — disclosure is required by law.)",
  },
  {
    title: "Lead-based paint",
    body:
      "Federal lead-paint disclosure and the EPA pamphlet apply only to homes built before 1978. If this home was built in 1978 or later, this does not apply. [Confirm build year and adjust.]",
  },
  {
    title: "Move-in condition checklist",
    body:
      "A signed move-in checklist documenting the condition of the home will be completed by the landlord and tenant together at move-in, as required by Nevada law. (The home is currently empty and professionally cleaned.)",
  },
  {
    title: "Nuisance",
    body:
      "Creating or allowing a nuisance on the property is prohibited and may be grounds for action under Nevada law.",
  },
  {
    title: "Flag display",
    body:
      "Tenants may display the American flag for personal use, consistent with Nevada law.",
  },
];

// ── Fair Housing statement (display prominently) ────────────────────────────
export const fairHousing = {
  short:
    "Equal Housing Opportunity. We do not discriminate, and all applicants are screened by the same written criteria.",
  long:
    "We are an Equal Housing Opportunity provider. We do not discriminate against any person because of race, color, religion or creed, national origin, ancestry, sex, sexual orientation, gender identity or expression, disability, familial status, or status as a victim of domestic violence, sexual assault, or stalking — as protected by the federal Fair Housing Act and Nevada law (NRS 118 & 233). Reasonable accommodations and modifications are available to persons with disabilities. Every application is evaluated using the same written rental criteria.",
};

// ── How screening actually works (sets honest expectations) ─────────────────
export const screeningProcess = {
  steps: [
    "Submit the short application on this site (no Social Security number or sensitive documents are collected here).",
    "If your application meets our criteria, we'll email you a secure link to complete a credit + background + eviction screening through a third-party service (TransUnion SmartMove or RentPrep). You enter your SSN directly with the screening provider — we never see or store it.",
    "We review screening results and prior-landlord references.",
    "Approved applicants sign the lease, provide proof of renter's insurance, pay the deposit and first month's rent, and complete a move-in checklist.",
  ],
  screeningFeeNote:
    "The third-party screening fee (typically ~$35–$45) is paid by the applicant directly to the screening provider. We do not collect or hold this fee.",
};

// ── Contact ─────────────────────────────────────────────────────────────────
// No email is shown publicly (anti-scraper). Inquiries come through the contact
// form (sent via UniOne). The phone is revealed only on click.
export const contact = {
  phone: "775-350-3013",
  showingNote:
    "The home has a lockbox for scheduled self-showings. Use the form below to arrange a viewing time and receive the code.",
};

export const siteUrl = "https://sunsetbreeze-phi.vercel.app";

export function fullAddress() {
  return `${property.addressLine}, ${property.city}, ${property.state} ${property.zip}`;
}

export function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
