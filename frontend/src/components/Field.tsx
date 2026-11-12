import type { InputHTMLAttributes } from 'react';

// Every input gets a real <label> (needed for Lighthouse accessibility).
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

function Field({ id, label, ...inputProps }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} {...inputProps} />
    </div>
  );
}

export default Field;
