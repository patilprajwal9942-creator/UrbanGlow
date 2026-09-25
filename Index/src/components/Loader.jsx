import "../../styles/Loader.css";

function Loader({ overlay = false }) {
  const content = (
    <div className="loader-container">
      <div className="loader-spinner" />
      <p className="loader-text">Loading...</p>
    </div>
  );

  if (overlay) {
    return <div className="loader-overlay">{content}</div>;
  }

  return content;
}

export default Loader;