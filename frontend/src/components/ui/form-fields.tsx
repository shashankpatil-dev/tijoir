"use client";

import { useState } from "react";

type BaseFieldProps = {
  label: string;
  value: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  hint,
  disabled = false,
}: BaseFieldProps & {
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm leading-5 outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-ring)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
      {hint ? (
        <span className="mt-2 block text-xs leading-5 text-[var(--color-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  required = true,
  hint,
  disabled = false,
}: BaseFieldProps & {
  onChange: (value: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <div className="mt-2 flex min-h-11 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white focus-within:border-[var(--color-brand)] focus-within:ring-4 focus-within:ring-[var(--color-brand-ring)]">
        <input
          className="w-full border-0 bg-transparent px-4 py-2.5 text-sm leading-5 outline-none"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          type={revealed ? "text" : "password"}
          value={value}
        />
        <button
          className="border-l border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface)]"
          onClick={() => setRevealed((current) => !current)}
          type="button"
        >
          {revealed ? "Hide" : "Show"}
        </button>
      </div>
      {hint ? (
        <span className="mt-2 block text-xs leading-5 text-[var(--color-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows,
  required = true,
  hint,
  disabled = false,
}: BaseFieldProps & {
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <textarea
        className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-ring)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={rows}
        value={value}
      />
      {hint ? (
        <span className="mt-2 block text-xs leading-5 text-[var(--color-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  disabled = false,
}: BaseFieldProps & {
  onChange: (value: string) => void;
  options: Array<string | { label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <select
        className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm leading-5 outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-ring)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => {
          const normalized =
            typeof option === "string"
              ? { label: option, value: option }
              : option;
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
      {hint ? (
        <span className="mt-2 block text-xs leading-5 text-[var(--color-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
