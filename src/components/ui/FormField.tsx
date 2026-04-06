import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react"

const baseInputStyles =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c] disabled:bg-gray-50 disabled:text-gray-500"

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children?: ReactNode
}

function FieldWrapper({ label, error, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

interface InputFieldProps
  extends FormFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "children"> {}

export function InputField({
  label,
  error,
  required,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <input
        required={required}
        className={`${baseInputStyles} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`}
        {...props}
      />
    </FieldWrapper>
  )
}

interface TextareaFieldProps
  extends FormFieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "children"> {}

export function TextareaField({
  label,
  error,
  required,
  className = "",
  ...props
}: TextareaFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <textarea
        required={required}
        className={`${baseInputStyles} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`}
        {...props}
      />
    </FieldWrapper>
  )
}

interface SelectFieldProps
  extends FormFieldProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({
  label,
  error,
  required,
  options,
  placeholder,
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <select
        required={required}
        className={`${baseInputStyles} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}
