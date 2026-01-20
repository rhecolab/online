export function saveData(subjID, taskName, data) {

  const date = new Date().toISOString().split('T')[0].replace(/-/g, "");
  const filename = `${subjID}_${taskName}_${date}`;

  // Get all keys from first row (columns)
  const fields = Object.keys(data[0]);

  // Add subject + task + fields to header
  let csvContent = "sub," + fields.join(",") + ",taskName\n";

  data.forEach(row => {
    const rowValues = fields.map(f => row[f] ?? "");
    csvContent += `${subjID},${rowValues.join(",")},${taskName}\n`;
  });

  fetch('/save-results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: filename,
      csv: csvContent
    })
  })
  .then(res => res.text())
  .then(msg => console.log("saved", msg))
  .catch(err => console.error("error:", err));
}
