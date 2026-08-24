import { TextareaHTMLAttributes, forwardRef, useId } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ label, error, id, className = "", ...rest }, ref) => {
  const autoId = useId();
  const textId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textId} className="mb-1.5 block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textId}
        aria-invalid={!!error}
        className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-text placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-bg disabled:text-muted ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";
