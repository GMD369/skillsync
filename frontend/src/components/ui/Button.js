// Reusable button used across all pages.
export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
