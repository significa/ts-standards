function Checkbox() {
  return <input type="checkbox" />;
}

export function Field() {
  return (
    <label>
      <span>Name</span>
      <Checkbox />
    </label>
  );
}
