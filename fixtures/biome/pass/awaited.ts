async function load(): Promise<string> {
  return "data";
}

export async function main(): Promise<string> {
  return await load();
}
