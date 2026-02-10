import { InputHTMLAttributes, forwardRef } from "react";
import { colors } from "@/lib/constants/colors";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1 font-mono"
            style={{ color: colors.textSecondary }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-md px-3 py-2 text-sm font-mono
            border transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          style={{
            backgroundColor: colors.box,
            borderColor: colors.boxOutline,
            color: colors.textPrimary,
          }}
          {...props}
        />
        {error && (
          <p
            className="mt-1 text-xs font-mono"
            style={{ color: colors.red }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
