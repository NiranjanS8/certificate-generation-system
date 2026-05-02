export function Button({ children, onClick, variant = "primary", size = "md", disabled = false, type = "button", fullWidth = false }) {
  const variants = {
    primary: "bg-[#5682B1] text-[#000000] hover:bg-[#739EC9]",
    secondary: "bg-[#1a1a1a] text-[#FFE8DB] border border-[#2a2a2a] hover:bg-[#2a2a2a]",
    ghost: "text-[#FFE8DB] hover:bg-[#1a1a1a]",
    danger: "bg-[#dc2626] text-[#FFE8DB] hover:bg-[#b91c1c]",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""}`}>
      {children}
    </button>
  );
}
