const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://musabadmin:P2218515LXjv.@cluster0.nl94zep.mongodb.net/habit-mood-tracker?retryWrites=true&w=majority&appName=Cluster0";

const templates = [
  { name: "10-minute walk", identityTag: "runner", description: "Any walk counts — even around the block.", suggestedGraceDays: 1, color: "#7A9C6B" },
  { name: "Stretch for 5 minutes", identityTag: "runner", description: "Post-workout or before bed.", suggestedGraceDays: 2, color: "#7A9C6B" },
  { name: "Run or jog", identityTag: "runner", description: "Any distance, any pace.", suggestedGraceDays: 2, color: "#7A9C6B" },
  { name: "Read 10 pages", identityTag: "reader", description: "Roughly 10 minutes. Books, articles, anything.", suggestedGraceDays: 2, color: "#B98319" },
  { name: "Read for 15 minutes", identityTag: "reader", description: "Set a timer, no goal beyond time.", suggestedGraceDays: 2, color: "#B98319" },
  { name: "Meditate for 5 minutes", identityTag: "mindful", description: "Any style — guided, breath, body scan.", suggestedGraceDays: 3, color: "#9FB893" },
  { name: "Journal one sentence", identityTag: "mindful", description: "Just one sentence about your day.", suggestedGraceDays: 2, color: "#9FB893" },
  { name: "No phone for first 30 min after waking", identityTag: "mindful", description: "Resist the urge to scroll.", suggestedGraceDays: 2, color: "#9FB893" },
  { name: "Drink a glass of water", identityTag: "healthy", description: "First thing in the morning.", suggestedGraceDays: 1, color: "#5C7E4D" },
  { name: "Eat a vegetable", identityTag: "healthy", description: "Any vegetable, any portion.", suggestedGraceDays: 1, color: "#5C7E4D" },
  { name: "Sleep before 11pm", identityTag: "healthy", description: "Phone in another room helps.", suggestedGraceDays: 2, color: "#5C7E4D" },
  { name: "Make something for 10 minutes", identityTag: "creative", description: "Draw, write, code, cook, build — anything creative.", suggestedGraceDays: 2, color: "#E0A526" },
  { name: "Write 3 sentences", identityTag: "creative", description: "Morning pages, journal, fiction — any 3 sentences.", suggestedGraceDays: 2, color: "#E0A526" },
];

async function main() {
  console.log("Connecting to MongoDB...");
  const client = await MongoClient.connect(uri);
  console.log("Connected.");
  const db = client.db();
  const col = db.collection("habittemplates");
  for (const t of templates) {
    await col.updateOne(
      { identityTag: t.identityTag, name: t.name },
      { $set: t },
      { upsert: true }
    );
    console.log("  + " + t.identityTag + ": " + t.name);
  }
  console.log("\nSeeded " + templates.length + " templates.");
  await client.close();
}
main().catch(e => { console.error(e); process.exit(1); });
