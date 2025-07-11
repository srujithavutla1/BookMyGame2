import { cn } from "@/app/utils/cn";

type ButtonVariant = "default" | "primary" | "danger" | "secondary" | "ghost" | "microsoft";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg"; // Added size prop
}

export function Button({
  variant = "default",
  size = "md", // Default size
  className,
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    primary: "bg-[#1D7874] text-white hover:bg-[#145955] focus:ring-[#1D7874]",
    danger: "bg-[#EE2E31] text-white hover:bg-[#D11A1D] focus:ring-[#EE2E31]",
    secondary: "bg-[#679289] text-white hover:bg-[#557A72] focus:ring-[#679289]",
    ghost: "bg-transparent text-gray-800 hover:bg-gray-100",
    microsoft: "bg-[#2F2F2F] text-white hover:bg-[#1E1E1E] focus:ring-[#2F2F2F]"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <button
      className={cn(
        "rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
        isLoading && "opacity-70 cursor-not-allowed"
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}