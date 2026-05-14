const XLSX = require('xlsx');
const workbook = XLSX.readFile('public/nConnect Module Status.xlsx');
const deployedSheet = workbook.Sheets['Recently Deployed'];
const ongoingSheet = workbook.Sheets['On going'];
const upcomingSheet = workbook.Sheets['Up coming'];

const deployedJson = XLSX.utils.sheet_to_json(deployedSheet, { defval: '' });
console.log("Deployed Modules:");
deployedJson.forEach(row => console.log(" - " + (row['Module'] || row['Title'] || row['Name'] || Object.values(row)[0])));

console.log("\nUpcoming Modules:");
if (upcomingSheet) {
    const upcomingJson = XLSX.utils.sheet_to_json(upcomingSheet, { defval: '' });
    upcomingJson.forEach(row => console.log(" - " + (row['Module'] || row['Title'] || row['Name'] || Object.values(row)[0])));
}
