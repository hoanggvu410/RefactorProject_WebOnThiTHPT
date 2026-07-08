export default function Toast({ toast, message, type = "success" }) {
  const toastMessage = typeof toast === "object" ? toast.message : toast || message;
  const toastType = typeof toast === "object" ? toast.type : type;

  if (!toastMessage) return null;

  return (
    <div className={`toast ${toastType === "error" ? "error" : "success"}`}>
      <span>{toastType === "error" ? "!" : "✓"}</span>
      <span>{toastMessage}</span>
    </div>
  );
}
