"use client";

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

export function FormField({ label, required, children, hint }: FormFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ children, ...props }: SelectProps) {
  return (
    <select
      className="input"
      style={{ appearance: "none", cursor: "pointer" }}
      {...props}
    >
      {children}
    </select>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ ...props }: TextareaProps) {
  return (
    <textarea
      className="input"
      style={{ resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
      {...props}
    />
  );
}

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  );
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end", gap: 10,
      marginTop: 24, paddingTop: 20,
      borderTop: "1px solid var(--border-color)",
    }}>
      {children}
    </div>
  );
}
