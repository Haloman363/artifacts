import BackButton from "./BackButton.jsx";

export default function Pomodoro() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <BackButton />
      <iframe
        src="/artifacts/pomodoro.html"
        style={{ flex: 1, border: "none", width: "100%", display: "block" }}
        title="Pomodoro Timer"
      />
    </div>
  );
}
