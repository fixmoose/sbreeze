"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplicationForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // Require the two consent checkboxes.
    if (!data.consent_screening || !data.certify_true) {
      setError("Please check both consent boxes at the bottom to submit.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Something went wrong. Please try again.");
      router.push("/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {error && <div className="error">{error}</div>}

      <fieldset className="fieldset">
        <legend>About you</legend>
        <div className="row2">
          <div className="field">
            <label htmlFor="full_name">Full legal name <span className="req">*</span></label>
            <input id="full_name" name="full_name" type="text" required />
          </div>
          <div className="field">
            <label htmlFor="dob_year">Year of birth <span className="hint">(must be 18+)</span></label>
            <input id="dob_year" name="dob_year" type="number" min={1920} max={2008} placeholder="e.g. 1990" />
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="email">Email <span className="req">*</span></label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone <span className="req">*</span></label>
            <input id="phone" name="phone" type="tel" required />
          </div>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Move-in & household</legend>
        <div className="row2">
          <div className="field">
            <label htmlFor="desired_move_in">Desired move-in date <span className="req">*</span></label>
            <input id="desired_move_in" name="desired_move_in" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="lease_term_ok">Can you commit to a 12-month lease? <span className="req">*</span></label>
            <select id="lease_term_ok" name="lease_term_ok" required defaultValue="">
              <option value="" disabled>Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="total_occupants">Total people who will live here <span className="req">*</span></label>
            <input id="total_occupants" name="total_occupants" type="number" min={1} max={6} required />
          </div>
          <div className="field">
            <label htmlFor="adults">Of those, how many are adults (18+)?</label>
            <input id="adults" name="adults" type="number" min={1} max={6} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="occupant_names">Names & ages of everyone moving in</label>
          <textarea id="occupant_names" name="occupant_names" placeholder="e.g. Jane Doe (32), John Doe (34), child (5)"></textarea>
          <span className="hint">Every adult (18+) must complete their own application and screening.</span>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Income & employment</legend>
        <div className="row2">
          <div className="field">
            <label htmlFor="employment_status">Employment status <span className="req">*</span></label>
            <select id="employment_status" name="employment_status" required defaultValue="">
              <option value="" disabled>Select…</option>
              <option>Employed (W-2)</option>
              <option>Self-employed</option>
              <option>Retired</option>
              <option>Student</option>
              <option>Other</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="monthly_income">Combined gross household income / month <span className="req">*</span></label>
            <input id="monthly_income" name="monthly_income" type="number" min={0} placeholder="e.g. 7500" required />
            <span className="hint">We look for ≈ 3× the rent. Income from any lawful source counts.</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="employer">Employer / source of income</label>
          <input id="employer" name="employer" type="text" />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Pets & vehicles</legend>
        <div className="field">
          <label htmlFor="pets">Do you have pets? If so, describe them.</label>
          <textarea id="pets" name="pets" placeholder="Type, breed, weight, age, and how many. Write 'none' if no pets."></textarea>
          <span className="hint">Pets are considered case-by-case. Service / assistance animals are not pets and have no pet fees.</span>
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="vehicles">How many vehicles?</label>
            <input id="vehicles" name="vehicles" type="number" min={0} max={6} />
          </div>
          <div className="field">
            <label htmlFor="vehicles_registered">Are all vehicles registered & insured?</label>
            <select id="vehicles_registered" name="vehicles_registered" defaultValue="">
              <option value="" disabled>Select…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="smoker">Does anyone in the household smoke or vape?</label>
          <select id="smoker" name="smoker" defaultValue="">
            <option value="" disabled>Select…</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
          <span className="hint">No smoking/vaping anywhere on the property — indoors or outdoors.</span>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Rental history</legend>
        <div className="field">
          <label htmlFor="current_address">Current address</label>
          <input id="current_address" name="current_address" type="text" />
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="landlord_contact">Current landlord name & phone</label>
            <input id="landlord_contact" name="landlord_contact" type="text" />
          </div>
          <div className="field">
            <label htmlFor="reason_moving">Reason for moving</label>
            <input id="reason_moving" name="reason_moving" type="text" />
          </div>
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="ever_evicted">Ever been evicted?</label>
            <select id="ever_evicted" name="ever_evicted" defaultValue="">
              <option value="" disabled>Select…</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="bankruptcy">Bankruptcy in the last 5 years?</label>
            <select id="bankruptcy" name="bankruptcy" defaultValue="">
              <option value="" disabled>Select…</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="notes">Anything else we should know?</label>
          <textarea id="notes" name="notes"></textarea>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Consent</legend>
        <div className="check">
          <input id="consent_screening" name="consent_screening" type="checkbox" value="yes" />
          <label htmlFor="consent_screening">
            I authorize the owner to verify the information above and, if my application meets the
            published criteria, to send me a secure link to complete a credit, background, and
            eviction screening through a third-party service (e.g., TransUnion SmartMove). I
            understand I will enter my SSN directly with that provider and that the owner does not
            collect or store it. <span className="req">*</span>
          </label>
        </div>
        <div className="check">
          <input id="certify_true" name="certify_true" type="checkbox" value="yes" />
          <label htmlFor="certify_true">
            I certify that the information I have provided is true and complete. <span className="req">*</span>
          </label>
        </div>
        <p className="small muted">
          We do not collect Social Security numbers, bank logins, or document uploads on this form.
          Equal Housing Opportunity — every application is evaluated using the same written criteria.
        </p>
      </fieldset>

      <button className="btn big" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
