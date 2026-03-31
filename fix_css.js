const fs = require('fs');
const path = 'c:/xampp/htdocs/network-baba/network-baba/NB-Employer-Next/styles/allPostJobs.module.css';

try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split(/\r?\n/);

    // Truncate at line 1919 (0-indexed 1918)
    const newLines = lines.slice(0, 1919);

    const footer = [
        "",
        "@keyframes spinAnim {",
        "  0% { transform: rotate(0deg); }",
        "  100% { transform: rotate(360deg); }",
        "}"
    ];

    fs.writeFileSync(path, newLines.join('\n') + footer.join('\n'), 'utf8');
    console.log("Fixed CSS file using Node.js.");
} catch (err) {
    console.error(err);
}
