import "../../styles/Button.css";

function Button({ title, onClick, variant = "primary", size = "md", block = false, disabled = false, loading = false, type = "button", children, ...props }) {
  const classNames = [
    "btn",
    `btn-${variant}`,
    size !== "md" && `btn-${size}`,
    block && "btn-block",
    loading && "btn-loading",
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? null : (children || title)}
    </button>
  );
}

export default Button;