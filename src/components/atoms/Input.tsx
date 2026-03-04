import { InputHTMLAttributes, forwardRef } from "react";
import { colors } from "@/lib/constants/colors";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, rightElement, id, ...props }, ref) => {
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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-md px-3 py-2 text-sm font-mono
              border transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:opacity-50 disabled:cursor-not-allowed
              ${rightElement ? "pr-10" : ""}
              ${className}
            `}
            style={{
              backgroundColor: colors.box,
              borderColor: error ? colors.red : colors.boxOutline,
              color: colors.textPrimary,
              // @ts-expect-error CSS custom property
              "--tw-ring-color": error ? colors.red : undefined,
              ...props.style,
            }}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center h-full">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p
            className="mt-1 text-xs font-medium ml-1"
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
