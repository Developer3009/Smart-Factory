export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0, background: "#0f172a", fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
